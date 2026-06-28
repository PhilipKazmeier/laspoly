import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";
import { applyCommand, botDecide, currentPlayer } from "@laspoly/shared";
import { RoomManager, GameRoom } from "./room.js";
import type { ClientMessage, ServerMessage } from "@laspoly/shared";

const PORT = Number(process.env["PORT"] ?? 8080);
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CLIENT_DIST = join(__dirname, "../../client/dist");
const HAS_CLIENT = existsSync(CLIENT_DIST);

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
  const filePath = join(CLIENT_DIST, pathname);
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

const wss = new WebSocketServer({ server: httpServer });
const rooms = new RoomManager();

interface ConnState {
  roomId: string | null;
  playerId: string | null;
  msgCount: number;
  msgWindowStart: number;
}

const connState = new WeakMap<WebSocket, ConnState>();

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
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

// ---- Message handling ------------------------------------------------------

wss.on("connection", (ws: WebSocket) => {
  connState.set(ws, { roomId: null, playerId: null, msgCount: 0, msgWindowStart: Date.now() });
  log("client connected");

  send(ws, { t: "rooms", rooms: rooms.list().map((r) => r.toSummary()) });

  ws.on("message", (raw) => {
    const cs = connState.get(ws)!;

    // Rate limit: max 30 msgs/sec
    const now = Date.now();
    if (now - cs.msgWindowStart > 1000) {
      cs.msgCount = 0;
      cs.msgWindowStart = now;
    }
    cs.msgCount++;
    if (cs.msgCount > 30) return;

    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      return;
    }

    try {
      handleMessage(ws, cs, msg);
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
      const botCount = Math.max(0, Math.min(5, msg.botCount));
      const room = rooms.create(msg.name, msg.boardId, botCount);
      const playerId = room.addHuman(msg.nickname);
      const token = room.getToken(playerId)!;
      cs.roomId = room.id;
      cs.playerId = playerId;
      log(`room:${room.id} created "${room.name}" (board:${room.boardId}, bots:${botCount}) by ${msg.nickname}`);
      send(ws, { t: "joined", roomId: room.id, playerId, token });
      send(ws, { t: "room", room: room.toView() });
      broadcastRoomList();
      break;
    }

    case "joinRoom": {
      if (cs.roomId) throw new Error("Already in a room");
      const room = rooms.get(msg.roomId);
      if (!room) throw new Error("Room not found");
      if (room.started) throw new Error("Game already started");
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
      const player = room.players.find((p) => p.id === cs.playerId);
      const from = player?.nickname ?? "Unknown";
      broadcastToRoom(room, { t: "chat", from, text: msg.text.slice(0, 500) });
      break;
    }

    case "resume": {
      if (cs.roomId) throw new Error("Already in a room");
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
  }
}

// ---- Start -----------------------------------------------------------------

httpServer.listen(PORT, () => {
  log(`server listening on port ${PORT}${HAS_CLIENT ? " (serving client)" : ""}`);
});
