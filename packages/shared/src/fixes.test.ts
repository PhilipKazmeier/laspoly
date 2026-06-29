import { describe, it, expect } from "vitest";
import {
  createGame,
  applyCommand,
  legalCommands,
  ACTION_CARD_IDS,
} from "./engine.js";
import { formatEvent, ALL_CARD_IDS } from "./i18n.js";
import type { GameState } from "./types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function twoPlayers(seed = 0): GameState {
  return createGame({
    boardId: "vegas",
    seed,
    players: [
      { id: "A", name: "Alice", isBot: true, color: "red" },
      { id: "B", name: "Bob", isBot: true, color: "blue" },
    ],
  });
}

function fourPlayers(seed = 0): GameState {
  return createGame({
    boardId: "vegas",
    seed,
    players: [
      { id: "A", name: "Alice", isBot: true, color: "red" },
      { id: "B", name: "Bob", isBot: true, color: "blue" },
      { id: "C", name: "Carol", isBot: true, color: "green" },
      { id: "D", name: "Dave", isBot: true, color: "yellow" },
    ],
  });
}

// ---------------------------------------------------------------------------
// Fix 1: TRAVEL bankruptcy must not deadlock
// ---------------------------------------------------------------------------

describe("Fix 1: TRAVEL bankruptcy advances the turn", () => {
  it("advances the game when the ticket cost bankrupts the traveler", () => {
    const s = structuredClone(twoPlayers());
    // Bob owns all 4 stations -> max travel ticket (225).
    s.ownership[5] = "B";
    s.ownership[15] = "B";
    s.ownership[25] = "B";
    s.ownership[35] = "B";
    // Alice is at station 5 with not enough to pay the ticket.
    s.currentPlayerIndex = 0;
    s.players[0]!.position = 5;
    s.players[0]!.money = 10; // < 225 ticket
    s.phase = "awaiting-roll";

    const { state, events } = applyCommand(s, { type: "TRAVEL", toPos: 15 });
    expect(state.players[0]!.alive).toBe(false);
    // game ends (only Bob left) and a single bankrupt + gameOver are emitted
    expect(events.filter((e) => e.key === "bankrupt")).toHaveLength(1);
    expect(state.phase).toBe("finished");
    expect(state.winnerId).toBe("B");
  });

  it("still advances normally when no bankruptcy occurs", () => {
    const s = structuredClone(fourPlayers());
    s.ownership[15] = "B";
    s.currentPlayerIndex = 0;
    s.players[0]!.position = 5;
    s.players[0]!.money = 1000;
    s.phase = "awaiting-roll";
    const { state } = applyCommand(s, { type: "TRAVEL", toPos: 15 });
    // TRAVEL is a management command: turn does NOT advance, still Alice's turn
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.players[0]!.alive).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Fix 2: Broadcast "pay each player" emits a single bankrupt event
// ---------------------------------------------------------------------------

describe("Fix 2: broadcast pay-each-player single bankrupt", () => {
  it("fires bankrupt exactly once when the drawer can't pay everyone", () => {
    // Seed 5 rolls 5+2=7 from pos 0, landing on the action tile at pos 7.
    // Preset the deck so the draw is youGotPromoted (idx 20): pay each other
    // alive player. With 3 opponents and almost no cash, Alice goes bankrupt;
    // the loop must stop after the first charge that bankrupts her.
    const s = structuredClone(fourPlayers(5));
    s.currentPlayerIndex = 0;
    s.players[0]!.money = 1; // cannot afford any payment
    s.actionDeck = [20]; // youGotPromoted (broadcast pay)
    s.actionDiscard = [];
    s.phase = "awaiting-roll";

    const { state, events } = applyCommand(s, { type: "ROLL_DICE" });
    expect(state.players[0]!.alive).toBe(false);
    // Exactly one bankrupt event, despite three opponents to pay.
    expect(events.filter((e) => e.key === "bankrupt")).toHaveLength(1);
    // Alice's last cash went to a single creditor; total opponent cash gained = 1.
    const opponentGain = state.players.slice(1).reduce((sum, p) => sum + (p.money - 1300), 0);
    expect(opponentGain).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Fix 3: pending-swap props are locked + accept re-verifies encumbrance
// ---------------------------------------------------------------------------

describe("Fix 3: pending swap locks offered props", () => {
  function swapState(): GameState {
    const s = structuredClone(twoPlayers());
    s.players[0]!.money = 5000;
    s.players[1]!.money = 5000;
    // Alice owns the full mistyrose group (13,14); Bob owns deeppink (3,4).
    s.ownership[13] = "A";
    s.ownership[14] = "A";
    s.ownership[3] = "B";
    s.ownership[4] = "B";
    s.currentPlayerIndex = 0;
    s.phase = "awaiting-roll";
    return s;
  }

  it("rejects BUILD/MORTGAGE/SELL on a property that is part of a pending swap", () => {
    const s = swapState();
    const { state: proposed } = applyCommand(s, {
      type: "PROPOSE_SWAP",
      toId: "B",
      give: { props: [13], money: 0 },
      receive: { props: [3], money: 0 },
    });
    expect(proposed.pendingSwap).not.toBeNull();
    // 13 is offered -> all management on it is illegal
    expect(() => applyCommand(proposed, { type: "BUILD", pos: 13, building: "house" })).toThrow(/pending swap/);
    expect(() => applyCommand(proposed, { type: "MORTGAGE", pos: 13 })).toThrow(/pending swap/);
    expect(() => applyCommand(proposed, { type: "SELL_PROPERTY", pos: 13 })).toThrow(/pending swap/);
    // legalCommands must not surface management commands for the locked prop.
    // 14 is NOT in the swap, so management on it is still fine.
    const legal = legalCommands(proposed);
    // 14 alone is not a full group (needs 13 too) so BUILD won't appear; but
    // MORTGAGE/SELL_PROPERTY on 14 should still be available.
    expect(legal).toContain("MORTGAGE");
  });

  it("fails the swap if an offered prop was mortgaged before accept", () => {
    const s = swapState();
    const { state: proposed } = applyCommand(s, {
      type: "PROPOSE_SWAP",
      toId: "B",
      give: { props: [13], money: 0 },
      receive: { props: [3], money: 0 },
    });
    // Force a mortgage on the offered prop (simulating a stale/illegal state)
    const tampered = structuredClone(proposed);
    tampered.mortgaged[13] = true;
    const { state, events } = applyCommand(tampered, { type: "RESPOND_SWAP", accept: true });
    expect(state.pendingSwap).toBeNull();
    expect(events.some((e) => e.key === "swapFailed")).toBe(true);
    // No transfer happened
    expect(state.ownership[13]).toBe("A");
    expect(state.ownership[3]).toBe("B");
  });

  it("fails the swap if an offered prop had buildings before accept", () => {
    const s = swapState();
    const { state: proposed } = applyCommand(s, {
      type: "PROPOSE_SWAP",
      toId: "B",
      give: { props: [13], money: 0 },
      receive: { props: [3], money: 0 },
    });
    const tampered = structuredClone(proposed);
    tampered.buildings[13] = { houses: 1, hotel: false, factory: false };
    const { state, events } = applyCommand(tampered, { type: "RESPOND_SWAP", accept: true });
    expect(state.pendingSwap).toBeNull();
    expect(events.some((e) => e.key === "swapFailed")).toBe(true);
    expect(state.ownership[13]).toBe("A");
  });

  it("still completes a clean swap", () => {
    const s = swapState();
    const { state: proposed } = applyCommand(s, {
      type: "PROPOSE_SWAP",
      toId: "B",
      give: { props: [13], money: 0 },
      receive: { props: [3], money: 0 },
    });
    const { state, events } = applyCommand(proposed, { type: "RESPOND_SWAP", accept: true });
    expect(events.some((e) => e.key === "swapAccepted")).toBe(true);
    expect(state.ownership[13]).toBe("B");
    expect(state.ownership[3]).toBe("A");
  });
});

// ---------------------------------------------------------------------------
// Fix 4: hotel demolition no longer deadlocks a group
// ---------------------------------------------------------------------------

describe("Fix 4: hotel + siblings at 4 houses can be fully sold down", () => {
  it("liquidates a group with a hotel and a sibling at 4 houses (no deadlock)", () => {
    // mistyrose group: 13, 14. 13 = hotel, 14 = 4 houses.
    let s = structuredClone(twoPlayers());
    s.players[0]!.money = 5000;
    s.ownership[13] = "A";
    s.ownership[14] = "A";
    s.buildings[13] = { houses: 0, hotel: true, factory: false };
    s.buildings[14] = { houses: 4, hotel: false, factory: false };
    s.currentPlayerIndex = 0;
    s.phase = "awaiting-roll";

    // Sell the hotel -> 13 becomes 4 houses. Old behavior froze here forever.
    ({ state: s } = applyCommand(s, { type: "SELL_BUILDING", pos: 13 }));
    expect(s.buildings[13]!.hotel).toBe(false);
    expect(s.buildings[13]!.houses).toBe(4);

    // Now both at 4 houses. With the `>` fix, the group can be liquidated fully.
    let guard = 0;
    while (guard++ < 20) {
      const b13 = s.buildings[13] ?? { houses: 0, hotel: false, factory: false };
      const b14 = s.buildings[14] ?? { houses: 0, hotel: false, factory: false };
      if (b13.houses === 0 && b14.houses === 0) break;
      // Sell from whichever has the most (or equal) — both legal under `>`.
      const target = b13.houses >= b14.houses && b13.houses > 0 ? 13 : 14;
      ({ state: s } = applyCommand(s, { type: "SELL_BUILDING", pos: target }));
    }
    expect((s.buildings[13]?.houses ?? 0)).toBe(0);
    expect((s.buildings[14]?.houses ?? 0)).toBe(0);
    expect(guard).toBeLessThan(20); // proves no deadlock
  });
});

// ---------------------------------------------------------------------------
// Balancing: single-street groups can build HOUSES (paced by one-build-per-turn)
// but NOT a hotel; base monopoly still doubles. (The 2026-06 blanket single-street
// build BAN was reverted in favour of the classic one-building-per-turn rule, which
// stops the round-3 build rush without removing building as a termination driver.
// A single-street HOTEL stays banned because its rent — e.g. 2210 on Edison Walker
// — is a guaranteed one-shot KO; 4 houses is the lethality ceiling for lone streets.)
// ---------------------------------------------------------------------------

describe("Balance: single-street groups build houses but not hotels (one-per-turn paced)", () => {
  // brown=1, violet=11, lightgreen=21, darkviolet=31 are single-street.
  const SINGLE = [1, 11, 21, 31];

  for (const pos of SINGLE) {
    it(`single-street pos ${pos} can build a house (one-per-turn pace)`, () => {
      const s = structuredClone(twoPlayers());
      s.players[0]!.money = 5000;
      s.ownership[pos] = "A";
      s.currentPlayerIndex = 0;
      s.phase = "awaiting-roll";
      // House build is now allowed (single-street ban reverted)
      const { state } = applyCommand(s, { type: "BUILD", pos, building: "house" });
      expect(state.buildings[pos]?.houses).toBe(1);
      expect(state.builtThisTurn).toBe(true);
      // legalCommands offered BUILD before the build happened
      expect(legalCommands(s)).toContain("BUILD");
    });

    it(`single-street pos ${pos}: second build in same turn is rejected`, () => {
      const s = structuredClone(twoPlayers());
      s.players[0]!.money = 5000;
      s.ownership[pos] = "A";
      s.currentPlayerIndex = 0;
      s.phase = "awaiting-roll";
      const { state: s1 } = applyCommand(s, { type: "BUILD", pos, building: "house" });
      expect(s1.buildings[pos]?.houses).toBe(1);
      // One-build-per-turn: a 2nd build this turn is rejected, and BUILD is gone from legalCommands
      expect(() => applyCommand(s1, { type: "BUILD", pos, building: "house" })).toThrow(/one building per turn/);
      expect(legalCommands(s1)).not.toContain("BUILD");
    });

    it(`single-street pos ${pos}: a hotel is rejected even with 4 houses`, () => {
      const s = structuredClone(twoPlayers());
      s.players[0]!.money = 5000;
      s.ownership[pos] = "A";
      s.buildings[pos] = { houses: 4, hotel: false, factory: false }; // maxed houses
      s.currentPlayerIndex = 0;
      s.phase = "awaiting-roll";
      // Hotels are banned on single-street groups (lethal one-shot rent).
      expect(() => applyCommand(s, { type: "BUILD", pos, building: "hotel" })).toThrow();
      // ...and legalCommands must not offer BUILD (the only buildable upgrade would be a hotel).
      expect(legalCommands(s)).not.toContain("BUILD");
    });
  }

  it("still allows building on a 2-street full group", () => {
    const s = structuredClone(twoPlayers());
    s.players[0]!.money = 5000;
    s.ownership[13] = "A";
    s.ownership[14] = "A"; // mistyrose, 2 streets
    s.currentPlayerIndex = 0;
    s.phase = "awaiting-roll";
    const { state } = applyCommand(s, { type: "BUILD", pos: 13, building: "house" });
    expect(state.buildings[13]?.houses).toBe(1);
  });

  it("still allows building on a 3-street full group", () => {
    const s = structuredClone(twoPlayers());
    s.players[0]!.money = 5000;
    // turquoise = 6, 8, 9 (3 streets)
    s.ownership[6] = "A";
    s.ownership[8] = "A";
    s.ownership[9] = "A";
    s.currentPlayerIndex = 0;
    s.phase = "awaiting-roll";
    const { state } = applyCommand(s, { type: "BUILD", pos: 6, building: "house" });
    expect(state.buildings[6]?.houses).toBe(1);
  });

  it("single-street monopoly still doubles base rent", () => {
    // Seed 10 rolls 6+5=11 from pos 0, landing Bob on violet pos 11.
    // Alice owns the whole violet group (just pos 11), so base rent 10 doubles to 20.
    const s = structuredClone(twoPlayers(10));
    s.ownership[11] = "A";
    s.currentPlayerIndex = 1; // Bob rolls
    s.players[1]!.position = 0;
    s.players[1]!.money = 1000;
    s.phase = "awaiting-roll";
    const { state, events } = applyCommand(s, { type: "ROLL_DICE" });
    expect(state.players[1]!.position).toBe(11); // landed on violet
    const rentEvent = events.find((e) => e.key === "rentPaid");
    expect(rentEvent).toBeDefined();
    expect(rentEvent!.params.amount).toBe(20); // base 10 doubled (single-street monopoly)
    expect(state.players[1]!.money).toBe(980);
    expect(state.players[0]!.money).toBe(1320); // Alice received the doubled rent
  });
});

// ---------------------------------------------------------------------------
// C1: action-card events render localized friendly names, no raw ids
// ---------------------------------------------------------------------------

describe("C1: action card names are localized", () => {
  it("i18n has a friendly name for every engine card id, in both locales", () => {
    for (const id of ACTION_CARD_IDS) {
      expect(ALL_CARD_IDS).toContain(id);
      for (const locale of ["de", "en"] as const) {
        const text = formatEvent({ key: "actionCard", params: { player: "Alice", card: id } }, locale);
        expect(text).not.toContain(id); // no raw id
        expect(text).not.toContain("{"); // no leftover placeholder
      }
    }
  });

  it("renders friendly names for representative card events", () => {
    const de = formatEvent({ key: "actionCardPay", params: { player: "Alice", amount: 90, card: "gamblingTax" } }, "de");
    expect(de).toContain("Glücksspielsteuer");
    expect(de).toContain("90");
    expect(de).not.toContain("gamblingTax");

    const en = formatEvent({ key: "actionCardCollect", params: { player: "Alice", amount: 50, card: "inherit" } }, "en");
    expect(en).toContain("Inheritance");
    expect(en).not.toContain("inherit{"); // not the raw id followed by brace
    expect(en).not.toContain("{");

    const move = formatEvent({ key: "actionCard", params: { player: "Alice", card: "move-random" } }, "de");
    expect(move).toContain("Reise ins Glück");
    expect(move).not.toContain("move-random");
  });
});
