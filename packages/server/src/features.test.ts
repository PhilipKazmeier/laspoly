/**
 * Tests for features 8, 10, 12, 13, 14, 17.
 * All tests run directly against engine/room without booting a socket server.
 */
import { describe, it, expect } from "vitest";
import {
  createGame,
  applyCommand,
  applySurrender,
  netWorth,
  getBoard,
  currentPlayer,
  botDecide,
  type GameState,
} from "@laspoly/shared";
import { GameRoom, pickAutoAction } from "./room.js";

const BOARD = "vegas";
const BOARD_DEF = getBoard(BOARD);

// ---------------------------------------------------------------------------
// Helper: make a minimal 2-player game
// ---------------------------------------------------------------------------
function makeGame(settings?: Parameters<typeof createGame>[0]["settings"]): GameState {
  return createGame({
    boardId: BOARD,
    seed: 1,
    players: [
      { id: "A", name: "Alice", isBot: false, color: "red" },
      { id: "B", name: "Bob",   isBot: false, color: "blue" },
    ],
    settings,
  });
}

// ---------------------------------------------------------------------------
// Feature 8: netWorth
// ---------------------------------------------------------------------------
describe("Feature 8 — netWorth", () => {
  it("equals cash when player owns nothing", () => {
    const state = makeGame();
    const p = state.players[0]!;
    expect(netWorth(state, p.id)).toBe(p.money);
  });

  it("returns 0 for unknown player", () => {
    const state = makeGame();
    expect(netWorth(state, "nobody")).toBe(0);
  });

  it("adds property sell-back value for owned unmortgaged property", () => {
    const state = makeGame();
    const p = state.players[0]!;
    const initialWorth = netWorth(state, p.id);
    // Give the player pos 1 directly
    state.ownership[1] = p.id;
    const afterWorth = netWorth(state, p.id);
    expect(afterWorth).toBeGreaterThan(initialWorth);
  });

  it("does not count mortgaged properties", () => {
    const state = makeGame();
    const p = state.players[0]!;
    state.ownership[1] = p.id;
    const withProp = netWorth(state, p.id);
    state.mortgaged[1] = true;
    const withMortgage = netWorth(state, p.id);
    expect(withMortgage).toBeLessThan(withProp);
  });

  it("includes building sell-back values", () => {
    const state = makeGame();
    const p = state.players[0]!;
    state.ownership[1] = p.id;
    const withProp = netWorth(state, p.id);
    // Add a house
    state.buildings[1] = { houses: 1, hotel: false, factory: false };
    const withHouse = netWorth(state, p.id);
    expect(withHouse).toBeGreaterThan(withProp);
  });
});

// ---------------------------------------------------------------------------
// Feature 12: SURRENDER
// ---------------------------------------------------------------------------
describe("Feature 12 — SURRENDER", () => {
  it("surrendering current player eliminates them", () => {
    const state = makeGame();
    expect(currentPlayer(state).id).toBe("A");
    const { state: after, events } = applyCommand(state, { type: "SURRENDER" });
    expect(after.players.find((p) => p.id === "A")!.alive).toBe(false);
    expect(events.some((e) => e.key === "surrendered")).toBe(true);
  });

  it("surrendering in a 2-player game ends game with opponent as winner", () => {
    const state = makeGame();
    const { state: after } = applyCommand(state, { type: "SURRENDER" });
    expect(after.phase).toBe("finished");
    expect(after.winnerId).toBe("B");
  });

  it("surrendering non-current player via applySurrender works", () => {
    const state = makeGame();
    // A is current; surrender B
    const { state: after, events } = applySurrender(state, "B");
    expect(after.players.find((p) => p.id === "B")!.alive).toBe(false);
    expect(events.some((e) => e.key === "surrendered")).toBe(true);
    expect(after.phase).toBe("finished");
    expect(after.winnerId).toBe("A");
  });

  it("surrendered player's properties go back to bank", () => {
    const state = makeGame();
    state.ownership[1] = "A";
    state.ownership[3] = "A";
    const { state: after } = applyCommand(state, { type: "SURRENDER" });
    expect(after.ownership[1]).toBeUndefined();
    expect(after.ownership[3]).toBeUndefined();
  });

  it("GameRoom routes surrender for non-current player", () => {
    const room = new GameRoom("Test", BOARD, 0);
    const aliceId = room.addHuman("Alice");
    const bobId = room.addHuman("Bob");
    room.setReady(aliceId, true);
    room.setReady(bobId, true);
    room.start(42);
    const cp = currentPlayer(room.state!);
    const nonCurrentId = cp.id === aliceId ? bobId : aliceId;
    const events = room.applyHumanCommand(nonCurrentId, { type: "SURRENDER" });
    expect(room.state!.players.find((p) => p.id === nonCurrentId)!.alive).toBe(false);
    expect(events.some((e) => e.key === "surrendered")).toBe(true);
    expect(room.state!.phase).toBe("finished");
  });

  it("surrendering already-eliminated player throws", () => {
    const state = makeGame();
    const { state: s2 } = applyCommand(state, { type: "SURRENDER" });
    expect(() => applySurrender(s2, "A")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Feature 17: Game settings
// ---------------------------------------------------------------------------
describe("Feature 17 — Game settings", () => {
  it("startingCapitalMult=2 gives players double starting cash", () => {
    const normal = makeGame();
    const double = makeGame({ startingCapitalMult: 2 });
    expect(double.players[0]!.money).toBe(normal.players[0]!.money * 2);
  });

  it("buildingCostMult is stored on GameState", () => {
    const state = makeGame({ buildingCostMult: 0.5 });
    expect(state.buildingCostMult).toBe(0.5);
  });

  it("buildingCostMult=1 (default) is stored", () => {
    const state = makeGame();
    expect(state.buildingCostMult).toBe(1);
  });

  it("buildingCostMult=0.5 halves house cost charged", () => {
    // Set up a state where we can build on a full group
    // Find a 2-street group in vegas
    const groups = new Map<string, number[]>();
    for (const tile of BOARD_DEF.tiles) {
      if (tile.type === "street" && tile.group) {
        if (!groups.has(tile.group)) groups.set(tile.group, []);
        groups.get(tile.group)!.push(tile.pos);
      }
    }
    const twoStreetGroup = [...groups.entries()].find(([, positions]) => positions.length === 2);
    expect(twoStreetGroup).toBeDefined();
    const [, positions] = twoStreetGroup!;
    const [pos0, pos1] = positions;

    const state = makeGame({ buildingCostMult: 0.5 });
    state.ownership[pos0!] = "A";
    state.ownership[pos1!] = "A";
    state.players[0]!.money = 99999;

    const result = applyCommand(state, { type: "BUILD", pos: pos0!, building: "house" });
    const builtEvent = result.events.find((e) => e.key === "built");
    expect(builtEvent).toBeDefined();
    const charged = builtEvent!.params["amount"] as number;
    const tile0 = BOARD_DEF.tiles[pos0!];
    const expectedCost = tile0!.type === "street" ? Math.round(tile0.houseCost * 0.5) : NaN;
    expect(charged).toBe(expectedCost);
  });

  it("botDifficulty easy → passive buying: declines when cash is between easy and normal buffer", () => {
    // Easy buyBuffer=400, normal buyBuffer=200.
    // Set cash to price+300 → easy declines (300 < 400 buffer), normal buys (300 >= 200 buffer).
    const pricePos = BOARD_DEF.tiles.find((t) => t.type === "street")!;
    const price = pricePos.type === "street" ? pricePos.price : 60;
    const pendingPos = pricePos.pos;

    const stateEasy = makeGame({ botDifficulty: "easy" });
    stateEasy.phase = "awaiting-buy";
    stateEasy.pendingPurchase = pendingPos;
    stateEasy.players[0]!.isBot = true;
    stateEasy.players[0]!.money = price + 300;

    const stateNormal = makeGame({ botDifficulty: "normal" });
    stateNormal.phase = "awaiting-buy";
    stateNormal.pendingPurchase = pendingPos;
    stateNormal.players[0]!.isBot = true;
    stateNormal.players[0]!.money = price + 300;

    // Only run if 300 is between normal buffer (200) and easy buffer (400)
    if (price + 300 >= price + 200 && price + 300 < price + 400) {
      expect(botDecide(stateEasy).type).toBe("DECLINE_PROPERTY");
      expect(botDecide(stateNormal).type).toBe("BUY_PROPERTY");
    } else {
      // price structure doesn't allow this differentiation; just check types are valid
      const easyCmd = botDecide(stateEasy).type;
      expect(["BUY_PROPERTY", "DECLINE_PROPERTY"]).toContain(easyCmd);
    }
  });

  it("GameRoom stores and uses settings in start()", () => {
    const room = new GameRoom("Test", BOARD, 1);
    const alice = room.addHuman("Alice");
    room.setReady(alice, true);
    room.updateSettings({ startingCapitalMult: 2 });
    room.start(1);
    const expected = BOARD_DEF.rules.initialCapital * 2;
    for (const p of room.state!.players) {
      expect(p.money).toBe(expected);
    }
  });
});

// ---------------------------------------------------------------------------
// Feature 13: New game / rematch
// ---------------------------------------------------------------------------
describe("Feature 13 — restart / rematch", () => {
  it("restart() resets state to fresh game after finishing", () => {
    const room = new GameRoom("Test", BOARD, 1);
    const alice = room.addHuman("Alice");
    room.setReady(alice, true);
    room.start(1);
    room.state!.phase = "finished";
    room.state!.winnerId = alice;
    room.restart(99);
    expect(room.state!.phase).toBe("awaiting-roll");
    expect(room.state!.winnerId).toBeNull();
    expect(room.state!.players.some((p) => p.name === "Alice")).toBe(true);
    expect(room.state!.players.length).toBeGreaterThanOrEqual(2);
  });

  it("restart() throws if game is not finished", () => {
    const room = new GameRoom("Test", BOARD, 1);
    const alice = room.addHuman("Alice");
    room.setReady(alice, true);
    room.start(1);
    expect(() => room.restart(99)).toThrow("not finished");
  });

  it("restart() preserves settings (e.g. startingCapitalMult)", () => {
    const room = new GameRoom("Test", BOARD, 0);
    const a = room.addHuman("A");
    const b = room.addHuman("B");
    room.setReady(a, true);
    room.setReady(b, true);
    room.updateSettings({ startingCapitalMult: 3 });
    room.start(1);
    room.state!.phase = "finished";
    room.state!.winnerId = a;
    room.restart(2);
    const expected = BOARD_DEF.rules.initialCapital * 3;
    expect(room.state!.players[0]!.money).toBe(expected);
  });

  it("restart() resets human ready states", () => {
    const room = new GameRoom("Test", BOARD, 0);
    const a = room.addHuman("A");
    const b = room.addHuman("B");
    room.setReady(a, true);
    room.setReady(b, true);
    room.start(1);
    room.state!.phase = "finished";
    room.state!.winnerId = a;
    room.restart(3);
    // After restart, humans should not be ready
    const view = room.toView();
    const humanPlayers = view.players.filter((p) => !p.isBot);
    expect(humanPlayers.every((p) => !p.ready)).toBe(true);
    expect(room.canStart()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Feature 10: Ready-up in lobby
// ---------------------------------------------------------------------------
describe("Feature 10 — ready-up", () => {
  it("canStart() is false when no one is ready", () => {
    const room = new GameRoom("Test", BOARD, 0);
    room.addHuman("Alice");
    room.addHuman("Bob");
    expect(room.canStart()).toBe(false);
  });

  it("canStart() is false when only one of two humans is ready", () => {
    const room = new GameRoom("Test", BOARD, 0);
    const a = room.addHuman("Alice");
    room.addHuman("Bob");
    room.setReady(a, true);
    expect(room.canStart()).toBe(false);
  });

  it("canStart() is true when all humans are ready and ≥2 total participants", () => {
    const room = new GameRoom("Test", BOARD, 0);
    const a = room.addHuman("Alice");
    const b = room.addHuman("Bob");
    room.setReady(a, true);
    room.setReady(b, true);
    expect(room.canStart()).toBe(true);
  });

  it("canStart() is true with 1 human (ready) + 1 bot", () => {
    const room = new GameRoom("Test", BOARD, 1);
    const a = room.addHuman("Alice");
    room.setReady(a, true);
    expect(room.canStart()).toBe(true);
  });

  it("canStart() is false with 1 human + 0 bots (only 1 participant)", () => {
    const room = new GameRoom("Test", BOARD, 0);
    const a = room.addHuman("Alice");
    room.setReady(a, true);
    expect(room.canStart()).toBe(false);
  });

  it("toView() exposes ready state per player and canStart", () => {
    const room = new GameRoom("Test", BOARD, 0);
    const a = room.addHuman("Alice");
    room.addHuman("Bob");
    room.setReady(a, true);
    const view = room.toView();
    const alice = view.players.find((p) => p.nickname === "Alice")!;
    const bob = view.players.find((p) => p.nickname === "Bob")!;
    expect(alice.ready).toBe(true);
    expect(bob.ready).toBe(false);
    expect(view.canStart).toBe(false);
  });

  it("setReady returns error after game started", () => {
    const room = new GameRoom("Test", BOARD, 1);
    const a = room.addHuman("Alice");
    room.setReady(a, true);
    room.start(1);
    expect(room.setReady(a, false)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Feature 14: Turn timer auto-action helper (pure function tests)
// ---------------------------------------------------------------------------
describe("Feature 14 — pickAutoAction (auto-action helper)", () => {
  it("returns DECLINE_PROPERTY when in awaiting-buy phase", () => {
    const state = makeGame();
    state.phase = "awaiting-buy";
    state.pendingPurchase = 1;
    expect(pickAutoAction(state, "A")?.type).toBe("DECLINE_PROPERTY");
  });

  it("returns ROLL_DICE when in awaiting-roll phase (normal turn)", () => {
    const state = makeGame();
    // A is current player in awaiting-roll
    expect(pickAutoAction(state, "A")?.type).toBe("ROLL_DICE");
  });

  it("returns null for non-current player with no legal moves", () => {
    const state = makeGame();
    // B is not current, no pending swap
    expect(pickAutoAction(state, "B")).toBeNull();
  });

  it("returns ROLL_DICE for jailed player", () => {
    const state = makeGame();
    const p = state.players.find((pl) => pl.id === "A")!;
    p.inJail = true;
    p.jailTurns = 2;
    expect(pickAutoAction(state, "A")?.type).toBe("ROLL_DICE");
  });

  it("returns null for finished game", () => {
    const state = makeGame();
    state.phase = "finished";
    expect(pickAutoAction(state, "A")).toBeNull();
  });
});
