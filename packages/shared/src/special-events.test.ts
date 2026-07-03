import { describe, it, expect } from 'vitest';
import { createGame, applyCommand } from './engine.js';
import { nextInt } from './rng.js';
import { getBoard } from './board.js';
import type { GameState } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function twoPlayers(seed = 0): GameState {
  return createGame({
    boardId: 'vegas',
    seed,
    players: [
      { id: 'A', name: 'Alice', isBot: true, color: 'red' },
      { id: 'B', name: 'Bob', isBot: true, color: 'blue' },
    ],
  });
}

/** Force the given event id (1 round) as the only active event on a cloned state. */
function withEvent(state: GameState, id: import('./types.js').EventId): GameState {
  const s = structuredClone(state);
  s.activeEvents = [{ id, remainingRounds: 1 }];
  return s;
}

/**
 * Apply ROLL_DICE / END_TURN (and DECLINE_PROPERTY if needed) until the turn
 * has advanced n times from the starting player. Returns the final state.
 */
function advanceTurns(initial: GameState, n: number): GameState {
  let s = initial;
  let advanced = 0;
  let guard = 0;
  while (advanced < n && guard++ < 2000) {
    if (s.phase === 'finished') break;
    if (s.phase === 'awaiting-buy') {
      ({ state: s } = applyCommand(s, { type: 'DECLINE_PROPERTY' }));
    } else if (s.phase === 'awaiting-casino') {
      ({ state: s } = applyCommand(s, { type: 'ROLL_CASINO' }));
    } else if (s.phase === 'turn-end') {
      const prevTurn = s.turn;
      ({ state: s } = applyCommand(s, { type: 'END_TURN' }));
      if (s.turn > prevTurn) advanced++;
    } else {
      ({ state: s } = applyCommand(s, { type: 'ROLL_DICE' }));
    }
  }
  return s;
}

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('specialEvents: determinism', () => {
  it('same seed produces same first event', () => {
    const s1 = twoPlayers(42);
    const s2 = twoPlayers(42);
    expect(s1.activeEvents).toEqual(s2.activeEvents);
  });

  it('different seeds can produce different events', () => {
    // Run a few seeds and collect event ids — at least two should differ
    const ids = new Set(Array.from({ length: 20 }, (_, i) => twoPlayers(i).activeEvents[0]?.id));
    expect(ids.size).toBeGreaterThan(1);
  });

  it('first event drawn from EVENT_IDS range', () => {
    const valid = new Set(['circus', 'boom', 'recession', 'jackpot', 'buildingSale', 'quietDay']);
    for (let seed = 0; seed < 30; seed++) {
      const id = twoPlayers(seed).activeEvents[0]?.id;
      expect(valid.has(id ?? '')).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Round boundary
// ---------------------------------------------------------------------------

describe('specialEvents: round boundary', () => {
  it('starts at round 1', () => {
    expect(twoPlayers(0).round).toBe(1);
  });

  it('round increments when index wraps', () => {
    // With 2 players, advancing 2 turns means A plays then B plays, so index
    // wraps at least once and round must be > 1.
    const s = advanceTurns(twoPlayers(0), 2);
    expect(s.round).toBeGreaterThan(1);
  });

  it('an event is active after a round boundary (default frequency)', () => {
    const s = advanceTurns(twoPlayers(0), 2);
    expect(s.round).toBeGreaterThan(1);
    expect(s.activeEvents.length).toBeGreaterThan(0);
  });

  it('round event announcement is emitted at boundary', () => {
    // Advance exactly 2 turns and collect events from the END_TURN that wraps the round
    let s = twoPlayers(0);
    let roundEvents: string[] = [];
    let turnCount = 0;
    let guard = 0;
    while (turnCount < 2 && guard++ < 2000) {
      if (s.phase === 'finished') break;
      if (s.phase === 'awaiting-buy') {
        ({ state: s } = applyCommand(s, { type: 'DECLINE_PROPERTY' }));
      } else if (s.phase === 'turn-end') {
        const prevTurn = s.turn;
        let evs: { key: string }[];
        ({ state: s, events: evs } = applyCommand(s, { type: 'END_TURN' }));
        if (s.turn > prevTurn) {
          turnCount++;
          if (turnCount === 2) {
            roundEvents = evs.map(e => e.key);
          }
        }
      } else {
        ({ state: s } = applyCommand(s, { type: 'ROLL_DICE' }));
      }
    }
    // The event log from the 2nd turn-advance (END_TURN) should contain a specialEvent_* key
    const hasSpecialEvent = roundEvents.some(k => k.startsWith('specialEvent_'));
    expect(hasSpecialEvent).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Modifier: circus — attraction rent ×2
// ---------------------------------------------------------------------------

describe('specialEvents: circus', () => {
  it('doubles attraction rent when circus is active', () => {
    const board = getBoard('vegas');
    const attractionTile = board.tiles.find(t => t.type === 'attraction');
    if (!attractionTile) return; // skip if board has no attractions

    const attractionPos = attractionTile.pos;

    // Use seed=0, peek at the first roll's dice sum, then place A so that
    // the roll lands them exactly on the attraction tile.
    const tmp0 = twoPlayers(0);
    const rng0 = { seed: tmp0.rng.seed };
    const d1 = nextInt(rng0, 1, 6);
    const d2 = nextInt(rng0, 1, 6);
    const sum = d1 + d2;
    const startPos = ((attractionPos - sum) % 40 + 40) % 40;

    let base = twoPlayers(0);
    base = structuredClone(base);
    base.ownership[attractionPos] = 'B';
    base.players[0]!.position = startPos;
    base.currentPlayerIndex = 0;
    base.phase = 'awaiting-roll';

    const noCircus = withEvent(base, 'quietDay');
    const withCircus = withEvent(base, 'circus');

    const { events: ev1 } = applyCommand(noCircus, { type: 'ROLL_DICE' });
    const { events: ev2 } = applyCommand(withCircus, { type: 'ROLL_DICE' });

    const r1 = ev1.find(e => e.key === 'rentPaid');
    const r2 = ev2.find(e => e.key === 'rentPaid');

    expect(r1).toBeDefined();
    expect(r2).toBeDefined();
    if (r1 && r2) {
      expect(r2.params.amount).toBe((r1.params.amount as number) * 2);
    }
  });
});

// ---------------------------------------------------------------------------
// Modifier: recession — street rent halved
// ---------------------------------------------------------------------------

describe('specialEvents: recession', () => {
  it('halves street rent when recession is active', () => {
    const board = getBoard('vegas');
    const streetTile = board.tiles.find(t => t.type === 'street');
    if (!streetTile) return;
    const streetPos = streetTile.pos;

    // Use seed=0, peek at the first roll's dice sum, then place A so that
    // sum lands them exactly on streetPos.
    const tmp0 = twoPlayers(0);
    const rng0 = { seed: tmp0.rng.seed };
    const d1 = nextInt(rng0, 1, 6);
    const d2 = nextInt(rng0, 1, 6);
    const sum = d1 + d2;
    const startPos = ((streetPos - sum) % 40 + 40) % 40;

    let base = twoPlayers(0);
    base = structuredClone(base);
    base.ownership[streetPos] = 'B';
    base.players[0]!.position = startPos;
    base.currentPlayerIndex = 0;
    base.phase = 'awaiting-roll';

    const noRec = withEvent(base, 'quietDay');
    const withRec = withEvent(base, 'recession');

    const { events: ev1 } = applyCommand(noRec, { type: 'ROLL_DICE' });
    const { events: ev2 } = applyCommand(withRec, { type: 'ROLL_DICE' });

    const r1 = ev1.find(e => e.key === 'rentPaid');
    const r2 = ev2.find(e => e.key === 'rentPaid');

    expect(r1).toBeDefined();
    expect(r2).toBeDefined();
    if (r1 && r2) {
      // recession halves rent (floor)
      expect(r2.params.amount).toBe(Math.floor((r1.params.amount as number) / 2));
    }
  });
});

// ---------------------------------------------------------------------------
// Modifier: boom — GO payout doubled
// ---------------------------------------------------------------------------

describe('specialEvents: boom', () => {
  it('doubles GO pass money when boom is active', () => {
    // Place player A near end of board so they wrap GO on next roll.
    // Position 38: any roll of 2+ wraps. Roll of 2 lands on pos 0 (goLanded),
    // roll of 3+ lands past 0 (goPassed).
    let base = twoPlayers(0);
    base = structuredClone(base);
    base.players[0]!.position = 38; // any roll of 2+ wraps
    base.currentPlayerIndex = 0;
    base.phase = 'awaiting-roll';

    const noBoom = withEvent(base, 'quietDay');
    const withBoom = withEvent(base, 'boom');

    const { events: ev1 } = applyCommand(noBoom, { type: 'ROLL_DICE' });
    const { events: ev2 } = applyCommand(withBoom, { type: 'ROLL_DICE' });

    const go1 = ev1.find(e => e.key === 'goPassed' || e.key === 'goLanded');
    const go2 = ev2.find(e => e.key === 'goPassed' || e.key === 'goLanded');

    // Position 38 with minimum dice sum 2 always wraps, so both must produce a GO event
    expect(go1).toBeDefined();
    expect(go2).toBeDefined();
    if (go1 && go2) {
      expect(go2.params.amount).toBe((go1.params.amount as number) * 2);
    }
  });
});

// ---------------------------------------------------------------------------
// Modifier: buildingSale — build cost halved
// ---------------------------------------------------------------------------

describe('specialEvents: buildingSale', () => {
  it('halves house cost when buildingSale is active', () => {
    const board = getBoard('vegas');
    // Find a street that belongs to a group where we can give player A the whole group
    const streets = board.tiles.filter(t => t.type === 'street');
    const groupCounts: Record<string, number> = {};
    for (const t of streets) {
      const g = (t as { group: string }).group;
      groupCounts[g] = (groupCounts[g] ?? 0) + 1;
    }
    // Pick a group with exactly 2 streets (easiest to own all)
    const twoStreetGroup = Object.entries(groupCounts).find(([, c]) => c === 2)?.[0];
    if (!twoStreetGroup) return; // skip if no 2-street group

    const groupStreets = streets.filter(t => (t as { group: string }).group === twoStreetGroup);
    const groupPos = groupStreets.map(t => t.pos);

    let base = twoPlayers(0);
    base = structuredClone(base);
    // Give player A both streets in the group
    for (const pos of groupPos) {
      base.ownership[pos] = 'A';
    }
    base.currentPlayerIndex = 0;
    base.phase = 'awaiting-roll';
    base.players[0]!.money = 99999; // ensure can afford

    const noSale = withEvent(base, 'quietDay');
    const withSale = withEvent(base, 'buildingSale');

    const pos0 = groupPos[0]!;

    const { state: s1, events: ev1 } = applyCommand(noSale, {
      type: 'BUILD',
      pos: pos0,
      building: 'house',
    });
    const { state: s2, events: ev2 } = applyCommand(withSale, {
      type: 'BUILD',
      pos: pos0,
      building: 'house',
    });

    const built1 = ev1.find(e => e.key === 'built');
    const built2 = ev2.find(e => e.key === 'built');

    expect(built1).toBeDefined();
    expect(built2).toBeDefined();
    expect(built2!.params.amount).toBe(Math.floor((built1!.params.amount as number) / 2));

    // Money deducted should also be halved
    const spent1 = base.players[0]!.money - s1.players[0]!.money;
    const spent2 = base.players[0]!.money - s2.players[0]!.money;
    expect(spent2).toBe(Math.floor(spent1 / 2));
  });
});

// ---------------------------------------------------------------------------
// Modifier: jackpot — casino payout ×1.5
// ---------------------------------------------------------------------------

describe('specialEvents: jackpot', () => {
  it('increases casino payout by 50% when jackpot is active', () => {
    const board = getBoard('vegas');
    const casinoPos = board.tiles.findIndex(t => t.type === 'casino');
    if (casinoPos < 0) return;

    // Fix 5: casino now rolls FRESH dice after landing. We need a seed where:
    //   1. Movement roll lands player on casinoPos (any sum is fine)
    //   2. The subsequent 2 RNG draws (casino dice) are doubles → casino win.
    // RNG order: firstEvent(1 draw), move_d1, move_d2, casino_d1, casino_d2.
    // Pre-computed: seed=60 moves 2+2=4 from pos 16 → casino, then casino=4+4 (doubles, not 6).
    // startPos = 16, seed = 60.
    const doubleSeed = 60;
    const moveSum = 4; // 2+2
    const startPos = ((casinoPos - moveSum) % 40 + 40) % 40; // 20-4=16

    let base = twoPlayers(doubleSeed);
    base = structuredClone(base);
    base.casinoPool = 400; // known pool for predictable math
    base.players[0]!.position = startPos;
    base.currentPlayerIndex = 0;
    base.phase = 'awaiting-roll';

    const noJackpot = withEvent(base, 'quietDay');
    const withJackpot = withEvent(base, 'jackpot');

    // Land on the casino (awaiting-casino), then roll the casino dice (bug 2-8).
    const r1 = applyCommand(noJackpot, { type: 'ROLL_DICE' });
    const r2 = applyCommand(withJackpot, { type: 'ROLL_DICE' });
    const { events: ev1 } = applyCommand(r1.state, { type: 'ROLL_CASINO' });
    const { events: ev2 } = applyCommand(r2.state, { type: 'ROLL_CASINO' });

    const win1 = ev1.find(e => e.key === 'casinoWin');
    const win2 = ev2.find(e => e.key === 'casinoWin');

    expect(win1).toBeDefined();
    expect(win2).toBeDefined();
    if (win1 && win2) {
      // jackpot: share * 1.5 (floored), capped at pool
      const expected = Math.min(Math.floor((win1.params.amount as number) * 1.5), 400);
      expect(win2.params.amount).toBe(expected);
    }
  });
});

// ---------------------------------------------------------------------------
// Event frequency setting + multi-round durations
// ---------------------------------------------------------------------------

function twoPlayersWithFreq(freq: "off" | "rare" | "normal" | "chaos", seed = 0): GameState {
  return createGame({
    boardId: 'vegas',
    seed,
    players: [
      { id: 'A', name: 'Alice', isBot: true, color: 'red' },
      { id: 'B', name: 'Bob', isBot: true, color: 'blue' },
    ],
    settings: { eventFrequency: freq },
  });
}

describe('specialEvents: frequency setting', () => {
  it('"off" never populates activeEvents', () => {
    let s = twoPlayersWithFreq('off');
    expect(s.activeEvents).toEqual([]);
    s = advanceTurns(s, 8);
    expect(s.activeEvents).toEqual([]);
  });

  it('"rare" starts empty and draws only sometimes over many rounds', () => {
    let drewSomewhere = false;
    let emptyStart = true;
    for (let seed = 0; seed < 5; seed++) {
      let s = twoPlayersWithFreq('rare', seed);
      if (s.activeEvents.length !== 0) emptyStart = false;
      s = advanceTurns(s, 20);
      if (s.activeEvents.length > 0) drewSomewhere = true;
    }
    expect(emptyStart).toBe(true);
    expect(drewSomewhere).toBe(true);
  });

  it('"chaos" never yields quietDay', () => {
    for (let seed = 0; seed < 12; seed++) {
      let s = twoPlayersWithFreq('chaos', seed);
      expect(s.activeEvents[0]?.id).not.toBe('quietDay');
      s = advanceTurns(s, 6);
      for (const e of s.activeEvents) expect(e.id).not.toBe('quietDay');
    }
  });

  it('default frequency is "normal" and matches historical behaviour', () => {
    const def = twoPlayers(7);
    const normal = twoPlayersWithFreq('normal', 7);
    expect(def.eventFrequency).toBe('normal');
    expect(def.activeEvents).toEqual(normal.activeEvents);
  });
});

describe('specialEvents: multi-round durations', () => {
  it('a forced 2-round event survives exactly one boundary', () => {
    // Frequency "off" so no new draws interfere with the forced event.
    let s = twoPlayersWithFreq('off');
    s = structuredClone(s);
    s.activeEvents = [{ id: 'recession', remainingRounds: 2 }];

    const startRound = s.round;
    // Cross exactly one round boundary.
    let guard = 0;
    while (s.round === startRound && guard++ < 200) {
      s = advanceTurns(s, 1);
    }
    expect(s.round).toBe(startRound + 1);
    expect(s.activeEvents).toEqual([{ id: 'recession', remainingRounds: 1 }]);

    // Cross the next boundary — now it expires.
    const midRound = s.round;
    guard = 0;
    while (s.round === midRound && guard++ < 200) {
      s = advanceTurns(s, 1);
    }
    expect(s.activeEvents).toEqual([]);
  });

  it('hasEvent-driven modifier applies while a multi-round event is active', () => {
    // recession halves street rent — force it with 3 rounds and verify the
    // effect persists after one boundary.
    let s = twoPlayersWithFreq('off');
    s = structuredClone(s);
    s.activeEvents = [{ id: 'buildingSale', remainingRounds: 3 }];
    s.ownership[13] = 'A';
    s.ownership[14] = 'A';
    s.players[0]!.money = 5000;

    const board = getBoard('vegas');
    const tile13 = board.tiles[13]!;
    if (tile13.type !== 'street') throw new Error('test setup: 13 must be a street');
    const full = Math.round(tile13.houseCost * s.buildingCostMult);
    const { state: s1, events } = applyCommand(s, { type: 'BUILD', pos: 13, building: 'house' });
    const built = events.find((e) => e.key === 'built');
    expect(built).toBeDefined();
    // buildingSale halves the cost.
    expect(Number(built!.params['amount'])).toBe(Math.round(Math.floor(tile13.houseCost / 2) * s1.buildingCostMult));
    expect(Number(built!.params['amount'])).toBeLessThan(full);
  });
});

// ---------------------------------------------------------------------------
// Chaos events v2: instant one-shots + multi-round modifiers
// ---------------------------------------------------------------------------

import type { GameEvent } from './types.js';

/** Chaos-frequency 2-player game. */
function chaosGame(seed = 0): GameState {
  return createGame({
    boardId: 'vegas',
    seed,
    players: [
      { id: 'A', name: 'Alice', isBot: true, color: 'red' },
      { id: 'B', name: 'Bob', isBot: true, color: 'blue' },
    ],
    settings: { eventFrequency: 'chaos' },
  });
}

/**
 * Force a specific event to be drawn at the next round boundary by searching
 * RNG seeds (deterministic given the mulberry32 implementation). `base` must
 * be at turn-end with the LAST player current so END_TURN wraps the round.
 */
function forceBoundaryEvent(base: GameState, wanted: string): { state: GameState; events: GameEvent[] } {
  for (let seed = 0; seed < 20000; seed++) {
    const s = structuredClone(base);
    s.rng.seed = seed >>> 0;
    const res = applyCommand(s, { type: 'END_TURN' });
    if (res.events.some((e) => e.key === `specialEvent_${wanted}`)) return res;
  }
  throw new Error(`no seed found that draws ${wanted}`);
}

/** Chaos game parked at turn-end of the LAST player (so END_TURN wraps a round). */
function atBoundary(mutate?: (s: GameState) => void): GameState {
  const s = structuredClone(chaosGame());
  s.phase = 'turn-end';
  s.currentPlayerIndex = 1; // last of two → wrap on advance
  s.activeEvents = [];      // isolate from the initial draw
  if (mutate) mutate(s);
  return s;
}

describe('chaos events: instant one-shots', () => {
  it('earthquake removes one house from each player’s most-built street + repair fee', () => {
    const base = atBoundary((s) => {
      s.ownership[13] = 'A';
      s.ownership[14] = 'A';
      s.buildings[13] = { houses: 3, hotel: false, factory: false };
      s.buildings[14] = { houses: 1, hotel: false, factory: false };
      s.players[0]!.money = 1000;
      s.players[1]!.money = 800; // B owns nothing → spared
    });
    const { state: s1, events } = forceBoundaryEvent(base, 'earthquake');
    expect(s1.buildings[13]!.houses).toBe(2); // most-built street hit
    expect(s1.buildings[14]!.houses).toBe(1); // other street untouched
    expect(s1.players[0]!.money).toBe(950);   // flat 50 repair fee
    expect(s1.players[1]!.money).toBe(800);   // no houses, no damage
    expect(events.some((e) => e.key === 'earthquakeDamage' && e.playerId === 'A')).toBe(true);
    expect(events.some((e) => e.key === 'earthquakeDamage' && e.playerId === 'B')).toBe(false);
  });

  it('tax audit: richest-by-cash player pays 10% into the casino pool', () => {
    const base = atBoundary((s) => {
      s.players[0]!.money = 1000;
      s.players[1]!.money = 400;
      s.casinoPool = 100;
    });
    const { state: s1, events } = forceBoundaryEvent(base, 'taxAudit');
    expect(s1.players[0]!.money).toBe(900);
    expect(s1.players[1]!.money).toBe(400);
    expect(s1.casinoPool).toBe(200);
    const ev = events.find((e) => e.key === 'taxAuditPaid');
    expect(ev?.playerId).toBe('A');
    expect(ev?.params['amount']).toBe(100);
  });

  it('lottery: a player wins a quarter of the pool; pool never overdraws', () => {
    const base = atBoundary((s) => {
      s.players[0]!.money = 500;
      s.players[1]!.money = 500;
      s.casinoPool = 400;
    });
    const { state: s1, events } = forceBoundaryEvent(base, 'lottery');
    expect(s1.casinoPool).toBe(300);
    const totalBefore = 1000;
    const totalAfter = s1.players[0]!.money + s1.players[1]!.money;
    expect(totalAfter).toBe(totalBefore + 100);
    expect(events.some((e) => e.key === 'lotteryWin')).toBe(true);
  });

  it('windfall credits every alive player', () => {
    const base = atBoundary((s) => {
      s.players[0]!.money = 500;
      s.players[1]!.money = 700;
    });
    const { state: s1, events } = forceBoundaryEvent(base, 'windfall');
    expect(s1.players[0]!.money).toBe(600);
    expect(s1.players[1]!.money).toBe(800);
    expect(events.some((e) => e.key === 'windfallCollect')).toBe(true);
  });

  it('instant events are never stored in activeEvents', () => {
    const base = atBoundary();
    const { state: s1 } = forceBoundaryEvent(base, 'windfall');
    expect(s1.activeEvents.every((e) => e.id !== 'windfall')).toBe(true);
  });

  it('an earthquake fee that bankrupts the incoming player still yields a playable state', () => {
    const base = atBoundary((s) => {
      // A (the incoming player after wrap) has houses but only 10 LPD — the
      // 50 LPD repair fee bankrupts them; B must end up as winner.
      s.ownership[13] = 'A';
      s.ownership[14] = 'A';
      s.buildings[13] = { houses: 2, hotel: false, factory: false };
      s.players[0]!.money = 10;
      s.players[1]!.money = 800;
    });
    const { state: s1, events } = forceBoundaryEvent(base, 'earthquake');
    expect(s1.players[0]!.alive).toBe(false);
    expect(events.some((e) => e.key === 'bankrupt' && e.playerId === 'A')).toBe(true);
    // Two players → the survivor wins immediately.
    expect(s1.phase).toBe('finished');
    expect(s1.winnerId).toBe('B');
  });
});

describe('chaos events: multi-round modifiers', () => {
  it('street party doubles rent only for its group and lasts 2 rounds', () => {
    const board = getBoard('vegas');
    const tile13 = board.tiles[13]!;
    if (tile13.type !== 'street') throw new Error('expected street at 13');

    // Land A on 13 via the peek-the-roll trick.
    const tmp0 = twoPlayers(0);
    const rng0 = { seed: tmp0.rng.seed };
    const d1 = nextInt(rng0, 1, 6);
    const d2 = nextInt(rng0, 1, 6);
    const startPos = ((13 - (d1 + d2)) % 40 + 40) % 40;

    let base = structuredClone(twoPlayers(0));
    base.ownership[13] = 'B';
    base.players[0]!.position = startPos;
    base.currentPlayerIndex = 0;
    base.phase = 'awaiting-roll';

    const noParty = withEvent(base, 'quietDay');
    const withParty = structuredClone(base);
    withParty.activeEvents = [{ id: 'streetParty', remainingRounds: 2, group: tile13.group }];
    const otherParty = structuredClone(base);
    otherParty.activeEvents = [{ id: 'streetParty', remainingRounds: 2, group: '__other__' }];

    const r0 = applyCommand(noParty, { type: 'ROLL_DICE' }).events.find((e) => e.key === 'rentPaid');
    const r1 = applyCommand(withParty, { type: 'ROLL_DICE' }).events.find((e) => e.key === 'rentPaid');
    const r2 = applyCommand(otherParty, { type: 'ROLL_DICE' }).events.find((e) => e.key === 'rentPaid');
    expect(r1!.params['amount']).toBe((r0!.params['amount'] as number) * 2);
    expect(r2!.params['amount']).toBe(r0!.params['amount']); // other group unaffected
  });

  it('street party drawn at a boundary carries a group and 2 rounds', () => {
    const { state: s1 } = forceBoundaryEvent(atBoundary(), 'streetParty');
    const party = s1.activeEvents.find((e) => e.id === 'streetParty');
    expect(party).toBeDefined();
    expect(party!.remainingRounds).toBe(2);
    expect(typeof party!.group).toBe('string');
  });

  it('power outage: stations charge no rent', () => {
    const board = getBoard('vegas');
    const stationPos = board.tiles.find((t) => t.type === 'station')!.pos;
    const tmp0 = twoPlayers(0);
    const rng0 = { seed: tmp0.rng.seed };
    const d1 = nextInt(rng0, 1, 6);
    const d2 = nextInt(rng0, 1, 6);
    const startPos = ((stationPos - (d1 + d2)) % 40 + 40) % 40;

    let base = structuredClone(twoPlayers(0));
    base.ownership[stationPos] = 'B';
    base.players[0]!.position = startPos;
    base.currentPlayerIndex = 0;
    base.phase = 'awaiting-roll';

    const normal = withEvent(base, 'quietDay');
    const outage = structuredClone(base);
    outage.activeEvents = [{ id: 'powerOutage', remainingRounds: 1 }];

    const rNormal = applyCommand(normal, { type: 'ROLL_DICE' }).events.find((e) => e.key === 'rentPaid');
    const rOutage = applyCommand(outage, { type: 'ROLL_DICE' }).events.find((e) => e.key === 'rentPaid');
    expect((rNormal!.params['amount'] as number)).toBeGreaterThan(0);
    expect(rOutage!.params['amount']).toBe(0);
  });

  it('market crash halves SELL_PROPERTY proceeds', () => {
    const board = getBoard('vegas');
    let base = structuredClone(twoPlayers(0));
    base.ownership[13] = 'A';
    base.phase = 'turn-end';
    base.currentPlayerIndex = 0;

    const normalRefund = applyCommand(withEvent(base, 'quietDay'), { type: 'SELL_PROPERTY', pos: 13 })
      .events.find((e) => e.key === 'soldProperty')!.params['amount'] as number;

    const crashed = structuredClone(base);
    crashed.activeEvents = [{ id: 'marketCrash', remainingRounds: 2 }];
    const crashRefund = applyCommand(crashed, { type: 'SELL_PROPERTY', pos: 13 })
      .events.find((e) => e.key === 'soldProperty')!.params['amount'] as number;

    expect(crashRefund).toBe(Math.floor(normalRefund / 2));
    void board;
  });

  it('gold rush doubles factory landing revenue', () => {
    const board = getBoard('vegas');
    const streetPos = board.tiles.find((t) => t.type === 'street')!.pos;
    const tmp0 = twoPlayers(0);
    const rng0 = { seed: tmp0.rng.seed };
    const d1 = nextInt(rng0, 1, 6);
    const d2 = nextInt(rng0, 1, 6);
    const startPos = ((streetPos - (d1 + d2)) % 40 + 40) % 40;

    let base = structuredClone(twoPlayers(0));
    base.ownership[streetPos] = 'A'; // own factory → collect on landing
    base.buildings[streetPos] = { houses: 0, hotel: false, factory: true };
    base.players[0]!.position = startPos;
    base.currentPlayerIndex = 0;
    base.phase = 'awaiting-roll';

    const normal = applyCommand(withEvent(base, 'quietDay'), { type: 'ROLL_DICE' })
      .events.find((e) => e.key === 'factoryRevenue')!.params['amount'] as number;

    const rush = structuredClone(base);
    rush.activeEvents = [{ id: 'goldRush', remainingRounds: 2 }];
    const rushed = applyCommand(rush, { type: 'ROLL_DICE' })
      .events.find((e) => e.key === 'factoryRevenue')!.params['amount'] as number;

    expect(rushed).toBe(normal * 2);
  });
});

describe('chaos events: stability', () => {
  it('same seed + chaos produces identical event sequences', () => {
    const run = (seed: number) => {
      let s = chaosGame(seed);
      const seen: string[] = [];
      let guard = 0;
      let advanced = 0;
      while (advanced < 12 && guard++ < 3000) {
        if (s.phase === 'finished') break;
        if (s.phase === 'awaiting-buy') {
          ({ state: s } = applyCommand(s, { type: 'DECLINE_PROPERTY' }));
        } else if (s.phase === 'awaiting-casino') {
          ({ state: s } = applyCommand(s, { type: 'ROLL_CASINO' }));
        } else if (s.phase === 'turn-end') {
          const res = applyCommand(s, { type: 'END_TURN' });
          s = res.state;
          for (const e of res.events) if (e.key.startsWith('specialEvent_')) seen.push(e.key);
          advanced++;
        } else {
          ({ state: s } = applyCommand(s, { type: 'ROLL_DICE' }));
        }
      }
      return seen;
    };
    expect(run(5)).toEqual(run(5));
  });

  it('a chaos game stays playable across many rounds (no crash, round advances)', () => {
    const s = advanceTurns(chaosGame(2), 30);
    expect(s.round).toBeGreaterThan(3);
  });
});
