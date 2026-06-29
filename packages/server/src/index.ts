import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";
import { applyCommand, botDecide, currentPlayer } from "@laspoly/shared";
import { RoomManager, GameRoom } from "./room.js";
import type { ClientMessage, ServerMessage } from "@laspoly/shared";

const PORT = Number(process.env["PORT"] ?? 8080);
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

interface ConnState {
  roomId: string | null;
  playerId: string | null;
  msgCount: number;
  msgWindowStart: number;
  roomsCreated: number;
  pendingPing: number | null;
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

/** Drive bots in steps with delay between each, broadcasting state each time. */
function scheduleBotSteps(room: GameRoom, delayMs = 700): void {
  if (!room.state || room.state.phase === "finished") return;
  if (!room.currentIsBot()) return;

  setTimeout(() => {
    if (!room.state || room.state.phase === "finished") return;
    if (!room.currentIsBot()) return;

    const cp = currentPlayer(room.state!);
    const cmd = botDecide(room.state!);
    const result = applyCommand(room.state!, cmd);
    room.state = result.state;

    log(`room:${room.id} ${cp.name} (bot) → ${cmd.type}`);

    const events = room.formatEvents(result.events);
    broadcastToRoom(room, { t: "state", state: room.state, events });

    if (room.state.phase === "finished" && room.state.winnerId) {
      const winner = room.state.players.find((p) => p.id === room.state!.winnerId);
      if (winner) {
        log(`room:${room.id} game over — winner: ${winner.name}`);
        broadcastToRoom(room, { t: "gameOver", winnerId: winner.id, winnerName: winner.name });
      }
      return;
    }

    // Log notable events
    for (const ev of result.events) {
      if (ev.key === "went_to_jail") log(`room:${room.id} ${cp.name} → jail`);
      if (ev.key === "bankrupt") log(`room:${room.id} ${cp.name} went bankrupt`);
    }

    scheduleBotSteps(room, delayMs);
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
    case "ROLL_DICE": case "BUY_PROPERTY": case "DECLINE_PROPERTY": case "PAY_RANSOM": break;
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
      if (cs.roomId) throw new Error("Already in a room");
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
      if (cs.roomId) throw new Error("Already in a room");
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
      const room = rooms.get(cs.roomId);
      if (room) {
        const player = room.players.find((p) => p.id === cs.playerId);
        log(`room:${room.id} ${player?.nickname ?? cs.playerId} left`);
        room.removeHuman(cs.playerId);
        broadcastToRoom(room, { t: "room", room: room.toView() });
        if (!room.started && room.players.filter((p) => !p.isBot).length === 0) {
          rooms.delete(room.id);
        }
      }
      cs.roomId = null;
      cs.playerId = null;
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
      const humanCount = room.players.filter((p) => !p.isBot).length;
      const totalPlayers = humanCount + room.botCount;
      if (totalPlayers < 2) throw new Error("Mindestens 2 Spieler nötig");
      const seed = Date.now();
      room.start(seed);
      log(`room:${room.id} game started (${room.state!.players.length} players, seed:${seed})`);
      broadcastToRoom(room, { t: "state", state: room.state!, events: [] });
      broadcastRoomList();
      if (room.currentIsBot()) scheduleBotSteps(room);
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
      let rawEvents = room.applyHumanCommand(cs.playerId, msg.command);

      // If a PROPOSE_SWAP was directed at a bot, resolve the bot's response immediately
      const botSwapEvents = room.stepBotSwapResponse();
      rawEvents = rawEvents.concat(botSwapEvents);

      // Log notable events
      for (const ev of rawEvents) {
        if (ev.key === "went_to_jail") log(`room:${room.id} ${player?.nickname ?? cs.playerId} → jail`);
        if (ev.key === "bankrupt") log(`room:${room.id} ${player?.nickname ?? cs.playerId} went bankrupt`);
      }

      const events = room.formatEvents(rawEvents);
      broadcastToRoom(room, { t: "state", state: room.state!, events });
      if (room.state!.phase === "finished" && room.state!.winnerId) {
        const winner = room.state!.players.find((p) => p.id === room.state!.winnerId);
        if (winner) {
          log(`room:${room.id} game over — winner: ${winner.name}`);
          broadcastToRoom(room, { t: "gameOver", winnerId: winner.id, winnerName: winner.name });
        }
      } else if (room.currentIsBot()) {
        scheduleBotSteps(room);
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
      // If it was this player's "bot-driven" turn, check and stop bot loop
      // (next bot step will see currentIsBot() = false and stop)
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
