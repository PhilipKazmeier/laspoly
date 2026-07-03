import pkg from "../../../package.json" with { type: "json" };
import type { Command, GameSettings, GameState } from "./types.js";

export const VERSION: string = pkg.version;

// ---- Room shapes -----------------------------------------------------------

export interface RoomSummary {
  id: string;
  name: string;
  boardId: string;
  playerCount: number;
  started: boolean;
  /** true when joining requires a password (private room) */
  hasPassword: boolean;
}

export interface RoomPlayer {
  id: string;
  nickname: string;
  isBot: boolean;
  color?: string;
  figureIndex?: number;
  ready: boolean;
}

// Available palette — client + server both import these to stay in sync.
export const FIGURE_COLORS = ["red", "blue", "green", "yellow", "purple", "orange"] as const;
export type FigureColor = typeof FIGURE_COLORS[number];
// figureIndex 0-5 → car1..car5, police
export const FIGURE_COUNT = 6;

export interface RoomView {
  id: string;
  name: string;
  boardId: string;
  botCount: number;
  host: string; // playerId of host
  players: RoomPlayer[];
  started: boolean;
  settings: GameSettings;
  canStart: boolean;
}

// ---- Wire messages ---------------------------------------------------------

export type ClientMessage =
  | { t: "createRoom"; name: string; nickname: string; boardId: string; botCount: number; password?: string }
  | { t: "joinRoom"; roomId: string; nickname: string; password?: string }
  | { t: "leaveRoom" }
  | { t: "startGame" }
  | { t: "command"; command: Command }
  | { t: "chat"; text: string }
  | { t: "listRooms" }
  | { t: "resume"; roomId: string; playerId: string; token: string }
  | { t: "setLocale"; locale: "de" | "en" }
  | { t: "chooseFigure"; color: string; figureIndex: number }
  | { t: "setReady"; ready: boolean }
  | { t: "setGameSettings"; settings: GameSettings }
  | { t: "newGame" };

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
  | { t: "resumed"; roomId: string; playerId: string }
  | { t: "turnTimer"; playerId: string; secondsLeft: number };
