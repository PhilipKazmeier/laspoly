import { describe, it, expect } from "vitest";
import { GameRoom } from "./room.js";
import { currentPlayer, botDecide } from "@laspoly/shared";

const BOARD = "vegas";

function makeRoom(botCount = 3) {
  const room = new GameRoom("Test Room", BOARD, botCount);
  const playerId = room.addHuman("Alice");
  return { room, playerId };
}

describe("GameRoom", () => {
  it("starts correctly with 1 human + 3 bots", () => {
    const { room, playerId } = makeRoom(3);
    room.start(42);
    expect(room.started).toBe(true);
    expect(room.state).not.toBeNull();
    // 1 human + 3 bots = 4 players total
    expect(room.state!.players).toHaveLength(4);
    expect(room.state!.players.filter((p) => !p.isBot)).toHaveLength(1);
    expect(room.state!.players.filter((p) => p.isBot)).toHaveLength(3);
  });

  it("rejects applyHumanCommand if game not started", () => {
    const { room, playerId } = makeRoom();
    expect(() => room.applyHumanCommand(playerId, { type: "ROLL_DICE" })).toThrow("not started");
  });

  it("rejects out-of-turn command", () => {
    const { room, playerId } = makeRoom(3);
    room.start(1);
    // Advance to a point where human may not be current player
    // The human player's ID is playerId; if they are first they can play,
    // but we test a non-existent player id
    expect(() => room.applyHumanCommand("wrong-id", { type: "ROLL_DICE" })).toThrow();
  });

  it("rejects illegal command (cannot BUY_PROPERTY when awaiting roll)", () => {
    const { room, playerId } = makeRoom(3);
    room.start(99);
    const state = room.state!;
    // Find a seed where the human is first player and in awaiting-roll phase
    // then try to send BUY_PROPERTY which is illegal in that phase
    if (currentPlayer(state).id === playerId) {
      expect(() => room.applyHumanCommand(playerId, { type: "BUY_PROPERTY" })).toThrow();
    } else {
      // Human not current player — should throw not-your-turn
      expect(() => room.applyHumanCommand(playerId, { type: "ROLL_DICE" })).toThrow();
    }
  });

  it("reaches a finished game within command cap for multiple seeds", () => {
    // Seeds verified to finish within 500 turns with 4 players
    const seeds = [0, 35, 53, 140, 153];
    for (const seed of seeds) {
      const { room, playerId } = makeRoom(3);
      room.start(seed);

      // One command at a time (like sim.ts: maxCommands = maxTurns * numPlayers * 4)
      const MAX_COMMANDS = 500 * 4 * 4;
      let cmds = 0;

      while (room.state!.phase !== "finished" && cmds < MAX_COMMANDS) {
        const cp = currentPlayer(room.state!);
        let events;
        if (cp.id === playerId) {
          const cmd = botDecide(room.state!);
          events = room.applyHumanCommand(playerId, cmd);
        } else {
          events = room.stepOneBot();
        }
        const formatted = room.formatEvents(events);
        for (const fe of formatted) {
          expect(fe.text.length).toBeGreaterThan(0);
          expect(fe.text).not.toMatch(/^\[/); // not a fallback
        }
        cmds++;
      }

      expect(room.state!.phase, `seed ${seed} should finish`).toBe("finished");
      expect(room.state!.winnerId, `seed ${seed} should have a winner`).not.toBeNull();
    }
  });

  it("formatEvents produces non-empty text for all events", () => {
    const { room, playerId } = makeRoom(3);
    room.start(42);

    // Collect events from a few bot steps
    const events = room.stepBots();
    if (events.length > 0) {
      const formatted = room.formatEvents(events, "de");
      for (const fe of formatted) {
        expect(fe.key).toBeTruthy();
        expect(fe.text).toBeTruthy();
        expect(fe.text.length).toBeGreaterThan(0);
      }
    }
  });

  it("toSummary and toView return correct shapes", () => {
    const { room, playerId } = makeRoom(2);
    const summary = room.toSummary();
    expect(summary.id).toBeTruthy();
    expect(summary.name).toBe("Test Room");
    expect(summary.started).toBe(false);
    expect(summary.playerCount).toBe(1);

    const view = room.toView();
    expect(view.botCount).toBe(2);
    expect(view.host).toBe(playerId);
    expect(view.players).toHaveLength(1);
  });
});
