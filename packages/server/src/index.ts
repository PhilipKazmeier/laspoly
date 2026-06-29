import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";
import { applyCommand, botDecide, currentPlayer, formatEvent } from "@laspoly/shared";
import type { GameEvent, Locale } from "@laspoly/shared";
import { RoomManager, GameRoom, pickAutoAction } from "./room.js";
import type { ClientMessage, ServerMessage } from "@laspoly/shared";

const PORT = Number(process.env["PORT"] ?? 8080);
const VERSION = process.env["npm_package_version"] ?? "0.1.0";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CLIENT_DIST = join(__dirname, "../../client/dist");
const HAS_CLIENT = existsSync(CLIENT_DIST);

// ---- Constants -------------------------------------------------------------

const MAX_NICKNAME_LEN = 24;
const MAX_CHAT_LEN = 500;
const MAX_ROOM_NAME_LEN = 60;
const MAX_ROOMS = 50;
const MAX_ROOMS_PER_CONN = 3;
const MAX_PLAYERS_PER_ROOM = 6;
const MAX_BOT_COUNT = 5;
const MAX_WS_PAYLOAD = 8 * 1024;
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 1000;
const PING_INTERVAL_MS = 30_000;
const TURN_TIMER_SECONDS = 60;

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

// ---- Logging ---------------------------------------------------------------

function ts(): string {
  return new Date().toTimeString().slice(0, 8);
}

function log(msg: string): void {
  console.log(`[${ts()}] ${msg}`);
}

// ---- HTTP server -----------------------------------------------------------

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  // Health endpoint for container/orchestrator health checks
  if (req.url === "/health" || req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", version: VERSION }));
    return;
  }

  if (!HAS_CLIENT) {
    res.writeHead(200);
    res.end("LasPoly server running. No client dist found.");
    return;
  }
  let pathname = new URL(req.url ?? "/", `http://localhost`).pathname;
  if (pathname === "/" || !extname(pathname)) pathname = "/index.html";
  const filePath = resolve(join(CLIENT_DIST, pathname));
  if (!filePath.startsWith(CLIENT_DIST + "/") && filePath !== CLIENT_DIST) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  if (!existsSync(filePath)) {
    const index = join(CLIENT_DIST, "index.html");
    if (existsSync(index)) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(readFileSync(index));
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
    return;
  }
  const mime = MIME[extname(filePath)] ?? "application/octet-stream";
  res.writeHead(200, { "Content-Type": mime });
  res.end(readFileSync(filePath));
});

// ---- WebSocket server ------------------------------------------------------

const allowedOrigins = process.env["ALLOWED_ORIGINS"]
  ? process.env["ALLOWED_ORIGINS"].split(",").map((o) => o.trim())
  : null;

const wss = new WebSocketServer({
  server: httpServer,
  maxPayload: MAX_WS_PAYLOAD,
  verifyClient: ({ req }: { req: IncomingMessage }) => {
    if (!allowedOrigins) return true;
    const origin = req.headers["origin"] ?? "";
    return allowedOrigins.includes(origin);
  },
});

const rooms = new RoomManager();

// ---- Turn timer ------------------------------------------------------------

/** Per-room turn timer handles: { timerId, playerId } */
const turnTimers = new Map<string, { timer: ReturnType<typeof setTimeout>; playerId: string }>();

function cancelTurnTimer(roomId: string): void {
  const existing = turnTimers.get(roomId);
  if (existing) {
    clearTimeout(existing.timer);
    turnTimers.delete(roomId);
  }
}

function scheduleTurnTimer(room: GameRoom): void {
  if (!room.state || room.state.phase === "finished") return;
  const cp = currentPlayer(room.state);
  // Only start timer for human (connected) players
  const lobby = room.players.find((p) => p.id === cp.id);
  if (cp.isBot || !lobby || !lobby.connected) return;

  cancelTurnTimer(room.id);
  const playerId = cp.id;
  let secondsLeft = TURN_TIMER_SECONDS;

  // Broadcast initial timer to room
  broadcastToRoom(room, { t: "turnTimer", playerId, secondsLeft });

  const tick = (): void => {
    secondsLeft -= 1;
    if (!room.state || room.state.phase === "finished") {
      cancelTurnTimer(room.id);
      return;
    }
    // Check player is still current and connected
    const nowCp = currentPlayer(room.state);
    if (nowCp.id !== playerId) {
      cancelTurnTimer(room.id);
      return;
    }
    if (secondsLeft > 0) {
      broadcastToRoom(room, { t: "turnTimer", playerId, secondsLeft });
      const timer = setTimeout(tick, 1000);
      timer.unref?.();
      turnTimers.set(room.id, { timer, playerId });
      return;
    }
    // Timer expired: apply auto-action
    turnTimers.delete(room.id);
    try {
      const action = pickAutoAction(room.state, playerId);
      if (action) {
        const result = applyCommand(room.state, action);
        room.state = result.state;
        log(`room:${room.id} AFK auto-action for ${nowCp.name}: ${action.type}`);
        broadcastState(room, result.events);
        if (room.state.phase === "finished" && room.state.winnerId) {
          const winner = room.state.players.find((p) => p.id === room.state!.winnerId);
          if (winner) {
            broadcastToRoom(room, { t: "gameOver", winnerId: winner.id, winnerName: winner.name });
          }
          return;
        }
        if (room.currentIsBot()) scheduleBotSteps(room);
        else scheduleTurnTimer(room);
      }
    } catch (err) {
      log(`room:${room.id} AFK auto-action error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const timer = setTimeout(tick, 1000);
  timer.unref?.();
  turnTimers.set(room.id, { timer, playerId });
}

interface ConnState {
  roomId: string | null;
  playerId: string | null;
  msgCount: number;
  msgWindowStart: number;
  roomsCreated: number;
  pendingPing: number | null;
  locale: "de" | "en";
}

const connState = new WeakMap<WebSocket, ConnState>();

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function sendError(ws: WebSocket, message: string): void {
  send(ws, { t: "error", message });
}

function broadcastToRoom(room: GameRoom, msg: ServerMessage, except?: WebSocket): void {
  for (const [ws] of getRoomConns(room.id)) {
    if (ws !== except) send(ws, msg);
  }
}

/** Format raw game events per-connection locale, cache by locale for efficiency. */
function formatEventsForConn(rawEvents: GameEvent[], locale: Locale) {
  return rawEvents.map((e) => ({
    key: e.key,
    text: formatEvent(e, locale),
    playerId: e.playerId,
  }));
}

/** Broadcast a state+events message, formatting events in each recipient's locale. */
function broadcastState(room: GameRoom, rawEvents: GameEvent[], except?: WebSocket): void {
  // Group by locale to format once per distinct locale
  const cache = new Map<Locale, ReturnType<typeof formatEventsForConn>>();
  for (const [ws, cs] of getRoomConns(room.id)) {
    if (ws === except) continue;
    const locale = cs.locale;
    if (!cache.has(locale)) cache.set(locale, formatEventsForConn(rawEvents, locale));
    send(ws, { t: "state", state: room.state!, events: cache.get(locale)! });
  }
}

function* getRoomConns(roomId: string): Generator<[WebSocket, ConnState]> {
  for (const [ws, state] of allConns()) {
    if (state.roomId === roomId) yield [ws, state];
  }
}

function* allConns(): Generator<[WebSocket, ConnState]> {
  for (const client of wss.clients) {
    const s = connState.get(client);
    if (s) yield [client, s];
  }
}

function broadcastRoomList(): void {
  const msg: ServerMessage = { t: "rooms", rooms: rooms.list().map((r) => r.toSummary()) };
  for (const [ws, state] of allConns()) {
    if (!state.roomId) send(ws, msg);
  }
}

/**
 * Disassociate a connection from its current room (auto-leave).
 * Broadcasts room update and cleans up empty/finished rooms.
 */
function autoLeave(cs: ConnState): void {
  if (!cs.roomId || !cs.playerId) return;
  const room = rooms.get(cs.roomId);
  if (room) {
    room.removeHuman(cs.playerId);
    // Clean up: delete room if empty of humans or if game finished and no one left
    const humanCount = room.players.filter((p) => !p.isBot).length;
    const allDisconnected = room.players.filter((p) => !p.isBot).every((p) => !p.connected);
    if (humanCount === 0 || (room.started && room.state?.phase === "finished" && allDisconnected)) {
      rooms.delete(room.id);
    } else {
      broadcastToRoom(room, { t: "room", room: room.toView() });
    }
  }
  cs.roomId = null;
  cs.playerId = null;
}

/** Drive bots in steps with delay between each, broadcasting state each time. */
function scheduleBotSteps(room: GameRoom, delayMs = 700): void {
  if (!room.state || room.state.phase === "finished") return;
  if (!room.currentIsBot()) return;

  setTimeout(() => {
    if (!room.state || room.state.phase === "finished") return;
    if (!room.currentIsBot()) return;

    try {
      const cp = currentPlayer(room.state!);
      const cmd = botDecide(room.state!);
      const result = applyCommand(room.state!, cmd);
      room.state = result.state;

      log(`room:${room.id} ${cp.name} (bot) → ${cmd.type}`);

      broadcastState(room, result.events);

      if (room.state.phase === "finished" && room.state.winnerId) {
        const winner = room.state.players.find((p) => p.id === room.state!.winnerId);
        if (winner) {
          log(`room:${room.id} game over — winner: ${winner.name}`);
          broadcastToRoom(room, { t: "gameOver", winnerId: winner.id, winnerName: winner.name });
        }
        // Disassociate all connections from the finished room and clean up
        for (const [, rcs] of getRoomConns(room.id)) {
          rcs.roomId = null;
          rcs.playerId = null;
        }
        rooms.delete(room.id);
        broadcastRoomList();
        return;
      }

      // Log notable events
      for (const ev of result.events) {
        if (ev.key === "went_to_jail") log(`room:${room.id} ${cp.name} → jail`);
        if (ev.key === "bankrupt") log(`room:${room.id} ${cp.name} went bankrupt`);
      }

      if (room.currentIsBot()) {
        scheduleBotSteps(room, delayMs);
      } else {
        // Human's turn now — start the turn timer
        scheduleTurnTimer(room);
      }
    } catch (err) {
      log(`room:${room.id} bot step error: ${err instanceof Error ? err.message : String(err)} — rescheduling`);
      scheduleBotSteps(room, delayMs * 2);
    }
  }, delayMs);
}

// ---- Heartbeat -------------------------------------------------------------

const pingInterval = setInterval(() => {
  for (const [ws, cs] of allConns()) {
    if (cs.pendingPing !== null) {
      ws.terminate();
    } else {
      ws.ping();
      cs.pendingPing = Date.now();
    }
  }
}, PING_INTERVAL_MS);

pingInterval.unref?.();

// ---- Validation helpers ----------------------------------------------------

function isStr(v: unknown): v is string { return typeof v === "string"; }
function isFiniteInt(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && Number.isInteger(v);
}
function isBool(v: unknown): v is boolean { return typeof v === "boolean"; }
function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function isArr(v: unknown): v is unknown[] { return Array.isArray(v); }

function validateCommand(cmd: unknown): string | null {
  if (!isObj(cmd)) return "command must be an object";
  const type = cmd["type"];
  if (!isStr(type)) return "command.type must be a string";
  switch (type) {
    case "ROLL_DICE": case "BUY_PROPERTY": case "DECLINE_PROPERTY": case "PAY_RANSOM": case "END_TURN": break;
    case "BUILD": {
      const pos = cmd["pos"]; const building = cmd["building"];
      if (!isFiniteInt(pos) || pos < 0 || pos > 39) return "BUILD.pos must be integer 0–39";
      if (!isStr(building) || !["house","hotel","factory"].includes(building))
        return "BUILD.building must be 'house', 'hotel', or 'factory'";
      break;
    }
    case "SELL_BUILDING": case "MORTGAGE": case "UNMORTGAGE": case "SELL_PROPERTY": {
      const pos = cmd["pos"];
      if (!isFiniteInt(pos) || pos < 0 || pos > 39) return `${type}.pos must be integer 0–39`;
      break;
    }
    case "TRAVEL": {
      const toPos = cmd["toPos"];
      if (!isFiniteInt(toPos) || toPos < 0 || toPos > 39) return "TRAVEL.toPos must be integer 0–39";
      break;
    }
    case "PROPOSE_SWAP": {
      const toId = cmd["toId"]; const give = cmd["give"]; const receive = cmd["receive"];
      if (!isStr(toId)) return "PROPOSE_SWAP.toId must be a string";
      if (!isObj(give)) return "PROPOSE_SWAP.give must be an object";
      if (!isObj(receive)) return "PROPOSE_SWAP.receive must be an object";
      if (!isFiniteInt(give["money"]) || (give["money"] as number) < 0)
        return "PROPOSE_SWAP.give.money must be a non-negative integer";
      if (!isFiniteInt(receive["money"]) || (receive["money"] as number) < 0)
        return "PROPOSE_SWAP.receive.money must be a non-negative integer";
      if (!isArr(give["props"]) || (give["props"] as unknown[]).length > 40)
        return "PROPOSE_SWAP.give.props must be an array (max 40 entries)";
      if (!isArr(receive["props"]) || (receive["props"] as unknown[]).length > 40)
        return "PROPOSE_SWAP.receive.props must be an array (max 40 entries)";
      for (const pos of give["props"] as unknown[]) {
        if (!isFiniteInt(pos) || (pos as number) < 0 || (pos as number) > 39)
          return "PROPOSE_SWAP.give.props entries must be integers 0–39";
      }
      for (const pos of receive["props"] as unknown[]) {
        if (!isFiniteInt(pos) || (pos as number) < 0 || (pos as number) > 39)
          return "PROPOSE_SWAP.receive.props entries must be integers 0–39";
      }
      break;
    }
    case "RESPOND_SWAP": {
      if (!isBool(cmd["accept"])) return "RESPOND_SWAP.accept must be a boolean";
      break;
    }
    case "SURRENDER": break;
    default: return `unknown command type: ${String(type)}`;
  }
  return null;
}

// ---- Message handling ------------------------------------------------------

wss.on("connection", (ws: WebSocket) => {
  connState.set(ws, {
    roomId: null,
    playerId: null,
    msgCount: 0,
    msgWindowStart: Date.now(),
    roomsCreated: 0,
    pendingPing: null,
    locale: "de",
  });
  log("client connected");

  send(ws, { t: "rooms", rooms: rooms.list().map((r) => r.toSummary()) });

  ws.on("pong", () => {
    const cs = connState.get(ws);
    if (cs) cs.pendingPing = null;
  });

  ws.on("error", (err) => {
    log(`ws error (player:${connState.get(ws)?.playerId ?? "?"}) — ${err.message}`);
  });

  ws.on("message", (raw) => {
    const cs = connState.get(ws)!;

    // Rate limit: max RATE_LIMIT_MAX msgs per RATE_LIMIT_WINDOW_MS
    const now = Date.now();
    if (now - cs.msgWindowStart > RATE_LIMIT_WINDOW_MS) {
      cs.msgCount = 0;
      cs.msgWindowStart = now;
    }
    cs.msgCount++;
    if (cs.msgCount > RATE_LIMIT_MAX) return;

    let msg: unknown;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      sendError(ws, "Invalid JSON");
      return;
    }

    if (typeof msg !== "object" || msg === null || Array.isArray(msg)) {
      sendError(ws, "Message must be a JSON object");
      return;
    }
    if (typeof (msg as Record<string, unknown>)["t"] !== "string") {
      sendError(ws, "Message must have a string 't' field");
      return;
    }

    try {
      handleMessage(ws, cs, msg as ClientMessage);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      log(`rejected command from player:${cs.playerId ?? "?"} — ${reason}`);
      send(ws, { t: "error", message: reason });
    }
  });

  ws.on("close", () => {
    const cs = connState.get(ws);
    if (!cs?.roomId || !cs.playerId) {
      log("client disconnected (no room)");
      return;
    }
    const room = rooms.get(cs.roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === cs.playerId);
    const nickname = player?.nickname ?? cs.playerId;
    log(`room:${room.id} ${nickname} disconnected (seat kept)`);
    room.removeHuman(cs.playerId);

    // If the game is finished, or all humans have disconnected from a started game, clean up
    const humanPlayers = room.players.filter((p) => !p.isBot);
    const allGone = humanPlayers.length === 0 || humanPlayers.every((p) => !p.connected);
    if (room.started && room.state?.phase === "finished" && allGone) {
      rooms.delete(room.id);
      broadcastRoomList();
      return;
    }
    if (!room.started && humanPlayers.length === 0) {
      rooms.delete(room.id);
      broadcastRoomList();
      return;
    }

    if (room.started && room.state && room.currentIsBot()) {
      scheduleBotSteps(room);
    }
    broadcastToRoom(room, { t: "room", room: room.toView() });
    broadcastRoomList();
  });
});

function handleMessage(ws: WebSocket, cs: ConnState, msg: ClientMessage): void {
  switch (msg.t) {
    case "listRooms": {
      send(ws, { t: "rooms", rooms: rooms.list().map((r) => r.toSummary()) });
      break;
    }

    case "createRoom": {
      // Auto-leave any previous room so the player is never stuck
      if (cs.roomId) autoLeave(cs);
      if (!isStr(msg.name) || msg.name.length === 0 || msg.name.length > MAX_ROOM_NAME_LEN)
        throw new Error(`Room name must be 1–${MAX_ROOM_NAME_LEN} characters`);
      if (!isStr(msg.nickname) || msg.nickname.length === 0 || msg.nickname.length > MAX_NICKNAME_LEN)
        throw new Error(`Nickname must be 1–${MAX_NICKNAME_LEN} characters`);
      if (!isStr(msg.boardId) || msg.boardId.length === 0)
        throw new Error("boardId must be a non-empty string");
      if (!isFiniteInt(msg.botCount))
        throw new Error("botCount must be an integer");
      if (rooms.list().length >= MAX_ROOMS)
        throw new Error("Server is full");
      if (cs.roomsCreated >= MAX_ROOMS_PER_CONN)
        throw new Error("Room creation limit reached");
      const botCount = Math.max(0, Math.min(MAX_BOT_COUNT, msg.botCount));
      const room = rooms.create(msg.name, msg.boardId, botCount);
      const playerId = room.addHuman(msg.nickname);
      const token = room.getToken(playerId)!;
      cs.roomId = room.id;
      cs.playerId = playerId;
      cs.roomsCreated++;
      log(`room:${room.id} created "${room.name}" (board:${room.boardId}, bots:${botCount}) by ${msg.nickname}`);
      send(ws, { t: "joined", roomId: room.id, playerId, token });
      send(ws, { t: "room", room: room.toView() });
      broadcastRoomList();
      break;
    }

    case "joinRoom": {
      // Auto-leave any previous room so the player is never stuck
      if (cs.roomId) autoLeave(cs);
      if (!isStr(msg.roomId) || msg.roomId.length === 0)
        throw new Error("roomId must be a non-empty string");
      if (!isStr(msg.nickname) || msg.nickname.length === 0 || msg.nickname.length > MAX_NICKNAME_LEN)
        throw new Error(`Nickname must be 1–${MAX_NICKNAME_LEN} characters`);
      const room = rooms.get(msg.roomId);
      if (!room) throw new Error("Room not found");
      if (room.started) throw new Error("Game already started");
      const humanCount = room.players.filter((p) => !p.isBot).length;
      if (humanCount + room.botCount >= MAX_PLAYERS_PER_ROOM) throw new Error("Room is full");
      const playerId = room.addHuman(msg.nickname);
      const token = room.getToken(playerId)!;
      cs.roomId = room.id;
      cs.playerId = playerId;
      log(`room:${room.id} ${msg.nickname} joined`);
      send(ws, { t: "joined", roomId: room.id, playerId, token });
      broadcastToRoom(room, { t: "room", room: room.toView() });
      broadcastRoomList();
      break;
    }

    case "leaveRoom": {
      if (!cs.roomId || !cs.playerId) break;
      const leaveRoom = rooms.get(cs.roomId);
      if (leaveRoom) {
        const player = leaveRoom.players.find((p) => p.id === cs.playerId);
        log(`room:${leaveRoom.id} ${player?.nickname ?? cs.playerId} left`);
      }
      autoLeave(cs);
      broadcastRoomList();
      send(ws, { t: "rooms", rooms: rooms.list().map((r) => r.toSummary()) });
      break;
    }

    case "startGame": {
      if (!cs.roomId || !cs.playerId) throw new Error("Not in a room");
      const room = rooms.get(cs.roomId);
      if (!room) throw new Error("Room not found");
      if (room.host !== cs.playerId) throw new Error("Only the host can start the game");
      if (room.started) throw new Error("Already started");
      if (!room.canStart()) throw new Error("Not all players are ready");
      const seed = Date.now();
      room.start(seed);
      log(`room:${room.id} game started (${room.state!.players.length} players, seed:${seed})`);
      broadcastState(room, []);
      broadcastRoomList();
      if (room.currentIsBot()) scheduleBotSteps(room);
      else scheduleTurnTimer(room);
      break;
    }

    case "command": {
      if (!cs.roomId || !cs.playerId) throw new Error("Not in a room");
      const room = rooms.get(cs.roomId);
      if (!room) throw new Error("Room not found");
      const cmdError = validateCommand(msg.command);
      if (cmdError) throw new Error(cmdError);
      const player = room.players.find((p) => p.id === cs.playerId);
      log(`room:${room.id} ${player?.nickname ?? cs.playerId} → ${msg.command.type}`);
      // Human acted: cancel their turn timer
      cancelTurnTimer(room.id);
      let rawEvents = room.applyHumanCommand(cs.playerId, msg.command);

      // If a PROPOSE_SWAP was directed at a bot, resolve the bot's response immediately
      const botSwapEvents = room.stepBotSwapResponse();
      rawEvents = rawEvents.concat(botSwapEvents);

      // Log notable events
      for (const ev of rawEvents) {
        if (ev.key === "went_to_jail") log(`room:${room.id} ${player?.nickname ?? cs.playerId} → jail`);
        if (ev.key === "bankrupt") log(`room:${room.id} ${player?.nickname ?? cs.playerId} went bankrupt`);
      }

      broadcastState(room, rawEvents);
      if (room.state!.phase === "finished" && room.state!.winnerId) {
        const winner = room.state!.players.find((p) => p.id === room.state!.winnerId);
        if (winner) {
          log(`room:${room.id} game over — winner: ${winner.name}`);
          broadcastToRoom(room, { t: "gameOver", winnerId: winner.id, winnerName: winner.name });
        }
        // Disassociate all connections from the finished room
        for (const [, rcs] of getRoomConns(room.id)) {
          rcs.roomId = null;
          rcs.playerId = null;
        }
        rooms.delete(room.id);
        broadcastRoomList();
      } else if (room.currentIsBot()) {
        scheduleBotSteps(room);
      } else {
        // Still a human's turn (e.g. management command didn't advance turn) — restart timer
        scheduleTurnTimer(room);
      }
      break;
    }

    case "chat": {
      if (!cs.roomId || !cs.playerId) throw new Error("Not in a room");
      const room = rooms.get(cs.roomId);
      if (!room) throw new Error("Room not found");
      if (!isStr(msg.text)) throw new Error("chat text must be a string");
      const player = room.players.find((p) => p.id === cs.playerId);
      const from = player?.nickname ?? "Unknown";
      broadcastToRoom(room, { t: "chat", from, text: msg.text.slice(0, MAX_CHAT_LEN) });
      break;
    }

    case "resume": {
      if (cs.roomId) throw new Error("Already in a room");
      if (!isStr(msg.roomId) || msg.roomId.length === 0)
        throw new Error("roomId must be a non-empty string");
      if (!isStr(msg.playerId) || msg.playerId.length === 0)
        throw new Error("playerId must be a non-empty string");
      if (!isStr(msg.token) || msg.token.length === 0)
        throw new Error("token must be a non-empty string");
      const room = rooms.get(msg.roomId);
      if (!room) {
        send(ws, { t: "error", message: "Room not found or expired" });
        break;
      }
      const nickname = room.resumeHuman(msg.playerId, msg.token);
      if (!nickname) {
        send(ws, { t: "error", message: "Invalid resume token" });
        break;
      }
      cs.roomId = room.id;
      cs.playerId = msg.playerId;
      log(`room:${room.id} ${nickname} reconnected`);
      send(ws, { t: "resumed", roomId: room.id, playerId: msg.playerId });
      if (room.started && room.state) {
        send(ws, { t: "state", state: room.state, events: [] });
      } else {
        send(ws, { t: "room", room: room.toView() });
      }
      broadcastToRoom(room, { t: "room", room: room.toView() }, ws);
      // If it was this player's "bot-driven" turn, check and stop bot loop
      // (next bot step will see currentIsBot() = false and stop)
      break;
    }

    case "setLocale": {
      const locale = msg.locale;
      if (locale !== "de" && locale !== "en") throw new Error("Invalid locale");
      cs.locale = locale;
      // Re-send current state in the new locale if in a game
      if (cs.roomId) {
        const room = rooms.get(cs.roomId);
        if (room?.started && room.state) {
          send(ws, { t: "state", state: room.state, events: [] });
        }
      }
      break;
    }

    case "chooseFigure": {
      if (!cs.roomId || !cs.playerId) throw new Error("Not in a room");
      const room = rooms.get(cs.roomId);
      if (!room) throw new Error("Room not found");
      if (!isStr(msg.color)) throw new Error("color must be a string");
      if (!isFiniteInt(msg.figureIndex)) throw new Error("figureIndex must be an integer");
      const err = room.chooseFigure(cs.playerId, msg.color, msg.figureIndex);
      if (err) throw new Error(err);
      broadcastToRoom(room, { t: "room", room: room.toView() });
      break;
    }

    case "setReady": {
      if (!cs.roomId || !cs.playerId) throw new Error("Not in a room");
      const room = rooms.get(cs.roomId);
      if (!room) throw new Error("Room not found");
      if (!isBool(msg.ready)) throw new Error("ready must be a boolean");
      const err = room.setReady(cs.playerId, msg.ready);
      if (err) throw new Error(err);
      broadcastToRoom(room, { t: "room", room: room.toView() });
      break;
    }

    case "setGameSettings": {
      if (!cs.roomId || !cs.playerId) throw new Error("Not in a room");
      const room = rooms.get(cs.roomId);
      if (!room) throw new Error("Room not found");
      if (room.host !== cs.playerId) throw new Error("Only the host can change settings");
      if (room.started) throw new Error("Game already started");
      if (!isObj(msg.settings)) throw new Error("settings must be an object");
      const s = msg.settings;
      const settings: import("@laspoly/shared").GameSettings = {};
      const MULT_MIN = 0.25;
      const MULT_MAX = 5;
      if (s["startingCapitalMult"] !== undefined) {
        if (typeof s["startingCapitalMult"] !== "number" || !Number.isFinite(s["startingCapitalMult"] as number))
          throw new Error("startingCapitalMult must be a finite number");
        settings.startingCapitalMult = Math.min(MULT_MAX, Math.max(MULT_MIN, s["startingCapitalMult"] as number));
      }
      if (s["buildingCostMult"] !== undefined) {
        if (typeof s["buildingCostMult"] !== "number" || !Number.isFinite(s["buildingCostMult"] as number))
          throw new Error("buildingCostMult must be a finite number");
        settings.buildingCostMult = Math.min(MULT_MAX, Math.max(MULT_MIN, s["buildingCostMult"] as number));
      }
      if (s["botDifficulty"] !== undefined) {
        if (!["easy", "normal", "hard"].includes(s["botDifficulty"] as string))
          throw new Error("botDifficulty must be 'easy', 'normal', or 'hard'");
        settings.botDifficulty = s["botDifficulty"] as "easy" | "normal" | "hard";
      }
      room.updateSettings(settings);
      broadcastToRoom(room, { t: "room", room: room.toView() });
      break;
    }

    case "newGame": {
      if (!cs.roomId || !cs.playerId) throw new Error("Not in a room");
      const room = rooms.get(cs.roomId);
      if (!room) throw new Error("Room not found");
      if (room.host !== cs.playerId) throw new Error("Only the host can start a new game");
      if (!room.started || room.state?.phase !== "finished") throw new Error("Game is not finished yet");
      cancelTurnTimer(room.id);
      const newSeed = Date.now();
      room.restart(newSeed);
      log(`room:${room.id} restarted (seed:${newSeed})`);
      broadcastState(room, []);
      broadcastRoomList();
      if (room.currentIsBot()) scheduleBotSteps(room);
      else scheduleTurnTimer(room);
      break;
    }

    default: {
      sendError(ws, "Unknown message type");
      break;
    }
  }
}

// ---- Start -----------------------------------------------------------------

httpServer.listen(PORT, () => {
  log(`server listening on port ${PORT}${HAS_CLIENT ? " (serving client)" : ""}`);
});

// ---- Graceful shutdown -----------------------------------------------------

function shutdown(): void {
  log("shutting down...");
  clearInterval(pingInterval);
  // Close all WebSocket connections
  for (const client of wss.clients) {
    client.terminate();
  }
  wss.close(() => {
    httpServer.close(() => {
      log("server stopped");
      process.exit(0);
    });
  });
  // Force exit after 5s if something hangs
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
