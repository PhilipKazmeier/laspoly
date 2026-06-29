/**
 * Tests for the four server/protocol fixes:
 *  1. "Already in a room" stuck state — createRoom/joinRoom auto-leave
 *  2. Per-connection locale (setLocale)
 *  3. Figure/colour selection (chooseFigure validation + flow into game)
 *  4. Per-round specialEvent i18n coverage
 */

import { describe, it, expect } from "vitest";
import { botDecide, currentPlayer, formatEvent } from "@laspoly/shared";
import { FIGURE_COLORS, FIGURE_COUNT } from "@laspoly/shared";
import type { GameEvent, Locale } from "@laspoly/shared";
import { GameRoom, RoomManager } from "./room.js";

const BOARD = "vegas";

// ---------------------------------------------------------------------------
// Fix 1: "Already in a room" — auto-leave semantics in GameRoom
// ---------------------------------------------------------------------------
describe("Fix 1 — auto-leave allows rejoining after a finished game", () => {
  it("removeHuman + new room addHuman works after game finishes", () => {
    // seed=0 is known to finish within command cap from room.test.ts
    const room = new GameRoom("Old Room", BOARD, 3);
    const playerId = room.addHuman("Alice");
    room.start(0);

    // Fast-forward to finished (same cap as room.test.ts)
    const MAX_COMMANDS = 500 * 4 * 8;
    let cmds = 0;
    while (room.state!.phase !== "finished" && cmds < MAX_COMMANDS) {
      const cp = currentPlayer(room.state!);
      if (cp.isBot) {
        room.stepOneBot();
      } else {
        const cmd = botDecide(room.state!);
        room.applyHumanCommand(playerId, cmd);
      }
      cmds++;
    }

    expect(room.state!.phase).toBe("finished");

    // removeHuman (game started → marks disconnected)
    room.removeHuman(playerId);
    const p = room.players.find((pp) => pp.id === playerId);
    expect(p?.connected).toBe(false);

    // In a new room, addHuman should work normally
    const room2 = new GameRoom("New Room", BOARD, 1);
    const newId = room2.addHuman("Alice");
    expect(newId).toBeTruthy();
    expect(room2.players.length).toBe(1);
  });

  it("a player can rejoin (new room) after explicit leave via RoomManager", () => {
    const mgr = new RoomManager();
    const room = mgr.create("Room A", BOARD, 1);
    const pid = room.addHuman("Bob");

    // Leave before game starts
    room.removeHuman(pid);
    expect(room.players.filter((p) => !p.isBot).length).toBe(0);
    mgr.delete(room.id);

    // Now create a new room — should work fine
    const room2 = mgr.create("Room B", BOARD, 1);
    const pid2 = room2.addHuman("Bob");
    expect(pid2).toBeTruthy();
    expect(room2.players.filter((p) => !p.isBot).length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Fix 2 — per-connection locale: formatEventsForConn with different locales
// ---------------------------------------------------------------------------
describe("Fix 2 — per-connection locale formatting", () => {
  const event: GameEvent = {
    key: "specialEvent_circus",
    params: { round: 3 },
  };

  it("formats specialEvent_circus in German", () => {
    const text = formatEvent(event, "de");
    expect(text).toContain("Zirkus");
    expect(text).toContain("3");
    expect(text).not.toContain("{");
  });

  it("formats specialEvent_circus in English", () => {
    const text = formatEvent(event, "en");
    expect(text).toContain("circus");
    expect(text).toContain("3");
    expect(text).not.toContain("{");
  });

  it("de and en produce different text for the same event", () => {
    const de = formatEvent(event, "de");
    const en = formatEvent(event, "en");
    expect(de).not.toBe(en);
  });

  it("formatEvents in GameRoom respects the given locale", () => {
    const room = new GameRoom("Test", BOARD, 1);
    room.addHuman("Alice");
    room.start(1);
    const rawEvents: GameEvent[] = [
      { key: "specialEvent_recession", params: { round: 1 } },
      { key: "rolled", params: { player: "Alice", d1: 2, d2: 3, sum: 5 } },
    ];
    const de = room.formatEvents(rawEvents, "de");
    const en = room.formatEvents(rawEvents, "en");
    expect(de[0]!.text).toContain("Rezession");
    expect(en[0]!.text).toContain("Recession");
    expect(de[1]!.text).toContain("würfelt");
    expect(en[1]!.text).toContain("rolls");
  });
});

// ---------------------------------------------------------------------------
// Fix 3 — chooseFigure validation and defaults
// ---------------------------------------------------------------------------
describe("Fix 3 — figure/colour selection", () => {
  it("assigns default color and figureIndex on addHuman", () => {
    const room = new GameRoom("Test", BOARD, 0);
    room.addHuman("Alice");
    const p = room.players[0]!;
    expect(FIGURE_COLORS).toContain(p.color);
    expect(p.figureIndex).toBeGreaterThanOrEqual(0);
    expect(p.figureIndex).toBeLessThan(FIGURE_COUNT);
  });

  it("assigns distinct defaults to multiple humans", () => {
    const room = new GameRoom("Test", BOARD, 0);
    room.addHuman("Alice");
    room.addHuman("Bob");
    const [a, b] = room.players;
    expect(a!.color).not.toBe(b!.color);
    expect(a!.figureIndex).not.toBe(b!.figureIndex);
  });

  it("chooseFigure succeeds for a valid unclaimed colour/figure", () => {
    const room = new GameRoom("Test", BOARD, 0);
    const pid = room.addHuman("Alice");
    const err = room.chooseFigure(pid, "blue", 1);
    expect(err).toBeNull();
    expect(room.players[0]!.color).toBe("blue");
    expect(room.players[0]!.figureIndex).toBe(1);
  });

  it("chooseFigure rejects a colour already taken by another player", () => {
    const room = new GameRoom("Test", BOARD, 0);
    room.addHuman("Alice"); // gets color[0] = "red"
    const pid2 = room.addHuman("Bob");
    const aliceColor = room.players[0]!.color;
    const err = room.chooseFigure(pid2, aliceColor, 2);
    expect(err).toContain("taken");
  });

  it("chooseFigure rejects a figureIndex already taken by another player", () => {
    const room = new GameRoom("Test", BOARD, 0);
    room.addHuman("Alice");
    const pid2 = room.addHuman("Bob");
    const aliceFig = room.players[0]!.figureIndex;
    // Bob tries a different color but Alice's figureIndex
    const err = room.chooseFigure(pid2, "green", aliceFig);
    expect(err).toContain("taken");
  });

  it("chooseFigure rejects invalid colour", () => {
    const room = new GameRoom("Test", BOARD, 0);
    const pid = room.addHuman("Alice");
    const err = room.chooseFigure(pid, "chartreuse", 0);
    expect(err).toBeTruthy();
    expect(err).toContain("colour");
  });

  it("chooseFigure rejects out-of-range figureIndex", () => {
    const room = new GameRoom("Test", BOARD, 0);
    const pid = room.addHuman("Alice");
    const err = room.chooseFigure(pid, "red", FIGURE_COUNT);
    expect(err).toBeTruthy();
  });

  it("chosen colour flows into the started game's PlayerState", () => {
    const room = new GameRoom("Test", BOARD, 1);
    const pid = room.addHuman("Alice");
    room.chooseFigure(pid, "purple", 3);
    room.start(7);
    const player = room.state!.players.find((p) => p.id === pid);
    expect(player).toBeDefined();
    expect(player!.color).toBe("purple");
  });

  it("toView includes color and figureIndex for each player", () => {
    const room = new GameRoom("Test", BOARD, 0);
    const pid = room.addHuman("Alice");
    room.chooseFigure(pid, "green", 2);
    const view = room.toView();
    const vp = view.players.find((p) => p.id === pid);
    expect(vp!.color).toBe("green");
    expect(vp!.figureIndex).toBe(2);
  });

  it("chooseFigure is blocked after game starts", () => {
    const room = new GameRoom("Test", BOARD, 1);
    const pid = room.addHuman("Alice");
    room.start(5);
    const err = room.chooseFigure(pid, "blue", 1);
    expect(err).toContain("started");
  });
});

// ---------------------------------------------------------------------------
// Fix 4 — specialEvent full sentences in both locales
// ---------------------------------------------------------------------------
describe("Fix 4 — specialEvent complete sentences in both locales", () => {
  const EVENT_IDS = ["circus", "boom", "recession", "jackpot", "buildingSale", "quietDay"] as const;

  for (const id of EVENT_IDS) {
    const key = `specialEvent_${id}`;
    for (const locale of ["de", "en"] as Locale[]) {
      it(`${locale}:${key} is a complete sentence with effect description`, () => {
        const ev: GameEvent = { key, params: { round: 1 } };
        const text = formatEvent(ev, locale);
        expect(text).not.toMatch(/^\[/); // not a fallback
        expect(text).not.toContain("{"); // no unresolved placeholders
        expect(text.length).toBeGreaterThan(30); // a complete sentence
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Fix 5 — bot colours/figures are unique across all players (incl. bots)
// ---------------------------------------------------------------------------
describe("Fix 5 — bot colours and figures are all distinct after start()", () => {
  it("1 human + 5 bots all have unique colours and figureIndices", () => {
    const room = new GameRoom("Test", BOARD, 5);
    room.addHuman("Alice");
    room.start(1);
    const players = room.players;
    expect(players).toHaveLength(6);

    const colors = players.map((p) => p.color);
    const figures = players.map((p) => p.figureIndex);

    // All colours must be distinct
    expect(new Set(colors).size).toBe(6);
    // All figureIndices must be distinct
    expect(new Set(figures).size).toBe(6);
  });

  it("multiple human players also get distinct defaults", () => {
    const room = new GameRoom("Test", BOARD, 2);
    room.addHuman("Alice");
    room.addHuman("Bob");
    room.addHuman("Carol");
    room.start(1);
    const players = room.players;
    expect(players).toHaveLength(5); // 3 humans + 2 bots, capped at min(6, total)

    const colors = players.map((p) => p.color);
    const figures = players.map((p) => p.figureIndex);
    expect(new Set(colors).size).toBe(players.length);
    expect(new Set(figures).size).toBe(players.length);
  });
});
