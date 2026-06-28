import { describe, it, expect } from "vitest";
import { createGame, applyCommand, legalCommands, legalCommandsFor } from "./engine.js";
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

/** Give player A ownership of pos (unbuilt, unmortgaged). */
function giveOwnership(state: GameState, playerId: string, ...positions: number[]): GameState {
  const s = structuredClone(state);
  for (const pos of positions) {
    s.ownership[pos] = playerId;
    delete s.buildings[pos];
    delete s.mortgaged[pos];
  }
  return s;
}

/** Set player money. */
function setMoney(state: GameState, playerId: string, amount: number): GameState {
  const s = structuredClone(state);
  const p = s.players.find((pl) => pl.id === playerId)!;
  p.money = amount;
  return s;
}

// ---------------------------------------------------------------------------
// Basic setup: positions we'll use
// pos 1 = Arndt Avenue (group: brown, owned by A)
// pos 3 = Frank Sinatra Route (group: deeppink, owned by B)
// ---------------------------------------------------------------------------

function stateWithProperties(): GameState {
  let s = twoPlayers();
  s = giveOwnership(s, "A", 1);  // A owns pos 1
  s = giveOwnership(s, "B", 3);  // B owns pos 3
  // A is current player (index 0), phase awaiting-roll
  return s;
}

// ---------------------------------------------------------------------------
// PROPOSE_SWAP validation
// ---------------------------------------------------------------------------

describe("PROPOSE_SWAP validation", () => {
  it("rejects if not in awaiting-roll phase", () => {
    let s = stateWithProperties();
    s = structuredClone(s);
    s.phase = "awaiting-buy";
    expect(() =>
      applyCommand(s, { type: "PROPOSE_SWAP", toId: "B", give: { props: [1], money: 0 }, receive: { props: [], money: 0 } })
    ).toThrow("Not awaiting a roll");
  });

  it("rejects if a swap is already pending", () => {
    let s = stateWithProperties();
    ({ state: s } = applyCommand(s, { type: "PROPOSE_SWAP", toId: "B", give: { props: [1], money: 0 }, receive: { props: [], money: 0 } }));
    expect(() =>
      applyCommand(s, { type: "PROPOSE_SWAP", toId: "B", give: { props: [], money: 0 }, receive: { props: [], money: 0 } })
    ).toThrow("already pending");
  });

  it("rejects proposal to self", () => {
    const s = stateWithProperties();
    expect(() =>
      applyCommand(s, { type: "PROPOSE_SWAP", toId: "A", give: { props: [], money: 0 }, receive: { props: [], money: 0 } })
    ).toThrow("yourself");
  });

  it("rejects if proposer does not own a give.prop", () => {
    const s = stateWithProperties();
    expect(() =>
      applyCommand(s, { type: "PROPOSE_SWAP", toId: "B", give: { props: [3], money: 0 }, receive: { props: [], money: 0 } })
    ).toThrow("Proposer does not own");
  });

  it("rejects if target does not own a receive.prop", () => {
    const s = stateWithProperties();
    expect(() =>
      applyCommand(s, { type: "PROPOSE_SWAP", toId: "B", give: { props: [], money: 0 }, receive: { props: [1], money: 0 } })
    ).toThrow("Target does not own");
  });

  it("rejects if give.prop has buildings", () => {
    let s = stateWithProperties();
    s = structuredClone(s);
    s.buildings[1] = { houses: 1, hotel: false, factory: false };
    expect(() =>
      applyCommand(s, { type: "PROPOSE_SWAP", toId: "B", give: { props: [1], money: 0 }, receive: { props: [], money: 0 } })
    ).toThrow("buildings");
  });

  it("rejects if give.prop is mortgaged", () => {
    let s = stateWithProperties();
    s = structuredClone(s);
    s.mortgaged[1] = true;
    expect(() =>
      applyCommand(s, { type: "PROPOSE_SWAP", toId: "B", give: { props: [1], money: 0 }, receive: { props: [], money: 0 } })
    ).toThrow("mortgaged");
  });

  it("rejects if proposer can't afford give.money", () => {
    let s = stateWithProperties();
    s = setMoney(s, "A", 50);
    expect(() =>
      applyCommand(s, { type: "PROPOSE_SWAP", toId: "B", give: { props: [], money: 100 }, receive: { props: [], money: 0 } })
    ).toThrow("cannot afford");
  });

  it("rejects if target can't afford receive.money", () => {
    let s = stateWithProperties();
    s = setMoney(s, "B", 50);
    expect(() =>
      applyCommand(s, { type: "PROPOSE_SWAP", toId: "B", give: { props: [], money: 0 }, receive: { props: [], money: 100 } })
    ).toThrow("cannot afford");
  });

  it("sets pendingSwap on valid proposal", () => {
    const s = stateWithProperties();
    const { state: next } = applyCommand(s, {
      type: "PROPOSE_SWAP",
      toId: "B",
      give: { props: [1], money: 50 },
      receive: { props: [3], money: 0 },
    });
    expect(next.pendingSwap).not.toBeNull();
    expect(next.pendingSwap!.fromId).toBe("A");
    expect(next.pendingSwap!.toId).toBe("B");
    expect(next.pendingSwap!.give.props).toEqual([1]);
    expect(next.pendingSwap!.give.money).toBe(50);
    expect(next.pendingSwap!.receive.props).toEqual([3]);
  });

  it("does NOT change the phase or advance the turn", () => {
    const s = stateWithProperties();
    const { state: next } = applyCommand(s, {
      type: "PROPOSE_SWAP",
      toId: "B",
      give: { props: [], money: 0 },
      receive: { props: [], money: 0 },
    });
    expect(next.phase).toBe("awaiting-roll");
    expect(next.currentPlayerIndex).toBe(0); // still A's turn
  });

  it("emits swapProposed event", () => {
    const s = stateWithProperties();
    const { events } = applyCommand(s, {
      type: "PROPOSE_SWAP",
      toId: "B",
      give: { props: [1], money: 0 },
      receive: { props: [3], money: 0 },
    });
    const ev = events.find((e) => e.key === "swapProposed");
    expect(ev).toBeDefined();
    expect(ev!.params.from).toBe("Alice");
    expect(ev!.params.to).toBe("Bob");
  });
});

// ---------------------------------------------------------------------------
// RESPOND_SWAP - accept
// ---------------------------------------------------------------------------

describe("RESPOND_SWAP accept", () => {
  function proposedState(): GameState {
    let s = stateWithProperties();
    s = setMoney(s, "A", 500);
    s = setMoney(s, "B", 400);
    ({ state: s } = applyCommand(s, {
      type: "PROPOSE_SWAP",
      toId: "B",
      give: { props: [1], money: 100 },
      receive: { props: [3], money: 50 },
    }));
    return s;
  }

  it("transfers property ownership atomically", () => {
    const s = proposedState();
    const { state: next } = applyCommand(s, { type: "RESPOND_SWAP", accept: true });
    expect(next.ownership[1]).toBe("B"); // A's prop goes to B
    expect(next.ownership[3]).toBe("A"); // B's prop goes to A
  });

  it("transfers money correctly", () => {
    const s = proposedState();
    const { state: next } = applyCommand(s, { type: "RESPOND_SWAP", accept: true });
    const alice = next.players.find((p) => p.id === "A")!;
    const bob = next.players.find((p) => p.id === "B")!;
    // Alice gives 100, receives 50: net -50
    expect(alice.money).toBe(500 - 100 + 50);
    // Bob gives 50, receives 100: net +50
    expect(bob.money).toBe(400 - 50 + 100);
  });

  it("clears pendingSwap after accept", () => {
    const s = proposedState();
    const { state: next } = applyCommand(s, { type: "RESPOND_SWAP", accept: true });
    expect(next.pendingSwap).toBeNull();
  });

  it("does NOT advance the turn (proposer keeps their turn)", () => {
    const s = proposedState();
    const { state: next } = applyCommand(s, { type: "RESPOND_SWAP", accept: true });
    expect(next.currentPlayerIndex).toBe(0); // still A's turn
    expect(next.phase).toBe("awaiting-roll");
  });

  it("emits swapAccepted event", () => {
    const s = proposedState();
    const { events } = applyCommand(s, { type: "RESPOND_SWAP", accept: true });
    const ev = events.find((e) => e.key === "swapAccepted");
    expect(ev).toBeDefined();
    expect(ev!.params.from).toBe("Alice");
    expect(ev!.params.to).toBe("Bob");
  });
});

// ---------------------------------------------------------------------------
// RESPOND_SWAP - decline
// ---------------------------------------------------------------------------

describe("RESPOND_SWAP decline", () => {
  function proposedState(): GameState {
    let s = stateWithProperties();
    ({ state: s } = applyCommand(s, {
      type: "PROPOSE_SWAP",
      toId: "B",
      give: { props: [1], money: 0 },
      receive: { props: [3], money: 0 },
    }));
    return s;
  }

  it("clears pendingSwap on decline", () => {
    const s = proposedState();
    const { state: next } = applyCommand(s, { type: "RESPOND_SWAP", accept: false });
    expect(next.pendingSwap).toBeNull();
  });

  it("does not change ownership on decline", () => {
    const s = proposedState();
    const { state: next } = applyCommand(s, { type: "RESPOND_SWAP", accept: false });
    expect(next.ownership[1]).toBe("A");
    expect(next.ownership[3]).toBe("B");
  });

  it("emits swapDeclined event", () => {
    const s = proposedState();
    const { events } = applyCommand(s, { type: "RESPOND_SWAP", accept: false });
    const ev = events.find((e) => e.key === "swapDeclined");
    expect(ev).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Atomicity / rollback: accept that would bankrupt a leg is rejected
// ---------------------------------------------------------------------------

describe("RESPOND_SWAP atomicity", () => {
  it("rejects accept if proposer's money dropped below give.money since proposal", () => {
    let s = stateWithProperties();
    s = setMoney(s, "A", 200);
    s = setMoney(s, "B", 1000);
    // Propose giving 150 money
    ({ state: s } = applyCommand(s, {
      type: "PROPOSE_SWAP",
      toId: "B",
      give: { props: [], money: 150 },
      receive: { props: [], money: 0 },
    }));
    // Now drain A's money below 150 (simulate external deduction via structuredClone)
    const depleted = structuredClone(s);
    depleted.players.find((p) => p.id === "A")!.money = 50;
    // Accept should fail with swapFailed event, no money moved
    const { state: next, events } = applyCommand(depleted, { type: "RESPOND_SWAP", accept: true });
    expect(next.pendingSwap).toBeNull();
    const failEv = events.find((e) => e.key === "swapFailed");
    expect(failEv).toBeDefined();
    expect(failEv!.params.reason).toContain("proposer");
    // No money moved
    expect(next.players.find((p) => p.id === "A")!.money).toBe(50);
    expect(next.players.find((p) => p.id === "B")!.money).toBe(1000);
  });

  it("rejects accept if target's money dropped below receive.money since proposal", () => {
    let s = stateWithProperties();
    s = setMoney(s, "A", 1000);
    s = setMoney(s, "B", 200);
    // Propose requesting 150 from B
    ({ state: s } = applyCommand(s, {
      type: "PROPOSE_SWAP",
      toId: "B",
      give: { props: [], money: 0 },
      receive: { props: [], money: 150 },
    }));
    // Drain B's money below 150
    const depleted = structuredClone(s);
    depleted.players.find((p) => p.id === "B")!.money = 50;
    const { state: next, events } = applyCommand(depleted, { type: "RESPOND_SWAP", accept: true });
    expect(next.pendingSwap).toBeNull();
    const failEv = events.find((e) => e.key === "swapFailed");
    expect(failEv).toBeDefined();
    expect(failEv!.params.reason).toContain("target");
    // No money moved
    expect(next.players.find((p) => p.id === "B")!.money).toBe(50);
    expect(next.players.find((p) => p.id === "A")!.money).toBe(1000);
  });

  it("ensures no partial transfer: no props transferred if money check fails", () => {
    let s = stateWithProperties();
    s = setMoney(s, "A", 100);
    s = setMoney(s, "B", 100);
    ({ state: s } = applyCommand(s, {
      type: "PROPOSE_SWAP",
      toId: "B",
      give: { props: [1], money: 100 },
      receive: { props: [3], money: 0 },
    }));
    // Drain A so the money leg fails
    const depleted = structuredClone(s);
    depleted.players.find((p) => p.id === "A")!.money = 0;
    const { state: next } = applyCommand(depleted, { type: "RESPOND_SWAP", accept: true });
    // Property ownership should be unchanged
    expect(next.ownership[1]).toBe("A");
    expect(next.ownership[3]).toBe("B");
  });
});

// ---------------------------------------------------------------------------
// legalCommandsFor
// ---------------------------------------------------------------------------

describe("legalCommandsFor", () => {
  it("returns PROPOSE_SWAP for current player in awaiting-roll", () => {
    const s = stateWithProperties();
    expect(legalCommandsFor(s, "A")).toContain("PROPOSE_SWAP");
  });

  it("does not include PROPOSE_SWAP when a swap is already pending", () => {
    let s = stateWithProperties();
    ({ state: s } = applyCommand(s, {
      type: "PROPOSE_SWAP",
      toId: "B",
      give: { props: [], money: 0 },
      receive: { props: [], money: 0 },
    }));
    expect(legalCommandsFor(s, "A")).not.toContain("PROPOSE_SWAP");
  });

  it("returns RESPOND_SWAP for the swap target when swap is pending", () => {
    let s = stateWithProperties();
    ({ state: s } = applyCommand(s, {
      type: "PROPOSE_SWAP",
      toId: "B",
      give: { props: [], money: 0 },
      receive: { props: [], money: 0 },
    }));
    expect(legalCommandsFor(s, "B")).toContain("RESPOND_SWAP");
  });

  it("does not return RESPOND_SWAP for a non-target player", () => {
    let s = stateWithProperties();
    ({ state: s } = applyCommand(s, {
      type: "PROPOSE_SWAP",
      toId: "B",
      give: { props: [], money: 0 },
      receive: { props: [], money: 0 },
    }));
    // A is the proposer/current player, not the target
    expect(legalCommandsFor(s, "A")).not.toContain("RESPOND_SWAP");
  });

  it("returns empty for a non-current non-target player", () => {
    const s = stateWithProperties();
    // No pending swap, B is not current player
    expect(legalCommandsFor(s, "B")).toHaveLength(0);
  });

  it("legalCommands(state) includes PROPOSE_SWAP in awaiting-roll", () => {
    const s = stateWithProperties();
    expect(legalCommands(s)).toContain("PROPOSE_SWAP");
  });
});

// ---------------------------------------------------------------------------
// Out-of-turn server-level checks (simulated at engine level)
// ---------------------------------------------------------------------------

describe("RESPOND_SWAP out-of-turn", () => {
  it("allows target to respond even though it is not their turn", () => {
    let s = stateWithProperties();
    ({ state: s } = applyCommand(s, {
      type: "PROPOSE_SWAP",
      toId: "B",
      give: { props: [1], money: 0 },
      receive: { props: [3], money: 0 },
    }));
    // B is not the current player (A is), but engine allows RESPOND_SWAP via applyCommand
    // The server's applyHumanCommand handles the turn check; at engine level it works
    expect(() => applyCommand(s, { type: "RESPOND_SWAP", accept: false })).not.toThrow();
  });

  it("throws if no pendingSwap exists when responding", () => {
    const s = stateWithProperties();
    expect(() => applyCommand(s, { type: "RESPOND_SWAP", accept: true })).toThrow("No pending swap");
  });
});
