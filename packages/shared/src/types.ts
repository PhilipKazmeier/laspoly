import type { RngState } from "./rng.js";

export interface Buildings {
  houses: number; // 0-4
  hotel: boolean;
  factory: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  isBot: boolean;
  money: number;
  position: number; // 0-39, or JAIL_POS (40) while jailed
  inJail: boolean;
  jailTurns: number; // turns left to serve when jailed
  alive: boolean;
  lastRoll: [number, number];
  color: string;
}

export type GamePhase =
  | "awaiting-roll"
  | "awaiting-buy"
  | "finished";

export interface GameState {
  boardId: string;
  rng: RngState;
  players: PlayerState[];
  currentPlayerIndex: number;
  phase: GamePhase;
  doublesCount: number;
  /** set during awaiting-buy: position offered to the current player */
  pendingPurchase: number | null;
  /** whether the current player earned another roll (rolled doubles) */
  extraRoll: boolean;
  ownership: Record<number, string>; // tilePos -> playerId
  buildings: Record<number, Buildings>; // tilePos -> buildings
  mortgaged: Record<number, true>; // tilePos -> mortgaged
  casinoPool: number;
  winnerId: string | null;
  turn: number;
  /** action card draw pile (indices into ACTION_CARD_SPECS) */
  actionDeck: number[];
  /** discarded action cards */
  actionDiscard: number[];
  /** pending player-to-player swap offer, null when none */
  pendingSwap: PendingSwap | null;
}

export interface SwapLeg {
  props: number[]; // board positions
  money: number;
}

export interface PendingSwap {
  fromId: string;
  toId: string;
  give: SwapLeg;   // what fromId offers
  receive: SwapLeg; // what fromId asks for (toId gives)
}

export type Command =
  | { type: "ROLL_DICE" }
  | { type: "BUY_PROPERTY" }
  | { type: "DECLINE_PROPERTY" }
  | { type: "PAY_RANSOM" }
  | { type: "BUILD"; pos: number; building: "house" | "hotel" | "factory" }
  | { type: "SELL_BUILDING"; pos: number }
  | { type: "MORTGAGE"; pos: number }
  | { type: "UNMORTGAGE"; pos: number }
  | { type: "SELL_PROPERTY"; pos: number }
  | { type: "TRAVEL"; toPos: number }
  | { type: "PROPOSE_SWAP"; toId: string; give: SwapLeg; receive: SwapLeg }
  | { type: "RESPOND_SWAP"; accept: boolean };

/**
 * A complete, localizable game event. `key` selects an i18n template; `params`
 * fills it. Every state-changing outcome emits one so no system message is ever
 * blank (fixes the "going to jail shows nothing" class of bugs).
 */
export interface GameEvent {
  key: string;
  params: Record<string, string | number>;
  /** player this event is primarily about, if any */
  playerId?: string;
}

export interface ReduceResult {
  state: GameState;
  events: GameEvent[];
}

export interface NewGameOptions {
  boardId: string;
  seed: number;
  players: { id: string; name: string; isBot: boolean; color: string }[];
}
