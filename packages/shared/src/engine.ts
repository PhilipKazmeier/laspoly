import {
  getBoard,
  groupMembers,
  isProperty,
  JAIL_POS,
  mortgageValue,
  tilePrice,
  wrapPosition,
  type BoardDefinition,
  type StreetTile,
  type Tile,
} from "./board.js";
import { makeRng, nextInt, rollDie, shuffle } from "./rng.js";
import type {
  Buildings,
  Command,
  EventId,
  GameEvent,
  GameState,
  NewGameOptions,
  PlayerState,
  ReduceResult,
  SwapLeg,
} from "./types.js";

const GO_TO_JAIL_POS = 30;

// ---- special events -------------------------------------------------------

const EVENT_IDS: EventId[] = [
  'circus',
  'boom',
  'recession',
  'jackpot',
  'buildingSale',
  'quietDay',
];

function drawEvent(state: GameState): { id: EventId } {
  const idx = nextInt(state.rng, 0, EVENT_IDS.length - 1);
  return { id: EVENT_IDS[idx]! };
}

// ---- Action card definitions -----------------------------------------------

type CardSpec =
  | { kind: "move-random" }
  | { kind: "move-to"; pos: number }
  | { kind: "move-jail" }
  | { kind: "move-forward"; steps: number }
  | { kind: "move-next-station" }
  | { kind: "single"; id: string; positive: boolean; multiplier: number }
  | { kind: "broadcast"; id: string; positive: boolean; multiplier: number }
  | { kind: "repair-factory"; id: string; multiplier: number }
  | { kind: "repair-general"; id: string; multiplier: number; withFactory: boolean };

const ACTION_CARD_SPECS: CardSpec[] = [
  { kind: "move-random" },                                                      // 0
  { kind: "move-to", pos: 0 },                                                  // 1  GO
  { kind: "move-jail" },                                                         // 2
  { kind: "move-to", pos: 20 },                                                 // 3  Casino
  { kind: "move-forward", steps: 5 },                                           // 4
  { kind: "move-next-station" },                                                 // 5
  { kind: "single", id: "gamblingTax", positive: false, multiplier: 30 },       // 6
  { kind: "single", id: "parkingFine", positive: false, multiplier: 20 },       // 7
  { kind: "single", id: "helicopterFlight", positive: false, multiplier: 35 },  // 8
  { kind: "single", id: "magicianShow", positive: false, multiplier: 15 },      // 9
  { kind: "single", id: "independenceDay", positive: false, multiplier: 25 },   // 10
  { kind: "single", id: "lookalikeCompetition", positive: true, multiplier: 25 }, // 11
  { kind: "single", id: "yardSale", positive: true, multiplier: 30 },           // 12
  { kind: "single", id: "inherit", positive: true, multiplier: 50 },            // 13
  { kind: "single", id: "horseRacing", positive: true, multiplier: 40 },        // 14
  { kind: "single", id: "slotMachine", positive: true, multiplier: 45 },        // 15
  { kind: "single", id: "roulette", positive: true, multiplier: 30 },           // 16
  { kind: "single", id: "boxingBet", positive: true, multiplier: 25 },          // 17
  { kind: "single", id: "blackJack", positive: true, multiplier: 15 },          // 18
  { kind: "single", id: "baccaratGame", positive: true, multiplier: 15 },       // 19
  { kind: "broadcast", id: "youGotPromoted", positive: false, multiplier: 15 }, // 20
  { kind: "broadcast", id: "birthday", positive: true, multiplier: 20 },        // 21
  { kind: "broadcast", id: "pokerTable", positive: true, multiplier: 25 },      // 22
  { kind: "repair-factory", id: "factoryRedevelop", multiplier: 10 },           // 23
  { kind: "repair-general", id: "generalRepairs", multiplier: 5, withFactory: false }, // 24
  { kind: "repair-general", id: "streetRepairs", multiplier: 5, withFactory: true },   // 25
];

const ACTION_CARD_COUNT = ACTION_CARD_SPECS.length; // 26

/**
 * Stable, human-translatable id for a card. Cards with an explicit id use it;
 * the movement cards derive a stable id from their kind/target so i18n can map
 * each to a friendly name instead of surfacing a raw internal identifier.
 */
function cardId(spec: CardSpec): string {
  switch (spec.kind) {
    case "move-random": return "move-random";
    case "move-to": return spec.pos === 0 ? "move-to-GO" : "move-to-casino";
    case "move-jail": return "move-jail";
    case "move-forward": return "move-forward";
    case "move-next-station": return "move-next-station";
    default: return spec.id;
  }
}

/** All card ids, for i18n coverage. */
export const ACTION_CARD_IDS: string[] = ACTION_CARD_SPECS.map(cardId);

// Non-special positions for "move-random": streets, stations, attractions
// Computed once at module load from the board. We use vegas for now.
function getNonSpecialPositions(board: BoardDefinition): number[] {
  return board.tiles
    .filter((t) => t.type === "street" || t.type === "station" || t.type === "attraction")
    .map((t) => t.pos);
}

const STATION_POSITIONS = [5, 15, 25, 35];

export function createGame(opts: NewGameOptions): GameState {
  const board = getBoard(opts.boardId);
  if (opts.players.length < 2) throw new Error("Need at least 2 players");
  const players: PlayerState[] = opts.players.map((p) => ({
    id: p.id,
    name: p.name,
    isBot: p.isBot,
    money: board.rules.initialCapital,
    position: 0,
    inJail: false,
    jailTurns: 0,
    alive: true,
    lastRoll: [0, 0],
    color: p.color,
  }));
  const rng = makeRng(opts.seed);
  // Draw the first round's event before building state so it consumes the RNG in order
  const firstEventIdx = nextInt(rng, 0, EVENT_IDS.length - 1);
  const firstEvent: { id: EventId } = { id: EVENT_IDS[firstEventIdx]! };
  const actionDeck: number[] = [];
  return {
    boardId: opts.boardId,
    rng,
    players,
    currentPlayerIndex: 0,
    phase: "awaiting-roll",
    doublesCount: 0,
    pendingPurchase: null,
    extraRoll: false,
    ownership: {},
    buildings: {},
    mortgaged: {},
    casinoPool: board.rules.casinoInitialPool,
    winnerId: null,
    turn: 1,
    actionDeck,
    actionDiscard: [],
    pendingSwap: null,
    round: 1,
    activeEvent: firstEvent,
    builtThisTurn: false,
  };
}

// ---- helpers -------------------------------------------------------------

export function currentPlayer(state: GameState): PlayerState {
  return state.players[state.currentPlayerIndex]!;
}

export function playerById(state: GameState, id: string): PlayerState | undefined {
  return state.players.find((p) => p.id === id);
}

export function aliveCount(state: GameState): number {
  return state.players.filter((p) => p.alive).length;
}

function tileAt(board: BoardDefinition, pos: number): Tile {
  return board.tiles[pos]!;
}

function ownsWholeGroup(state: GameState, board: BoardDefinition, playerId: string, group: string): boolean {
  return groupMembers(board, group).every((pos) => state.ownership[pos] === playerId);
}

function groupOwnedCount(state: GameState, board: BoardDefinition, playerId: string, group: string): number {
  return groupMembers(board, group).filter((pos) => state.ownership[pos] === playerId).length;
}

function getBuildingsAt(state: GameState, pos: number): Buildings {
  return state.buildings[pos] ?? { houses: 0, hotel: false, factory: false };
}

/** True if `pos` is part of a currently pending swap (either leg). */
function isInPendingSwap(state: GameState, pos: number): boolean {
  const s = state.pendingSwap;
  if (!s) return false;
  return s.give.props.includes(pos) || s.receive.props.includes(pos);
}

// ---- building validation --------------------------------------------------

function canConstructHouse(state: GameState, board: BoardDefinition, pos: number): boolean {
  const tile = tileAt(board, pos) as StreetTile;
  const b = getBuildingsAt(state, pos);
  if (b.hotel || b.factory || b.houses >= 4) return false;
  const members = groupMembers(board, tile.group);
  // Even build: this street can't have more houses than any other (build in order)
  for (const m of members) {
    const bm = getBuildingsAt(state, m);
    if (bm.factory) return false; // factory in group blocks houses
    if (state.mortgaged[m]) return false; // mortgaged in group blocks build
    if (m !== pos) {
      const otherCount = bm.hotel ? 5 : bm.houses;
      // Can't build on this if another member has fewer houses
      if (otherCount < b.houses) return false;
    }
  }
  return true;
}

function canConstructHotel(state: GameState, board: BoardDefinition, pos: number): boolean {
  const tile = tileAt(board, pos) as StreetTile;
  const b = getBuildingsAt(state, pos);
  if (b.hotel || b.factory || b.houses !== 4) return false;
  // Balance: single-street colour groups may build houses but NOT a hotel. A lone
  // street reaches its 4th house in only a few one-per-turn builds, and its hotel
  // rent (e.g. 2210 on Edison Walker) is a guaranteed early one-shot KO. Capping it
  // at 4 houses keeps the street relevant to termination without the lethal hotel.
  if (groupMembers(board, tile.group).length < 2) return false;
  const members = groupMembers(board, tile.group);
  for (const m of members) {
    if (m === pos) continue;
    const bm = getBuildingsAt(state, m);
    // Others must have 4 houses or already a hotel
    if (!bm.hotel && bm.houses !== 4) return false;
  }
  return true;
}

function canConstructFactory(state: GameState, board: BoardDefinition, pos: number): boolean {
  const tile = tileAt(board, pos) as StreetTile;
  const b = getBuildingsAt(state, pos);
  if (b.hotel || b.factory || b.houses !== 0) return false;
  const members = groupMembers(board, tile.group);
  for (const m of members) {
    if (state.mortgaged[m]) return false; // mortgaged blocks factory
    if (m === pos) continue;
    const bm = getBuildingsAt(state, m);
    // Others must be empty or have a factory (no houses/hotels)
    if (!bm.factory && (bm.houses > 0 || bm.hotel)) return false;
  }
  return true;
}

function canSellHouse(state: GameState, board: BoardDefinition, pos: number): boolean {
  const tile = tileAt(board, pos) as StreetTile;
  const b = getBuildingsAt(state, pos);
  if (b.houses <= 0) return false;
  const members = groupMembers(board, tile.group);
  // After selling, this street would have b.houses - 1. Even-sell allows a max
  // spread of 1 between members, so a sibling at the SAME count may still sell.
  // Use `>` (not `>=`): only block when a sibling has strictly MORE houses,
  // otherwise a group sitting at equal counts (e.g. hotel knocked down to 4
  // houses next to siblings at 4) would freeze forever and never liquidate.
  for (const m of members) {
    if (m === pos) continue;
    const bm = getBuildingsAt(state, m);
    const otherCount = bm.hotel ? 5 : bm.houses;
    if (otherCount > b.houses) return false; // would create a >1 spread after sell
  }
  return true;
}

/** Commands that are legal in the current state (for bots, clients, validation). */
export function legalCommands(state: GameState): Command["type"][] {
  if (state.phase === "finished") return [];
  if (state.phase === "awaiting-buy") return ["BUY_PROPERTY", "DECLINE_PROPERTY"];

  // awaiting-roll
  const p = currentPlayer(state);
  const cmds: Command["type"][] = [];

  if (p.inJail) {
    cmds.push("ROLL_DICE");
    const board = getBoard(state.boardId);
    if (p.money >= board.rules.ransomCost) cmds.push("PAY_RANSOM");
    return cmds;
  }

  cmds.push("ROLL_DICE");

  const board = getBoard(state.boardId);

  // Management commands (only when not in jail)
  for (const [posStr, ownerId] of Object.entries(state.ownership)) {
    if (ownerId !== p.id) continue;
    const pos = Number(posStr);
    // While a swap is pending, the offered props are locked: no build/mortgage/sell.
    if (isInPendingSwap(state, pos)) continue;
    const tile = board.tiles[pos];
    if (!tile) continue;
    const b = getBuildingsAt(state, pos);
    const hasBuildings = b.houses > 0 || b.hotel || b.factory;

    if (tile.type === "street") {
      // BUILD only if the player hasn't already built once this turn (one-build-per-turn).
      if (!state.builtThisTurn && ownsWholeGroup(state, board, p.id, (tile as StreetTile).group) && !state.mortgaged[pos]) {
        if (canConstructHouse(state, board, pos)) cmds.push("BUILD");
        if (canConstructHotel(state, board, pos)) cmds.push("BUILD");
        if (canConstructFactory(state, board, pos)) cmds.push("BUILD");
      }
      if (hasBuildings) {
        if (b.hotel || b.factory) cmds.push("SELL_BUILDING");
        else if (b.houses > 0 && canSellHouse(state, board, pos)) cmds.push("SELL_BUILDING");
      }
    } else {
      // station or attraction: no buildings possible
    }

    if (!state.mortgaged[pos] && !hasBuildings) {
      cmds.push("MORTGAGE");
    }
    if (state.mortgaged[pos]) {
      const mv = mortgageValue(board, tile);
      const cost = Math.floor(mv * board.rules.mortgageUnmortgageMultiplier);
      if (p.money >= cost) cmds.push("UNMORTGAGE");
    }
    if (!hasBuildings && !state.mortgaged[pos]) {
      cmds.push("SELL_PROPERTY");
    }
  }

  // TRAVEL: player is on a station
  if (STATION_POSITIONS.includes(p.position)) {
    cmds.push("TRAVEL");
  }

  // Swap proposal: available in awaiting-roll when no swap is already pending
  if (!state.pendingSwap) {
    cmds.push("PROPOSE_SWAP");
  }

  // Deduplicate
  return [...new Set(cmds)];
}

/**
 * Returns command types that are legal for the given player in the current state.
 * For the current player this delegates to legalCommands(). For the swap target
 * it additionally returns RESPOND_SWAP when there is a pending swap addressed to them.
 */
export function legalCommandsFor(state: GameState, playerId: string): Command["type"][] {
  const cp = state.players[state.currentPlayerIndex];
  if (cp && cp.id === playerId) {
    return legalCommands(state);
  }
  // Non-current player: only legal action is responding to a swap addressed to them
  if (state.pendingSwap && state.pendingSwap.toId === playerId) {
    return ["RESPOND_SWAP"];
  }
  return [];
}

// ---- rent ---------------------------------------------------------------

function streetRent(state: GameState, board: BoardDefinition, pos: number): number {
  const tile = tileAt(board, pos) as StreetTile;
  const b = state.buildings[pos];
  const ownerId = state.ownership[pos]!;
  if (b?.factory) return 0; // factory pays its owner, never charges visitors
  if (b?.hotel) {
    const r = tile.rent[5];
    return state.activeEvent?.id === 'recession' ? Math.floor(r / 2) : r;
  }
  if (b && b.houses > 0) {
    const r = tile.rent[b.houses]!;
    return state.activeEvent?.id === 'recession' ? Math.floor(r / 2) : r;
  }
  // no buildings: base rent, doubled if owner holds the whole colour group
  const base = tile.rent[0];
  const fullGroupRent = ownsWholeGroup(state, board, ownerId, tile.group) ? base * 2 : base;
  return state.activeEvent?.id === 'recession' ? Math.floor(fullGroupRent / 2) : fullGroupRent;
}

function stationRent(state: GameState, board: BoardDefinition, pos: number): number {
  const ownerId = state.ownership[pos]!;
  const count = groupOwnedCount(state, board, ownerId, "station");
  return board.rules.station.rent[Math.max(0, count - 1)] ?? 0;
}

function attractionRent(state: GameState, board: BoardDefinition, pos: number, diceSum: number): number {
  const ownerId = state.ownership[pos]!;
  const both = ownsWholeGroup(state, board, ownerId, 'attraction');
  const factor = both ? board.rules.attraction.factorBoth : board.rules.attraction.factorOne;
  const base = diceSum * factor;
  return state.activeEvent?.id === 'circus' ? base * 2 : base;
}

// ---- money / bankruptcy --------------------------------------------------

/**
 * Transfer `amount` from debtor to creditor (creditor null = bank/casino tax).
 * If the debtor can't cover it, they go bankrupt.
 */
function charge(
  state: GameState,
  board: BoardDefinition,
  debtor: PlayerState,
  amount: number,
  creditorId: string | null,
  events: GameEvent[],
): void {
  if (amount <= 0) return;
  if (debtor.money >= amount) {
    debtor.money -= amount;
    if (creditorId) {
      const creditor = playerById(state, creditorId);
      if (creditor) creditor.money += amount;
    }
    return;
  }
  // bankruptcy
  const remaining = debtor.money;
  debtor.money = 0;
  if (creditorId) {
    const creditor = playerById(state, creditorId);
    if (creditor) creditor.money += remaining;
  }
  bankrupt(state, board, debtor, events);
}

function bankrupt(state: GameState, board: BoardDefinition, player: PlayerState, events: GameEvent[]): void {
  player.alive = false;
  player.inJail = false;
  // release holdings back to the bank
  for (const pos of Object.keys(state.ownership)) {
    const p = Number(pos);
    if (state.ownership[p] === player.id) {
      delete state.ownership[p];
      delete state.buildings[p];
      delete state.mortgaged[p];
    }
  }
  events.push({ key: "bankrupt", params: { player: player.name }, playerId: player.id });
}

// ---- action cards ---------------------------------------------------------

function applyActionCard(
  state: GameState,
  board: BoardDefinition,
  player: PlayerState,
  cardIdx: number,
  events: GameEvent[],
): void {
  const spec = ACTION_CARD_SPECS[cardIdx]!;
  events.push({ key: "actionCard", params: { player: player.name, card: cardId(spec) }, playerId: player.id });

  switch (spec.kind) {
    case "move-random": {
      const positions = getNonSpecialPositions(board);
      const idx = nextInt(state.rng, 0, positions.length - 1);
      const targetPos = positions[idx]!;
      teleportPlayer(state, board, player, targetPos, events);
      resolveLanding(state, board, player, events);
      break;
    }
    case "move-to": {
      if (spec.pos === 0) {
        // GO: grant goLandMoney
        player.position = 0;
        player.money += board.rules.goLandMoney;
        events.push({ key: "goLanded", params: { player: player.name, amount: board.rules.goLandMoney }, playerId: player.id });
        events.push({ key: "actionCardMove", params: { player: player.name, tile: board.tiles[0]!.name }, playerId: player.id });
        // landing on GO tile does nothing extra
      } else {
        teleportPlayer(state, board, player, spec.pos, events);
        resolveLanding(state, board, player, events);
      }
      break;
    }
    case "move-jail": {
      events.push({ key: "actionCardMoveJail", params: { player: player.name }, playerId: player.id });
      sendToJail(state, board, player, events);
      break;
    }
    case "move-forward": {
      events.push({ key: "actionCardMoveForward", params: { player: player.name, steps: spec.steps }, playerId: player.id });
      moveBy(state, board, player, spec.steps, events);
      resolveLanding(state, board, player, events);
      break;
    }
    case "move-next-station": {
      const curPos = player.position;
      let nextStation: number;
      if (curPos < 5 || curPos >= 35) nextStation = 5;
      else if (curPos < 15) nextStation = 15;
      else if (curPos < 25) nextStation = 25;
      else nextStation = 35;
      events.push({ key: "actionCardNextStation", params: { player: player.name }, playerId: player.id });
      teleportPlayer(state, board, player, nextStation, events);
      resolveLanding(state, board, player, events);
      break;
    }
    case "single": {
      const amount = nextInt(state.rng, 1, 5) * spec.multiplier;
      if (spec.positive) {
        player.money += amount;
        events.push({ key: "actionCardCollect", params: { player: player.name, amount, card: spec.id }, playerId: player.id });
      } else {
        events.push({ key: "actionCardPay", params: { player: player.name, amount, card: spec.id }, playerId: player.id });
        charge(state, board, player, amount, null, events);
      }
      break;
    }
    case "broadcast": {
      const amount = nextInt(state.rng, 1, 5) * spec.multiplier;
      if (spec.positive) {
        // collect from each other alive player
        for (const other of state.players) {
          if (!other.alive || other.id === player.id) continue;
          charge(state, board, other, amount, player.id, events);
        }
        events.push({ key: "actionCardBroadcastCollect", params: { player: player.name, amount, card: spec.id }, playerId: player.id });
      } else {
        // pay each other alive player
        for (const other of state.players) {
          if (!other.alive || other.id === player.id) continue;
          charge(state, board, player, amount, other.id, events);
          // Once the drawing player is bankrupt, stop charging — otherwise
          // charge()/bankrupt() would re-fire for every remaining opponent.
          if (!player.alive) break;
        }
        events.push({ key: "actionCardBroadcastPay", params: { player: player.name, amount, card: spec.id }, playerId: player.id });
      }
      break;
    }
    case "repair-factory": {
      const perFactory = nextInt(state.rng, 1, 5) * spec.multiplier;
      let factoryCount = 0;
      for (const [posStr, ownerId] of Object.entries(state.ownership)) {
        if (ownerId !== player.id) continue;
        const b = state.buildings[Number(posStr)];
        if (b?.factory) factoryCount++;
      }
      const total = factoryCount * perFactory;
      events.push({ key: "actionCardRepair", params: { player: player.name, amount: total, card: spec.id }, playerId: player.id });
      if (total > 0) charge(state, board, player, total, null, events);
      break;
    }
    case "repair-general": {
      const houseMult = nextInt(state.rng, 1, 2) * spec.multiplier;
      const hotelMult = nextInt(state.rng, 1, 4) * spec.multiplier;
      const factoryMult = spec.withFactory ? nextInt(state.rng, 1, 3) * spec.multiplier : 0;
      let houseCount = 0, hotelCount = 0, factoryCount = 0;
      for (const [posStr, ownerId] of Object.entries(state.ownership)) {
        if (ownerId !== player.id) continue;
        const b = state.buildings[Number(posStr)];
        if (!b) continue;
        houseCount += b.houses;
        if (b.hotel) hotelCount++;
        if (b.factory) factoryCount++;
      }
      const total = houseCount * houseMult + hotelCount * hotelMult + factoryCount * factoryMult;
      events.push({ key: "actionCardRepair", params: { player: player.name, amount: total, card: spec.id }, playerId: player.id });
      if (total > 0) charge(state, board, player, total, null, events);
      break;
    }
  }
}

function drawActionCard(
  state: GameState,
  board: BoardDefinition,
  player: PlayerState,
  events: GameEvent[],
): void {
  if (state.actionDeck.length === 0) {
    // Either initial draw (deck empty from createGame) or reshuffle discard
    const source = state.actionDiscard.length > 0
      ? state.actionDiscard
      : Array.from({ length: ACTION_CARD_COUNT }, (_, i) => i);
    state.actionDeck = shuffle(state.rng, [...source]);
    state.actionDiscard = [];
  }
  const cardIdx = state.actionDeck.shift()!;
  state.actionDiscard.push(cardIdx);
  applyActionCard(state, board, player, cardIdx, events);
}

// ---- movement helpers -----------------------------------------------------

/**
 * Teleport player to an absolute position, crossing GO if targetPos < fromPos.
 * Does NOT call resolveLanding.
 */
function teleportPlayer(
  state: GameState,
  board: BoardDefinition,
  player: PlayerState,
  targetPos: number,
  events: GameEvent[],
): void {
  const from = player.position;
  player.position = targetPos;
  if (targetPos < from) {
    // wrapped around, passed GO
    player.money += board.rules.goPassMoney;
    events.push({ key: "goPassed", params: { player: player.name, amount: board.rules.goPassMoney }, playerId: player.id });
  }
  const tile = tileAt(board, targetPos);
  events.push({ key: "moved", params: { player: player.name, tile: tile.name, pos: targetPos }, playerId: player.id });
}

// ---- landing resolution --------------------------------------------------

/** Resolve the effect of `player` arriving on its current tile. */
function resolveLanding(
  state: GameState,
  board: BoardDefinition,
  player: PlayerState,
  events: GameEvent[],
): void {
  const pos = player.position;
  const tile = tileAt(board, pos);

  if (isProperty(tile)) {
    const ownerId = state.ownership[pos];
    if (ownerId === undefined) {
      // unowned -> offer purchase
      state.phase = "awaiting-buy";
      state.pendingPurchase = pos;
      events.push({
        key: "purchaseOffer",
        params: { player: player.name, tile: tile.name, price: tilePrice(board, tile) },
        playerId: player.id,
      });
      return;
    }
    if (ownerId === player.id) {
      // own a factory street -> collect revenue
      if (tile.type === "street" && state.buildings[pos]?.factory) {
        const rev = (tile as StreetTile).factoryRevenue;
        player.money += rev;
        events.push({ key: "factoryRevenue", params: { player: player.name, tile: tile.name, amount: rev }, playerId: player.id });
      }
      return;
    }
    if (state.mortgaged[pos]) {
      events.push({ key: "rentMortgaged", params: { tile: tile.name }, playerId: player.id });
      return;
    }
    // pay rent
    const diceSum = player.lastRoll[0] + player.lastRoll[1];
    let rent = 0;
    if (tile.type === "street") rent = streetRent(state, board, pos);
    else if (tile.type === "station") rent = stationRent(state, board, pos);
    else if (tile.type === "attraction") rent = attractionRent(state, board, pos, diceSum);
    const owner = playerById(state, ownerId)!;
    events.push({
      key: "rentPaid",
      params: { player: player.name, owner: owner.name, tile: tile.name, amount: rent },
      playerId: player.id,
    });
    charge(state, board, player, rent, ownerId, events);
    return;
  }

  switch (tile.type) {
    case "tax": {
      const amount = tile.amount ?? board.rules.payToCasino;
      events.push({ key: "taxPaid", params: { player: player.name, amount }, playerId: player.id });
      state.casinoPool += Math.min(amount, player.money);
      charge(state, board, player, amount, null, events);
      break;
    }
    case "gotojail":
      sendToJail(state, board, player, events);
      break;
    case "casino":
      resolveCasino(state, board, player, events);
      break;
    case "go":
      // landing bonus already granted in move(); nothing extra
      break;
    case "freeparking":
      events.push({ key: "freeParking", params: { player: player.name }, playerId: player.id });
      break;
    case "action":
      drawActionCard(state, board, player, events);
      break;
  }
}

function resolveCasino(state: GameState, board: BoardDefinition, player: PlayerState, events: GameEvent[]): void {
  const [d1, d2] = player.lastRoll;
  if (d1 >= 1 && d1 === d2) {
    // Read tunable payout fractions from board rules (with pre-tuning fallback).
    // Before 2026-06 tuning: sixShare=0.5, doubleShare=0.25 caused 52.9% of wins
    // to exceed the winner's cash — too swingy. Now sixShare=0.35, doubleShare=0.2.
    const sixShare = board.rules.casino?.sixShare ?? 0.5;
    const doubleShare = board.rules.casino?.doubleShare ?? 0.25;
    const fraction = d1 === 6 ? sixShare : doubleShare;
    const rawShare = Math.floor(state.casinoPool * fraction);
    const share = state.activeEvent?.id === 'jackpot'
      ? Math.floor(rawShare * 1.5)
      : rawShare;
    const actualShare = Math.min(share, state.casinoPool); // never exceed pool
    player.money += actualShare;
    state.casinoPool -= actualShare;
    events.push({ key: 'casinoWin', params: { player: player.name, amount: actualShare }, playerId: player.id });
  } else {
    events.push({ key: 'casinoNoWin', params: { player: player.name }, playerId: player.id });
  }
}

function sendToJail(state: GameState, board: BoardDefinition, player: PlayerState, events: GameEvent[]): void {
  player.position = JAIL_POS;
  player.inJail = true;
  player.jailTurns = board.rules.jailTurns;
  state.doublesCount = 0;
  state.extraRoll = false;
  events.push({ key: "wentToJail", params: { player: player.name, turns: player.jailTurns }, playerId: player.id });
}

/** Move a player `steps` forward from their current board position, paying GO. */
function moveBy(state: GameState, board: BoardDefinition, player: PlayerState, steps: number, events: GameEvent[]): void {
  const from = player.position;
  const to = wrapPosition(from, steps);
  player.position = to;
  // passed or landed on GO (wrapped past 0)
  if (to < from || steps >= 40) {
    const boomMult = state.activeEvent?.id === 'boom' ? 2 : 1;
    if (to === 0) {
      const amount = board.rules.goLandMoney * boomMult;
      player.money += amount;
      events.push({ key: 'goLanded', params: { player: player.name, amount }, playerId: player.id });
    } else {
      const amount = board.rules.goPassMoney * boomMult;
      player.money += amount;
      events.push({ key: 'goPassed', params: { player: player.name, amount }, playerId: player.id });
    }
  }
  const tile = tileAt(board, to);
  events.push({ key: 'moved', params: { player: player.name, tile: tile.name, pos: to }, playerId: player.id });
}

/** Move out of jail re-entering the track from GO (no GO bonus), then resolve. */
function exitJailAndMove(state: GameState, board: BoardDefinition, player: PlayerState, steps: number, events: GameEvent[]): void {
  player.inJail = false;
  player.jailTurns = 0;
  player.position = wrapPosition(0, steps); // 1..12, deliberately no GO bonus
  const tile = tileAt(board, player.position);
  events.push({ key: "leftJail", params: { player: player.name, tile: tile.name }, playerId: player.id });
  resolveLanding(state, board, player, events);
}

// ---- turn flow -----------------------------------------------------------

function nextAliveIndex(state: GameState): number {
  const n = state.players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (state.currentPlayerIndex + i) % n;
    if (state.players[idx]!.alive) return idx;
  }
  return state.currentPlayerIndex;
}

function checkWin(state: GameState, events: GameEvent[]): boolean {
  if (aliveCount(state) <= 1) {
    const winner = state.players.find((p) => p.alive);
    state.winnerId = winner?.id ?? null;
    state.phase = "finished";
    events.push({ key: "gameOver", params: { player: winner?.name ?? "—" }, playerId: winner?.id });
    return true;
  }
  return false;
}

/** Either give the current player another roll (doubles) or pass the turn. */
function continueOrAdvance(state: GameState, events: GameEvent[]): void {
  if (checkWin(state, events)) return;
  const p = currentPlayer(state);
  if (p.alive && state.extraRoll) {
    state.extraRoll = false;
    state.phase = "awaiting-roll";
    events.push({ key: "extraRoll", params: { player: p.name }, playerId: p.id });
    return;
  }
  // pass turn
  const oldIdx = state.currentPlayerIndex;
  state.doublesCount = 0;
  state.extraRoll = false;
  state.builtThisTurn = false;
  state.currentPlayerIndex = nextAliveIndex(state);
  state.turn += 1;
  state.phase = "awaiting-roll";

  // Round boundary: index wrapped (new index <= old, meaning we cycled past the end)
  if (state.currentPlayerIndex <= oldIdx) {
    state.round += 1;
    state.activeEvent = drawEvent(state);
    events.push({
      key: `specialEvent_${state.activeEvent.id}` as string,
      params: { round: state.round },
    });
  }

  const next = currentPlayer(state);
  events.push({ key: "nextTurn", params: { player: next.name }, playerId: next.id });
}

// ---- public reducer ------------------------------------------------------

export function applyCommand(prev: GameState, command: Command): ReduceResult {
  const state: GameState = structuredClone(prev);
  const board = getBoard(state.boardId);
  const events: GameEvent[] = [];

  if (state.phase === "finished") {
    throw new Error("Game is finished");
  }

  switch (command.type) {
    case "ROLL_DICE": {
      if (state.phase !== "awaiting-roll") throw new Error("Not awaiting a roll");
      const p = currentPlayer(state);
      const d1 = rollDie(state.rng);
      const d2 = rollDie(state.rng);
      p.lastRoll = [d1, d2];
      const doubles = d1 === d2;
      events.push({ key: "rolled", params: { player: p.name, d1, d2, sum: d1 + d2, doubles: doubles ? 1 : 0 }, playerId: p.id });

      if (p.inJail) {
        if (doubles) {
          exitJailAndMove(state, board, p, d1 + d2, events);
          state.extraRoll = false; // escaping consumes the doubles
        } else {
          p.jailTurns -= 1;
          if (p.jailTurns <= 0) {
            // time served: pay ransom (or go bankrupt) then move
            events.push({ key: "jailTimeServed", params: { player: p.name, amount: board.rules.ransomCost }, playerId: p.id });
            charge(state, board, p, board.rules.ransomCost, null, events);
            if (p.alive) exitJailAndMove(state, board, p, d1 + d2, events);
          } else {
            events.push({ key: "jailRollFail", params: { player: p.name, turns: p.jailTurns }, playerId: p.id });
          }
        }
        if (state.phase !== "awaiting-buy") continueOrAdvance(state, events);
        break;
      }

      // normal roll
      if (doubles) {
        state.doublesCount += 1;
        if (state.doublesCount >= 3) {
          events.push({ key: "tripleDoubles", params: { player: p.name }, playerId: p.id });
          sendToJail(state, board, p, events);
          continueOrAdvance(state, events);
          break;
        }
        state.extraRoll = true;
      }
      moveBy(state, board, p, d1 + d2, events);
      resolveLanding(state, board, p, events);
      if (state.phase !== "awaiting-buy") continueOrAdvance(state, events);
      break;
    }

    case "PAY_RANSOM": {
      if (state.phase !== "awaiting-roll") throw new Error("Not awaiting a roll");
      const p = currentPlayer(state);
      if (!p.inJail) throw new Error("Player is not in jail");
      if (p.money < board.rules.ransomCost) throw new Error("Cannot afford ransom");
      p.money -= board.rules.ransomCost;
      p.inJail = false;
      p.jailTurns = 0;
      events.push({ key: "paidRansom", params: { player: p.name, amount: board.rules.ransomCost }, playerId: p.id });
      // player still rolls this turn (now a normal roll)
      break;
    }

    case "BUY_PROPERTY": {
      if (state.phase !== "awaiting-buy" || state.pendingPurchase === null) throw new Error("Nothing to buy");
      const p = currentPlayer(state);
      const pos = state.pendingPurchase;
      const tile = tileAt(board, pos);
      const price = tilePrice(board, tile);
      if (p.money < price) throw new Error("Cannot afford property");
      p.money -= price;
      state.ownership[pos] = p.id;
      events.push({ key: "bought", params: { player: p.name, tile: tile.name, price }, playerId: p.id });
      state.pendingPurchase = null;
      state.phase = "awaiting-roll";
      continueOrAdvance(state, events);
      break;
    }

    case "DECLINE_PROPERTY": {
      if (state.phase !== "awaiting-buy" || state.pendingPurchase === null) throw new Error("Nothing to decline");
      const p = currentPlayer(state);
      const tile = tileAt(board, state.pendingPurchase);
      events.push({ key: "declined", params: { player: p.name, tile: tile.name }, playerId: p.id });
      state.pendingPurchase = null;
      state.phase = "awaiting-roll";
      continueOrAdvance(state, events);
      break;
    }

    case "BUILD": {
      if (state.phase !== "awaiting-roll") throw new Error("Not awaiting a roll");
      const p = currentPlayer(state);
      const pos = command.pos;
      const tile = tileAt(board, pos);
      if (tile.type !== "street") throw new Error("Can only build on streets");
      if (state.ownership[pos] !== p.id) throw new Error("Player does not own this property");
      if (isInPendingSwap(state, pos)) throw new Error("Property is part of a pending swap");
      if (state.mortgaged[pos]) throw new Error("Property is mortgaged");
      if (!ownsWholeGroup(state, board, p.id, (tile as StreetTile).group)) throw new Error("Must own entire group to build");
      if (state.builtThisTurn) throw new Error("one building per turn");

      const st = tile as StreetTile;
      if (!state.buildings[pos]) state.buildings[pos] = { houses: 0, hotel: false, factory: false };
      const b = state.buildings[pos]!;

      if (command.building === 'house') {
        if (!canConstructHouse(state, board, pos)) throw new Error('Cannot build house here (even-build rule or other restriction)');
        const cost = state.activeEvent?.id === 'buildingSale'
          ? Math.floor(st.houseCost / 2)
          : st.houseCost;
        if (p.money < cost) throw new Error('Cannot afford house');
        p.money -= cost;
        b.houses += 1;
        events.push({ key: 'built', params: { player: p.name, building: 'house', tile: st.name, amount: cost }, playerId: p.id });
      } else if (command.building === 'hotel') {
        if (!canConstructHotel(state, board, pos)) throw new Error('Cannot build hotel here');
        const cost = state.activeEvent?.id === 'buildingSale'
          ? Math.floor(st.hotelCost / 2)
          : st.hotelCost;
        if (p.money < cost) throw new Error('Cannot afford hotel');
        p.money -= cost;
        b.houses = 0;
        b.hotel = true;
        b.factory = false;
        events.push({ key: 'built', params: { player: p.name, building: 'hotel', tile: st.name, amount: cost }, playerId: p.id });
      } else if (command.building === 'factory') {
        if (!canConstructFactory(state, board, pos)) throw new Error('Cannot build factory here');
        const cost = state.activeEvent?.id === 'buildingSale'
          ? Math.floor(st.factoryCost / 2)
          : st.factoryCost;
        if (p.money < cost) throw new Error('Cannot afford factory');
        p.money -= cost;
        b.houses = 0;
        b.hotel = false;
        b.factory = true;
        events.push({ key: 'built', params: { player: p.name, building: 'factory', tile: st.name, amount: cost }, playerId: p.id });
      }
      state.builtThisTurn = true;
      // BUILD does not advance the turn
      break;
    }

    case "SELL_BUILDING": {
      if (state.phase !== "awaiting-roll") throw new Error("Not awaiting a roll");
      const p = currentPlayer(state);
      const pos = command.pos;
      if (state.ownership[pos] !== p.id) throw new Error("Player does not own this property");
      if (isInPendingSwap(state, pos)) throw new Error("Property is part of a pending swap");
      const tile = tileAt(board, pos) as StreetTile;
      const b = getBuildingsAt(state, pos);

      if (b.hotel) {
        // hotel knockdown -> 4 houses appear, refund = mortgage value
        const refund = tile.mortgage;
        if (!state.buildings[pos]) state.buildings[pos] = { houses: 0, hotel: false, factory: false };
        state.buildings[pos]!.hotel = false;
        state.buildings[pos]!.houses = 4;
        state.buildings[pos]!.factory = false;
        p.money += refund;
        events.push({ key: "soldBuilding", params: { player: p.name, building: "hotel", tile: tile.name, amount: refund }, playerId: p.id });
      } else if (b.houses > 0) {
        if (!canSellHouse(state, board, pos)) throw new Error("Cannot sell house (even-sell rule)");
        const refund = tile.mortgage;
        if (!state.buildings[pos]) state.buildings[pos] = { houses: 0, hotel: false, factory: false };
        state.buildings[pos]!.houses -= 1;
        p.money += refund;
        events.push({ key: "soldBuilding", params: { player: p.name, building: "house", tile: tile.name, amount: refund }, playerId: p.id });
      } else if (b.factory) {
        const refund = tile.houseCost;
        if (!state.buildings[pos]) state.buildings[pos] = { houses: 0, hotel: false, factory: false };
        state.buildings[pos]!.factory = false;
        p.money += refund;
        events.push({ key: "soldBuilding", params: { player: p.name, building: "factory", tile: tile.name, amount: refund }, playerId: p.id });
      } else {
        throw new Error("No building to sell");
      }
      break;
    }

    case "MORTGAGE": {
      if (state.phase !== "awaiting-roll") throw new Error("Not awaiting a roll");
      const p = currentPlayer(state);
      const pos = command.pos;
      if (state.ownership[pos] !== p.id) throw new Error("Player does not own this property");
      if (isInPendingSwap(state, pos)) throw new Error("Property is part of a pending swap");
      if (state.mortgaged[pos]) throw new Error("Property is already mortgaged");
      const tile = tileAt(board, pos);
      const b = getBuildingsAt(state, pos);
      if (b.houses > 0 || b.hotel || b.factory) throw new Error("Must sell buildings before mortgaging");
      const mv = mortgageValue(board, tile);
      state.mortgaged[pos] = true;
      p.money += mv;
      events.push({ key: "mortgaged", params: { player: p.name, tile: tile.name, amount: mv }, playerId: p.id });
      break;
    }

    case "UNMORTGAGE": {
      if (state.phase !== "awaiting-roll") throw new Error("Not awaiting a roll");
      const p = currentPlayer(state);
      const pos = command.pos;
      if (state.ownership[pos] !== p.id) throw new Error("Player does not own this property");
      if (!state.mortgaged[pos]) throw new Error("Property is not mortgaged");
      const tile = tileAt(board, pos);
      const mv = mortgageValue(board, tile);
      const cost = Math.floor(mv * board.rules.mortgageUnmortgageMultiplier);
      if (p.money < cost) throw new Error("Cannot afford to unmortgage");
      p.money -= cost;
      delete state.mortgaged[pos];
      events.push({ key: "unmortgaged", params: { player: p.name, tile: tile.name, amount: cost }, playerId: p.id });
      break;
    }

    case "SELL_PROPERTY": {
      if (state.phase !== "awaiting-roll") throw new Error("Not awaiting a roll");
      const p = currentPlayer(state);
      const pos = command.pos;
      if (state.ownership[pos] !== p.id) throw new Error("Player does not own this property");
      if (isInPendingSwap(state, pos)) throw new Error("Property is part of a pending swap");
      if (state.mortgaged[pos]) throw new Error("Cannot sell mortgaged property directly");
      const tile = tileAt(board, pos);
      const b = getBuildingsAt(state, pos);
      if (b.houses > 0 || b.hotel || b.factory) throw new Error("Must sell buildings before selling property");
      const refund = Math.floor(tilePrice(board, tile) / 2);
      p.money += refund;
      delete state.ownership[pos];
      delete state.buildings[pos];
      events.push({ key: "soldProperty", params: { player: p.name, tile: tile.name, amount: refund }, playerId: p.id });
      break;
    }

    case "TRAVEL": {
      if (state.phase !== "awaiting-roll") throw new Error("Not awaiting a roll");
      const p = currentPlayer(state);
      if (!STATION_POSITIONS.includes(p.position)) throw new Error("Player is not at a station");
      const toPos = command.toPos;
      if (!STATION_POSITIONS.includes(toPos)) throw new Error("Destination is not a station");
      if (toPos === p.position) throw new Error("Cannot travel to current station");

      const destOwnerId = state.ownership[toPos];
      let ticketCost = 0;
      if (destOwnerId && destOwnerId !== p.id) {
        const stationsOwned = groupOwnedCount(state, board, destOwnerId, "station");
        const idx = Math.min(stationsOwned - 1, 2);
        ticketCost = board.rules.station.travel[idx] ?? 0;
      }

      const from = p.position;
      p.position = toPos;
      // Check GO crossing: teleport wraps if toPos < from
      if (toPos < from) {
        p.money += board.rules.goPassMoney;
        events.push({ key: "goPassed", params: { player: p.name, amount: board.rules.goPassMoney }, playerId: p.id });
      }

      const destTile = tileAt(board, toPos);
      events.push({ key: "traveled", params: { player: p.name, tile: destTile.name, from, cost: ticketCost }, playerId: p.id });

      if (ticketCost > 0 && destOwnerId) {
        charge(state, board, p, ticketCost, destOwnerId, events);
        // If the ticket bankrupted the payer the turn must still advance/continue
        // (mirror the charge sites in resolveLanding) or the game would hang.
        if (!p.alive) {
          continueOrAdvance(state, events);
          break;
        }
      }

      // TRAVEL is a management command: does not advance the turn
      // Travel ticket covers the cost of using the station; no additional rent landing resolution
      break;
    }

    case "PROPOSE_SWAP": {
      if (state.phase !== "awaiting-roll") throw new Error("Not awaiting a roll");
      if (state.pendingSwap) throw new Error("A swap offer is already pending");
      const proposer = currentPlayer(state);
      const { toId, give, receive } = command;

      const target = playerById(state, toId);
      if (!target) throw new Error("Target player not found");
      if (!target.alive) throw new Error("Target player is not in the game");
      if (toId === proposer.id) throw new Error("Cannot propose swap to yourself");

      // Validate give leg: proposer owns all give.props, unbuilt, not mortgaged
      for (const pos of give.props) {
        if (state.ownership[pos] !== proposer.id) throw new Error(`Proposer does not own property at ${pos}`);
        const b = getBuildingsAt(state, pos);
        if (b.houses > 0 || b.hotel || b.factory) throw new Error(`Property at ${pos} has buildings - sell them first`);
        if (state.mortgaged[pos]) throw new Error(`Property at ${pos} is mortgaged`);
      }
      if (give.money < 0) throw new Error("Give money must be non-negative");
      if (give.money > proposer.money) throw new Error("Proposer cannot afford the offered money");

      // Validate receive leg: target owns all receive.props, unbuilt, not mortgaged
      for (const pos of receive.props) {
        if (state.ownership[pos] !== toId) throw new Error(`Target does not own property at ${pos}`);
        const b = getBuildingsAt(state, pos);
        if (b.houses > 0 || b.hotel || b.factory) throw new Error(`Property at ${pos} has buildings - sell them first`);
        if (state.mortgaged[pos]) throw new Error(`Property at ${pos} is mortgaged`);
      }
      if (receive.money < 0) throw new Error("Receive money must be non-negative");
      if (receive.money > target.money) throw new Error("Target cannot afford the requested money");

      state.pendingSwap = { fromId: proposer.id, toId, give, receive };

      const propNames = give.props.map((pos) => board.tiles[pos]?.name ?? `pos${pos}`).join(", ");
      const recNames = receive.props.map((pos) => board.tiles[pos]?.name ?? `pos${pos}`).join(", ");
      events.push({
        key: "swapProposed",
        params: {
          from: proposer.name,
          to: target.name,
          giveProps: propNames || "-",
          giveMoney: give.money,
          receiveProps: recNames || "-",
          receiveMoney: receive.money,
        },
        playerId: proposer.id,
      });
      // Does NOT consume the roll or advance the turn
      break;
    }

    case "RESPOND_SWAP": {
      const swap = state.pendingSwap;
      if (!swap) throw new Error("No pending swap offer");
      const from = playerById(state, swap.fromId);
      const to = playerById(state, swap.toId);
      if (!from || !to) throw new Error("Swap player not found");

      if (!command.accept) {
        state.pendingSwap = null;
        events.push({
          key: "swapDeclined",
          params: { from: from.name, to: to.name },
          playerId: to.id,
        });
        break;
      }

      // Atomicity: verify both sides can still afford their money legs before touching anything
      if (swap.give.money > from.money) {
        state.pendingSwap = null;
        events.push({
          key: "swapFailed",
          params: { from: from.name, to: to.name, reason: "proposer insufficient funds" },
          playerId: from.id,
        });
        break;
      }
      if (swap.receive.money > to.money) {
        state.pendingSwap = null;
        events.push({
          key: "swapFailed",
          params: { from: from.name, to: to.name, reason: "target insufficient funds" },
          playerId: to.id,
        });
        break;
      }

      // Re-verify ownership hasn't changed since proposal
      for (const pos of swap.give.props) {
        if (state.ownership[pos] !== swap.fromId) {
          state.pendingSwap = null;
          events.push({ key: "swapFailed", params: { from: from.name, to: to.name, reason: "ownership changed" }, playerId: from.id });
          return { state, events };
        }
      }
      for (const pos of swap.receive.props) {
        if (state.ownership[pos] !== swap.toId) {
          state.pendingSwap = null;
          events.push({ key: "swapFailed", params: { from: from.name, to: to.name, reason: "ownership changed" }, playerId: to.id });
          return { state, events };
        }
      }

      // Re-verify nothing was mortgaged/built on the offered props between
      // proposal and accept (the proposer can act on their own turn meanwhile).
      for (const pos of [...swap.give.props, ...swap.receive.props]) {
        const b = getBuildingsAt(state, pos);
        if (state.mortgaged[pos] || b.houses > 0 || b.hotel || b.factory) {
          state.pendingSwap = null;
          events.push({ key: "swapFailed", params: { from: from.name, to: to.name, reason: "property encumbered" }, playerId: from.id });
          return { state, events };
        }
      }

      // Execute atomically: cash first, then property transfer
      from.money -= swap.give.money;
      to.money += swap.give.money;
      to.money -= swap.receive.money;
      from.money += swap.receive.money;

      for (const pos of swap.give.props) {
        state.ownership[pos] = swap.toId;
      }
      for (const pos of swap.receive.props) {
        state.ownership[pos] = swap.fromId;
      }

      state.pendingSwap = null;

      const giveNames = swap.give.props.map((pos) => board.tiles[pos]?.name ?? `pos${pos}`).join(", ");
      const receiveNames = swap.receive.props.map((pos) => board.tiles[pos]?.name ?? `pos${pos}`).join(", ");
      events.push({
        key: "swapAccepted",
        params: {
          from: from.name,
          to: to.name,
          giveProps: giveNames || "-",
          giveMoney: swap.give.money,
          receiveProps: receiveNames || "-",
          receiveMoney: swap.receive.money,
        },
        playerId: to.id,
      });
      // Turn does NOT advance: proposer continues their turn
      break;
    }
  }

  return { state, events };
}

// ---- exported UI predicates -----------------------------------------------

const STATION_POSITIONS_SET = new Set(STATION_POSITIONS);

export function ownedPropsOf(state: GameState, playerId: string): number[] {
  return Object.entries(state.ownership)
    .filter(([, id]) => id === playerId)
    .map(([pos]) => Number(pos));
}

export function canBuild(state: GameState, pos: number, kind: "house" | "hotel" | "factory"): boolean {
  if (state.builtThisTurn) return false; // one-build-per-turn
  const board = getBoard(state.boardId);
  const tile = board.tiles[pos];
  if (!tile || tile.type !== "street") return false;
  if (state.ownership[pos] !== currentPlayer(state).id) return false;
  if (!ownsWholeGroup(state, board, currentPlayer(state).id, (tile as StreetTile).group)) return false;
  if (state.mortgaged[pos]) return false;
  if (kind === "house") return canConstructHouse(state, board, pos);
  if (kind === "hotel") return canConstructHotel(state, board, pos);
  if (kind === "factory") return canConstructFactory(state, board, pos);
  return false;
}

export function canSellBuilding(state: GameState, pos: number): boolean {
  const board = getBoard(state.boardId);
  const tile = board.tiles[pos];
  if (!tile || tile.type !== "street") return false;
  const b = getBuildingsAt(state, pos);
  if (b.hotel) return true;
  if (b.factory) return true;
  if (b.houses > 0) return canSellHouse(state, board, pos);
  return false;
}

export function canMortgage(state: GameState, pos: number): boolean {
  const board = getBoard(state.boardId);
  const tile = board.tiles[pos];
  if (!tile) return false;
  if (state.mortgaged[pos]) return false;
  const b = getBuildingsAt(state, pos);
  return !(b.houses > 0 || b.hotel || b.factory);
}

export function canUnmortgage(state: GameState, pos: number): boolean {
  const board = getBoard(state.boardId);
  const tile = board.tiles[pos];
  if (!tile) return false;
  if (!state.mortgaged[pos]) return false;
  const player = currentPlayer(state);
  const mv = mortgageValue(board, tile);
  const cost = Math.floor(mv * board.rules.mortgageUnmortgageMultiplier);
  return player.money >= cost;
}

export function canSellProperty(state: GameState, pos: number): boolean {
  const board = getBoard(state.boardId);
  const tile = board.tiles[pos];
  if (!tile) return false;
  if (state.mortgaged[pos]) return false;
  const b = getBuildingsAt(state, pos);
  return !(b.houses > 0 || b.hotel || b.factory);
}

export function canTravelFrom(state: GameState, playerId: string): number[] {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !STATION_POSITIONS_SET.has(player.position)) return [];
  return STATION_POSITIONS.filter((s) => s !== player.position);
}

export { mortgageValue, tilePrice };
