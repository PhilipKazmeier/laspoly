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
import { makeRng, rollDie } from "./rng.js";
import type {
  Command,
  GameEvent,
  GameState,
  NewGameOptions,
  PlayerState,
  ReduceResult,
} from "./types.js";

const GO_TO_JAIL_POS = 30;

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
  return {
    boardId: opts.boardId,
    rng: makeRng(opts.seed),
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

/** Commands that are legal in the current state (for bots, clients, validation). */
export function legalCommands(state: GameState): Command["type"][] {
  if (state.phase === "finished") return [];
  if (state.phase === "awaiting-buy") return ["BUY_PROPERTY", "DECLINE_PROPERTY"];
  // awaiting-roll
  const p = currentPlayer(state);
  if (p.inJail) {
    return p.money >= getBoard(state.boardId).rules.ransomCost
      ? ["ROLL_DICE", "PAY_RANSOM"]
      : ["ROLL_DICE"];
  }
  return ["ROLL_DICE"];
}

// ---- rent ---------------------------------------------------------------

function streetRent(state: GameState, board: BoardDefinition, pos: number): number {
  const tile = tileAt(board, pos) as StreetTile;
  const b = state.buildings[pos];
  const ownerId = state.ownership[pos]!;
  if (b?.factory) return 0; // factory pays its owner, never charges visitors
  if (b?.hotel) return tile.rent[5];
  if (b && b.houses > 0) return tile.rent[b.houses]!; // rent[1..4]
  // no buildings: base rent, doubled if owner holds the whole colour group
  const base = tile.rent[0];
  return ownsWholeGroup(state, board, ownerId, tile.group) ? base * 2 : base;
}

function stationRent(state: GameState, board: BoardDefinition, pos: number): number {
  const ownerId = state.ownership[pos]!;
  const count = groupOwnedCount(state, board, ownerId, "station");
  return board.rules.station.rent[Math.max(0, count - 1)] ?? 0;
}

function attractionRent(state: GameState, board: BoardDefinition, pos: number, diceSum: number): number {
  const ownerId = state.ownership[pos]!;
  const both = ownsWholeGroup(state, board, ownerId, "attraction");
  const factor = both ? board.rules.attraction.factorBoth : board.rules.attraction.factorOne;
  return diceSum * factor;
}

// ---- money / bankruptcy --------------------------------------------------

/**
 * Transfer `amount` from debtor to creditor (creditor null = bank/casino tax).
 * If the debtor can't cover it, they go bankrupt: remaining cash goes to the
 * creditor, their holdings return to the bank, and they are eliminated.
 * (MVP has no asset-selling-to-survive yet — that's Phase 2.)
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
      // Phase 2: action card deck. For now an explicit no-op message.
      events.push({ key: "actionFieldNoop", params: { player: player.name }, playerId: player.id });
      break;
  }
}

function resolveCasino(state: GameState, board: BoardDefinition, player: PlayerState, events: GameEvent[]): void {
  const [d1, d2] = player.lastRoll;
  if (d1 >= 1 && d1 === d2) {
    const share = d1 === 6 ? Math.floor(state.casinoPool / 2) : Math.floor(state.casinoPool / 4);
    player.money += share;
    state.casinoPool -= share;
    events.push({ key: "casinoWin", params: { player: player.name, amount: share }, playerId: player.id });
  } else {
    events.push({ key: "casinoNoWin", params: { player: player.name }, playerId: player.id });
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
    if (to === 0) {
      player.money += board.rules.goLandMoney;
      events.push({ key: "goLanded", params: { player: player.name, amount: board.rules.goLandMoney }, playerId: player.id });
    } else {
      player.money += board.rules.goPassMoney;
      events.push({ key: "goPassed", params: { player: player.name, amount: board.rules.goPassMoney }, playerId: player.id });
    }
  }
  const tile = tileAt(board, to);
  events.push({ key: "moved", params: { player: player.name, tile: tile.name, pos: to }, playerId: player.id });
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
  state.doublesCount = 0;
  state.extraRoll = false;
  state.currentPlayerIndex = nextAliveIndex(state);
  state.turn += 1;
  state.phase = "awaiting-roll";
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
  }

  return { state, events };
}

export { mortgageValue, tilePrice };
