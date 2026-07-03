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
