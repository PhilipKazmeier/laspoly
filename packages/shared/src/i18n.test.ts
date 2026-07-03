import { describe, it, expect } from "vitest";
import { formatEvent, ALL_EVENT_KEYS, type Locale } from "./i18n.js";
import type { GameEvent } from "./types.js";

const LOCALES: Locale[] = ["de", "en"];

// Minimal param sets for each key so interpolation leaves no placeholders
const SAMPLE_PARAMS: Record<string, Record<string, string | number>> = {
  rolled: { player: "Alice", d1: 3, d2: 4, sum: 7, doubles: 0 },
  moved: { player: "Alice", tile: "Park Lane", pos: 39 },
  goPassed: { player: "Alice", amount: 200 },
  goLanded: { player: "Alice", amount: 400 },
  purchaseOffer: { player: "Alice", tile: "Park Lane", price: 350 },
  bought: { player: "Alice", tile: "Park Lane", price: 350 },
  declined: { player: "Alice", tile: "Park Lane" },
  rentPaid: { player: "Bob", owner: "Alice", tile: "Park Lane", amount: 50 },
  rentMortgaged: { tile: "Park Lane" },
  factoryRevenue: { player: "Alice", tile: "Park Lane", amount: 100 },
  taxPaid: { player: "Alice", amount: 150 },
  casinoEntered: { player: "Alice" },
  casinoRoll: { player: "Alice", d1: 3, d2: 4, sum: 7 },
  casinoWin: { player: "Alice", amount: 250 },
  casinoNoWin: { player: "Alice" },
  wentToJail: { player: "Alice", turns: 3 },
  tripleDoubles: { player: "Alice" },
  jailRollFail: { player: "Alice", turns: 2 },
  jailTimeServed: { player: "Alice", amount: 50 },
  paidRansom: { player: "Alice", amount: 50 },
  leftJail: { player: "Alice", tile: "Just Visiting" },
  freeParking: { player: "Alice" },
  actionFieldNoop: { player: "Alice" },
  bankrupt: { player: "Alice" },
  gameOver: { player: "Alice" },
  nextTurn: { player: "Bob" },
  extraRoll: { player: "Alice" },
  built: { player: "Alice", building: "house", tile: "Park Lane", amount: 50 },
  soldBuilding: { player: "Alice", building: "house", tile: "Park Lane", amount: 30 },
  mortgaged: { player: "Alice", tile: "Park Lane", amount: 100 },
  unmortgaged: { player: "Alice", tile: "Park Lane", amount: 110 },
  soldProperty: { player: "Alice", tile: "Park Lane", amount: 175 },
  traveled: { player: "Alice", tile: "Caesar Station", from: 5, cost: 75 },
  actionCard: { player: "Alice", card: "birthday" },
  actionCardMove: { player: "Alice", tile: "GO" },
  actionCardMoveJail: { player: "Alice" },
  actionCardMoveForward: { player: "Alice", steps: 5 },
  actionCardNextStation: { player: "Alice" },
  actionCardPay: { player: "Alice", amount: 90, card: "gamblingTax" },
  actionCardCollect: { player: "Alice", amount: 75, card: "yardSale" },
  actionCardBroadcastPay: { player: "Alice", amount: 60, card: "youGotPromoted" },
  actionCardBroadcastCollect: { player: "Alice", amount: 50, card: "birthday" },
  actionCardRepair: { player: "Alice", amount: 40, card: "generalRepairs" },
  turnEnd: { player: "Alice" },
  swapProposed: { from: "Alice", to: "Bob", giveProps: "Park Lane", giveMoney: 100, receiveProps: "Boardwalk", receiveMoney: 0 },
  swapAccepted: { from: "Alice", to: "Bob", giveProps: "Park Lane", giveMoney: 100, receiveProps: "Boardwalk", receiveMoney: 0 },
  swapDeclined: { from: "Alice", to: "Bob" },
  swapFailed: { from: "Alice", to: "Bob", reason: "insufficient funds" },
  surrendered: { player: "Alice" },
  specialEvent_circus: { round: 2 },
  specialEvent_boom: { round: 2 },
  specialEvent_recession: { round: 2 },
  specialEvent_jackpot: { round: 2 },
  specialEvent_buildingSale: { round: 2 },
  specialEvent_quietDay: { round: 2 },
  specialEvent_earthquake: { round: 2 },
  specialEvent_taxAudit: { round: 2 },
  specialEvent_lottery: { round: 2 },
  specialEvent_windfall: { round: 2 },
  specialEvent_streetParty: { round: 2, group: "mistyrose" },
  specialEvent_powerOutage: { round: 2 },
  specialEvent_marketCrash: { round: 2 },
  specialEvent_goldRush: { round: 2 },
  earthquakeDamage: { player: "Alice", tile: "Park Lane", fee: 50 },
  taxAuditPaid: { player: "Alice", amount: 120 },
  lotteryWin: { player: "Alice", amount: 200 },
  windfallCollect: { amount: 100 },
};

describe("i18n", () => {
  it("has templates for every event key in both locales", () => {
    for (const key of ALL_EVENT_KEYS) {
      for (const locale of LOCALES) {
        const event: GameEvent = { key, params: SAMPLE_PARAMS[key] ?? {} };
        const text = formatEvent(event, locale);
        // Should NOT fall back to the JSON dump format
        expect(text, `${locale}:${key} should have a template`).not.toMatch(/^\[/);
      }
    }
  });

  it("interpolates params leaving no leftover placeholders", () => {
    for (const key of ALL_EVENT_KEYS) {
      for (const locale of LOCALES) {
        const event: GameEvent = { key, params: SAMPLE_PARAMS[key] ?? {} };
        const text = formatEvent(event, locale);
        expect(text, `${locale}:${key} should not contain {`).not.toContain("{");
      }
    }
  });

  it("returns a readable fallback for unknown keys", () => {
    const event: GameEvent = { key: "unknownKey", params: { foo: "bar" } };
    const text = formatEvent(event, "de");
    expect(text).toContain("unknownKey");
    expect(text).not.toBe("");
  });

  it("formats rentPaid correctly in German", () => {
    const event: GameEvent = {
      key: "rentPaid",
      params: { player: "Bob", owner: "Alice", tile: "Park Lane", amount: 50 },
    };
    const text = formatEvent(event, "de");
    expect(text).toContain("Bob");
    expect(text).toContain("50");
    expect(text).toContain("Alice");
    expect(text).toContain("Park Lane");
  });

  it("formats wentToJail in both locales", () => {
    const event: GameEvent = { key: "wentToJail", params: { player: "Charlie", turns: 3 } };
    expect(formatEvent(event, "de")).toContain("Charlie");
    expect(formatEvent(event, "de")).toContain("3");
    expect(formatEvent(event, "en")).toContain("jail");
  });
});
