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
  figureIndex: number; // 0-5 → car1..car5, police (chosen vehicle model)
}

export type GamePhase =
  | "awaiting-roll"
  | "awaiting-buy"
  | "awaiting-casino" // landed on the casino: player must roll the casino dice
  | "turn-end"
  | "finished";

export type EventId =
  // Classic round modifiers (1 round each) — the "normal" frequency pool.
  | 'circus'
  | 'boom'
  | 'recession'
  | 'jackpot'
  | 'buildingSale'
  | 'quietDay'
  // Dramatic events (chaos frequency only): instant one-shots…
  | 'earthquake'
  | 'taxAudit'
  | 'lottery'
  | 'windfall'
  // …and multi-round modifiers.
  | 'streetParty'
  | 'powerOutage'
  | 'marketCrash'
  | 'goldRush';

/** How often round events are drawn (game setting). */
export type EventFrequency = "off" | "rare" | "normal" | "chaos";

/**
 * A round-modifier event currently in effect. `remainingRounds` is
 * decremented at each round boundary; the event expires at 0. Some events
 * carry extra data (e.g. the street group a party applies to).
 */
export interface ActiveEvent {
  id: EventId;
  remainingRounds: number;
  group?: string;
}

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
  /** current round number, starts at 1 */
  round: number;
  /** special events currently in effect (round modifiers with durations) */
  activeEvents: ActiveEvent[];
  /** event draw frequency (from game settings, default "normal") */
  eventFrequency: EventFrequency;
  /** street positions where building is forbidden (house rule; drawn at game start) */
  unbuildableFields: number[];
  /** game ends after this round with a net-worth winner (0 = off; house rule) */
  roundLimit: number;
  /** jailed owners collect no street/station/attraction rent (house rule) */
  noRentInJail: boolean;
  /** True once the current player has built one building this turn; reset on turn advance. */
  builtThisTurn: boolean;
  /** True once the current player has traveled via a station this turn; reset on turn advance. */
  traveledThisTurn: boolean;
  /** Building cost multiplier (from game settings, default 1.0). */
  buildingCostMult: number;
  /** Bot difficulty level (from game settings, default "normal"). */
  botDifficulty: "easy" | "normal" | "hard";
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
  | { type: "ROLL_CASINO" }
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
  | { type: "RESPOND_SWAP"; accept: boolean }
  | { type: "SURRENDER" }
  | { type: "END_TURN" };

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

export interface GameSettings {
  startingCapitalMult?: number; // default 1.0
  buildingCostMult?: number;    // default 1.0
  botDifficulty?: "easy" | "normal" | "hard"; // default "normal"
  eventFrequency?: EventFrequency; // default "normal"
  /** number of random streets marked no-build at game start (house rule; default 0) */
  unbuildableCount?: number;
  /** end the game after N rounds with a net-worth winner (0/undefined = off) */
  roundLimit?: number;
  /** jailed owners collect no rent (default false) */
  noRentInJail?: boolean;
}

export interface NewGameOptions {
  boardId: string;
  seed: number;
  players: { id: string; name: string; isBot: boolean; color: string; figureIndex?: number }[];
  settings?: GameSettings;
}
