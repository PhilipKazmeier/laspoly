import pkg from "../../../package.json" with { type: "json" };
import type { Command, GameState } from "./types.js";

export const VERSION: string = pkg.version;

// ---- Room shapes -----------------------------------------------------------

export interface RoomSummary {
  id: string;
  name: string;
  boardId: string;
  playerCount: number;
  started: boolean;
}

export interface RoomPlayer {
  id: string;
  nickname: string;
  isBot: boolean;
}

export interface RoomView {
  id: string;
  name: string;
  boardId: string;
  botCount: number;
  host: string; // playerId of host
  players: RoomPlayer[];
  started: boolean;
}

// ---- Wire messages ---------------------------------------------------------

export type ClientMessage =
  | { t: "createRoom"; name: string; nickname: string; boardId: string; botCount: number }
  | { t: "joinRoom"; roomId: string; nickname: string }
  | { t: "leaveRoom" }
  | { t: "startGame" }
  | { t: "command"; command: Command }
  | { t: "chat"; text: string }
  | { t: "listRooms" }
  | { t: "resume"; roomId: string; playerId: string; token: string };

export interface FormattedEvent {
  key: string;
  text: string;
  playerId?: string;
}

export type ServerMessage =
  | { t: "rooms"; rooms: RoomSummary[] }
  | { t: "joined"; roomId: string; playerId: string; token: string }
  | { t: "room"; room: RoomView }
  | { t: "state"; state: GameState; events: FormattedEvent[] }
  | { t: "chat"; from: string; text: string }
  | { t: "error"; message: string }
  | { t: "gameOver"; winnerId: string; winnerName: string }
  | { t: "resumed"; roomId: string; playerId: string };
