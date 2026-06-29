# One-Build-Per-Turn Balance Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement "one building per turn" limit (Option A) — reverting the single-street build ban while adding a per-turn build cap — so games terminate reliably (≥90%) without early instant-knockouts (first-elim ≤ round 8 in <5% of games).

**Architecture:** Add `builtThisTurn: boolean` to `GameState`, set it to `true` on the first BUILD in a turn (engine rejects further BUILDs with a clear error), reset it to `false` when the turn advances in `continueOrAdvance`. Remove the `groupMembers(board, tile.group).length < 2` single-street ban from `canConstructHouse`, `canConstructHotel`, and `canConstructFactory`. Update `legalCommands` to stop offering BUILD once `builtThisTurn` is true. Update `canBuild` exported predicate accordingly. Adapt `bot.ts` to only issue one BUILD per turn (already only returns one command, but remove the mirrored single-street guard). Update and add tests. Run sim before and after to confirm metrics.

**Tech Stack:** TypeScript ESM strict, Vitest, tsx for sim runner, packages/shared only (engine.ts, bot.ts, sim.ts, types.ts, builds.test.ts, fixes.test.ts).

## Global Constraints

- Strict TypeScript ESM (`"type": "module"`, `import ... from "...js"`)
- All 436 existing tests must remain green
- Scope: `packages/shared/src/{engine.ts,bot.ts,sim.ts,types.ts}` and `packages/shared/src/{buildings.test.ts,fixes.test.ts}` ONLY
- Do NOT touch client, server, or board JSON files
- Do NOT run servers; run only `npm test` and `npm run sim`
- Deterministic: no new randomness sources
- Keep all exported function signatures stable/additive (new optional field in GameState is fine)

---

## Baseline BEFORE metrics (already measured)

```
Finished within maxTurns: 112/200 (56.0%)
All turns — median: 226.5, avg: 971.8
Finished  — median: 133, avg: 163.1
First elimination turn — median: 95, avg: 101.5, min: 26
Early knockouts (first elim by turn 28): 1/200 (0.5%)
```

---

### Task 1: Add `builtThisTurn` to GameState and reset it on turn advance

**Files:**
- Modify: `packages/shared/src/types.ts`
- Modify: `packages/shared/src/engine.ts` (createGame + continueOrAdvance only)

**Interfaces:**
- Produces: `GameState.builtThisTurn: boolean` — read by Tasks 2 and 3

- [ ] **Step 1: Add `builtThisTurn` to GameState interface in types.ts**

Open `packages/shared/src/types.ts`. In the `GameState` interface, add after `activeEvent`:

```typescript
  /** True once the current player has built one building this turn; reset on turn advance. */
  builtThisTurn: boolean;
```

- [ ] **Step 2: Initialize `builtThisTurn: false` in createGame**

In `packages/shared/src/engine.ts`, inside `createGame`, the returned object literal has `activeEvent: firstEvent`. Add `builtThisTurn: false` after it:

```typescript
    round: 1,
    activeEvent: firstEvent,
    builtThisTurn: false,
  };
```

- [ ] **Step 3: Reset `builtThisTurn` on turn advance in continueOrAdvance**

In `continueOrAdvance` (around line 789 in engine.ts), find the block that sets `state.doublesCount = 0; state.extraRoll = false;` before advancing the player index. Add the reset there:

```typescript
  state.doublesCount = 0;
  state.extraRoll = false;
  state.builtThisTurn = false;
  state.currentPlayerIndex = nextAliveIndex(state);
```

- [ ] **Step 4: Write failing test for the turn reset**

In `packages/shared/src/buildings.test.ts`, add a new `describe` block at the end of the file:

```typescript
// ---------------------------------------------------------------------------
// One-build-per-turn limit
// ---------------------------------------------------------------------------

describe("one-build-per-turn limit", () => {
  it("builtThisTurn starts false", () => {
    const s = stateWithMonopoly();
    expect(s.builtThisTurn).toBe(false);
  });

  it("second BUILD in same turn is rejected", () => {
    const s = stateWithMonopoly();
    const { state: s1 } = applyCommand(s, { type: "BUILD", pos: 13, building: "house" });
    expect(s1.builtThisTurn).toBe(true);
    // 14 is also part of mistyrose, building there is the 2nd build this turn
    expect(() => applyCommand(s1, { type: "BUILD", pos: 14, building: "house" })).toThrow(/one building per turn/);
  });

  it("BUILD is allowed again on next turn", () => {
    const s = stateWithMonopoly();
    const { state: s1 } = applyCommand(s, { type: "BUILD", pos: 13, building: "house" });
    expect(s1.builtThisTurn).toBe(true);
    // Advance turn: B rolls, then A's turn starts with builtThisTurn=false
    const { state: s2 } = applyCommand(s1, { type: "ROLL_DICE" }); // A rolls (s1 phase=awaiting-roll)
    // After A's roll, it's B's turn (builtThisTurn reset)
    // Find A's turn again (B has no money emergency)
    // After B's turn we need A to have builtThisTurn=false
    // We verify via the state field directly after turn advance
    expect(s2.builtThisTurn).toBe(false);
  });

  it("legalCommands does not include BUILD after builtThisTurn is true", () => {
    const s = stateWithMonopoly();
    const { state: s1 } = applyCommand(s, { type: "BUILD", pos: 13, building: "house" });
    expect(s1.builtThisTurn).toBe(true);
    expect(legalCommands(s1)).not.toContain("BUILD");
  });
});
```

- [ ] **Step 5: Run failing tests to confirm they fail correctly**

```bash
npm test -- --reporter=verbose 2>&1 | grep -A3 "one-build-per-turn"
```

Expected output: tests about `second BUILD` and `legalCommands` fail because the engine doesn't enforce the limit yet. The `builtThisTurn starts false` test may pass.

- [ ] **Step 6: Commit types + init + reset (no enforcement yet)**

```bash
git add packages/shared/src/types.ts packages/shared/src/engine.ts packages/shared/src/buildings.test.ts
git commit -m "feat: add builtThisTurn field to GameState, init + reset on turn advance"
```

---

### Task 2: Enforce one-build-per-turn in BUILD handler and legalCommands

**Files:**
- Modify: `packages/shared/src/engine.ts` (BUILD case in applyCommand + legalCommands)

**Interfaces:**
- Consumes: `GameState.builtThisTurn: boolean` (from Task 1)
- Produces: BUILD rejects 2nd build with "one building per turn" error; legalCommands omits BUILD when builtThisTurn

- [ ] **Step 1: Reject 2nd BUILD in the BUILD case of applyCommand**

In `applyCommand` under `case "BUILD":` (around line 908), after the ownership check and before the building logic, add:

```typescript
      if (state.builtThisTurn) throw new Error("one building per turn");
```

This goes right before `if (!state.buildings[pos]) state.buildings[pos] = ...`. After a successful build, set the flag at the end of the BUILD case (before the closing `break`):

```typescript
      state.builtThisTurn = true;
      // BUILD does not advance the turn
      break;
```

The exact insertion point: find the line `// BUILD does not advance the turn` and add `state.builtThisTurn = true;` just before it.

- [ ] **Step 2: Exclude BUILD from legalCommands when builtThisTurn is true**

In `legalCommands` (around line 274), in the loop that pushes "BUILD", add a guard at the top of that section:

```typescript
  // BUILD: only if player hasn't built yet this turn
  if (!state.builtThisTurn) {
    for (const [posStr, ownerId] of Object.entries(state.ownership)) {
      if (ownerId !== p.id) continue;
      // ... (existing loop body unchanged) ...
    }
  }
```

Wrap the entire `for (const [posStr, ownerId] of Object.entries(state.ownership))` loop (the one that pushes BUILD) inside `if (!state.builtThisTurn) { ... }`.

- [ ] **Step 3: Update canBuild exported predicate**

In `canBuild` (around line 1250), add a check at the top:

```typescript
export function canBuild(state: GameState, pos: number, kind: "house" | "hotel" | "factory"): boolean {
  if (state.builtThisTurn) return false;
  // ... rest unchanged ...
```

- [ ] **Step 4: Run tests — one-build-per-turn tests should now pass**

```bash
npm test 2>&1 | tail -15
```

Expected: All 436 + new tests pass. If any pre-existing tests that issued multiple BUILDs now fail, proceed to Task 3 to fix them.

- [ ] **Step 5: Commit enforcement**

```bash
git add packages/shared/src/engine.ts
git commit -m "feat: enforce one-build-per-turn limit in BUILD handler and legalCommands"
```

---

### Task 3: Remove single-street build ban from engine.ts and bot.ts

**Files:**
- Modify: `packages/shared/src/engine.ts` (canConstructHouse, canConstructHotel, canConstructFactory)
- Modify: `packages/shared/src/bot.ts` (canBuildHouseAt, canBuildHotelAt, botDecide)
- Modify: `packages/shared/src/fixes.test.ts` (update the single-street ban tests to instead test one-build-per-turn behavior for single streets)

**Interfaces:**
- Consumes: nothing new
- Produces: single-street groups can build (paced by one-build-per-turn)

- [ ] **Step 1: Remove the single-street guard from canConstructHouse in engine.ts**

Find and delete these lines in `canConstructHouse` (around lines 204-205):

```typescript
  // Balance: single-street colour groups may not be built on (the even-build rule
  // is vacuous with one street, letting a lone street reach a hotel by ~round 3).
  if (groupMembers(board, tile.group).length < 2) return false;
```

- [ ] **Step 2: Remove the single-street guard from canConstructHotel in engine.ts**

Find and delete these lines in `canConstructHotel` (around lines 225-226):

```typescript
  // Balance: no building on single-street colour groups (see canConstructHouse).
  if (groupMembers(board, tile.group).length < 2) return false;
```

- [ ] **Step 3: Remove the single-street guard from canConstructFactory in engine.ts**

Find and delete these lines in `canConstructFactory` (around lines 244-245):

```typescript
  // Balance: no building on single-street colour groups (see canConstructHouse).
  if (groupMembers(board, tile.group).length < 2) return false;
```

- [ ] **Step 4: Remove the single-street guard from canBuildHouseAt in bot.ts**

Find and delete this line in `canBuildHouseAt` (around line 48):

```typescript
  if (groupMembers(board, tile.group).length < 2) return false; // mirror engine: no build on single-street groups
```

- [ ] **Step 5: Remove the single-street guard from canBuildHotelAt in bot.ts**

Find and delete this line in `canBuildHotelAt` (around line 70):

```typescript
  if (groupMembers(board, tile.group).length < 2) return false; // mirror engine: no build on single-street groups
```

- [ ] **Step 6: Update the "Balance: single-street colour groups cannot be built on" tests in fixes.test.ts**

The current test suite in `fixes.test.ts` has a describe block titled `"Balance: single-street colour groups cannot be built on"` that asserts BUILD throws for single-street positions. Since we're reverting the ban, this section must be updated to instead verify:
  - Single-street groups CAN build now (house, factory)
  - The one-build-per-turn limit applies equally to single-street builds
  - Base rent still doubles on single-street monopoly

Replace the entire `describe("Balance: single-street colour groups cannot be built on", ...)` block (lines ~237-298) with:

```typescript
// ---------------------------------------------------------------------------
// Balancing: single-street groups can build (paced by one-build-per-turn)
// ---------------------------------------------------------------------------

describe("Balance: single-street colour groups can build (one-per-turn paced)", () => {
  // brown=1, violet=11, lightgreen=21, darkviolet=31 are single-street.
  const SINGLE = [1, 11, 21, 31];

  for (const pos of SINGLE) {
    it(`single-street pos ${pos} can build a house (one-per-turn pace)`, () => {
      const s = structuredClone(twoPlayers());
      s.players[0]!.money = 5000;
      s.ownership[pos] = "A";
      s.currentPlayerIndex = 0;
      s.phase = "awaiting-roll";
      // House build allowed now that single-street ban is removed
      const { state } = applyCommand(s, { type: "BUILD", pos, building: "house" });
      expect(state.buildings[pos]?.houses).toBe(1);
      expect(state.builtThisTurn).toBe(true);
    });

    it(`single-street pos ${pos}: second build same turn is rejected`, () => {
      const s = structuredClone(twoPlayers());
      s.players[0]!.money = 5000;
      s.ownership[pos] = "A";
      s.currentPlayerIndex = 0;
      s.phase = "awaiting-roll";
      // First house: allowed
      const { state: s1 } = applyCommand(s, { type: "BUILD", pos, building: "house" });
      expect(s1.buildings[pos]?.houses).toBe(1);
      // Second build same turn: rejected
      expect(() => applyCommand(s1, { type: "BUILD", pos, building: "house" })).toThrow(/one building per turn/);
    });

    it(`legalCommands offers BUILD for single-street pos ${pos} before first build`, () => {
      const s = structuredClone(twoPlayers());
      s.players[0]!.money = 5000;
      s.ownership[pos] = "A";
      s.currentPlayerIndex = 0;
      s.phase = "awaiting-roll";
      expect(legalCommands(s)).toContain("BUILD");
    });
  }

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
});
```

- [ ] **Step 7: Run all tests**

```bash
npm test 2>&1 | tail -15
```

Expected: All tests pass. If `buildings.test.ts` has tests that issue multiple BUILDs sequentially (without turn advance), they will fail — fix by inserting a turn advance between builds in those tests (see Step 8).

- [ ] **Step 8: Fix multi-BUILD test sequences in buildings.test.ts**

The `buildings.test.ts` tests build 4 houses on a group by calling `applyCommand` multiple times. These calls happen in `awaiting-roll` phase and will now fail after the first BUILD due to `builtThisTurn`.

The tests that build multiple houses are:
- "cannot build a 5th house" (builds 4+4 = 8 house commands)
- "can build a hotel when all streets in group have 4 houses" (builds 4+4+1 = 9 BUILD commands)
- "charges hotelCost when building a hotel" (same)
- "cannot build hotel without 4 houses on this street"
- "SELL_BUILDING: selling a hotel refunds..." (builds 4+4 houses first)
- "SELL_BUILDING: selling a house..." (builds 2+1 houses)
- "even-build: can build 2nd house on A after B gets 1" (builds 1+1+1 = 3)
- "cannot build on mortgaged property" — this only builds 2 (1 on each), safe
- "cannot build factory if another member has houses" — builds 1+1 then tries factory

For each of these, replace direct sequential `applyCommand(cur, BUILD...)` with a helper that also resets `builtThisTurn` between calls (simulating turn advances). Add a helper to the test file's helpers section:

```typescript
/** Force-reset builtThisTurn so tests can build multiple times without turn-advance overhead. */
function resetBuildFlag(s: GameState): GameState {
  const cloned = structuredClone(s);
  cloned.builtThisTurn = false;
  return cloned;
}
```

Then in each multi-BUILD loop, insert `cur = resetBuildFlag(cur)` before each BUILD after the first. Example for the 4-house loop:

```typescript
// Before (broken):
for (let i = 0; i < 4; i++) {
  ({ state: cur } = applyCommand(cur, { type: "BUILD", pos: 13, building: "house" }));
  ({ state: cur } = applyCommand(cur, { type: "BUILD", pos: 14, building: "house" }));
}

// After (fixed):
for (let i = 0; i < 4; i++) {
  ({ state: cur } = applyCommand(cur, { type: "BUILD", pos: 13, building: "house" }));
  cur = resetBuildFlag(cur);
  ({ state: cur } = applyCommand(cur, { type: "BUILD", pos: 14, building: "house" }));
  cur = resetBuildFlag(cur);
}
```

Apply this pattern to ALL multi-BUILD sequences in buildings.test.ts. Use `resetBuildFlag` rather than advancing turns to keep tests focused on building mechanics, not turn flow. The `resetBuildFlag` helper simulates "this is a new turn" without the full roll cycle.

Also update these two tests in buildings.test.ts:

"enforces even-build rule: cannot build 2nd house on A if B has 0":
```typescript
it("enforces even-build rule: cannot build 2nd house on A if B has 0", () => {
  const s = stateWithMonopoly();
  const { state: s1 } = applyCommand(s, { type: "BUILD", pos: 13, building: "house" });
  // Must reset builtThisTurn (new turn) before even-build test
  const s1r = resetBuildFlag(s1);
  // Now try to build another on 13 when 14 still has 0 - should fail (even rule: 14 has 0, 13 has 1)
  expect(() => applyCommand(s1r, { type: "BUILD", pos: 13, building: "house" })).toThrow();
});
```

"even-build: can build 2nd house on A after B gets 1":
```typescript
it("even-build: can build 2nd house on A after B gets 1", () => {
  const s = stateWithMonopoly();
  const { state: s1 } = applyCommand(s, { type: "BUILD", pos: 13, building: "house" }); // A: 1 house
  const { state: s2 } = applyCommand(resetBuildFlag(s1), { type: "BUILD", pos: 14, building: "house" }); // B: 1 house
  const { state: s3 } = applyCommand(resetBuildFlag(s2), { type: "BUILD", pos: 13, building: "house" }); // A: 2 houses
  expect(s3.buildings[13]?.houses).toBe(2);
  expect(s3.buildings[14]?.houses).toBe(1);
});
```

- [ ] **Step 9: Run all tests again and confirm green**

```bash
npm test 2>&1 | tail -10
```

Expected: "Tests  N passed (N)" with N ≥ 436.

- [ ] **Step 10: Commit single-street revert + test updates**

```bash
git add packages/shared/src/engine.ts packages/shared/src/bot.ts packages/shared/src/fixes.test.ts packages/shared/src/buildings.test.ts
git commit -m "feat: revert single-street build ban; pace via one-build-per-turn instead"
```

---

### Task 4: Adapt bot.ts build policy to one-per-turn

**Files:**
- Modify: `packages/shared/src/bot.ts`

**Interfaces:**
- Consumes: `GameState.builtThisTurn: boolean` (from Task 1)
- Produces: bot never issues BUILD when `builtThisTurn` is true

The bot's `botDecide` currently loops through all properties and returns the first BUILD it finds. Since the engine now rejects a 2nd BUILD (and legalCommands won't include BUILD after the first), the bot already only issues one BUILD per call. However, the bot should also check `state.builtThisTurn` before entering the BUILD loop to avoid internal logic inconsistencies.

- [ ] **Step 1: Add builtThisTurn guard to botDecide BUILD section**

In `botDecide`, find the BUILD block (around line 147):

```typescript
  // --- BUILD: only build when we'll still have >= DANGER_THRESHOLD after spending ---
  if (legal.includes("BUILD")) {
```

This is already guarded by `legal.includes("BUILD")`, which returns false when `builtThisTurn` is true (since we updated `legalCommands`). So the bot is already correct by construction.

Verify by reading the `legalCommands` function output: once `builtThisTurn` is true, BUILD is never in `legal`, so the bot can never issue a second BUILD even if we add single-street properties.

- [ ] **Step 2: Verify bot handles single-street groups correctly**

The bot's `canBuildHouseAt` and `canBuildHotelAt` helpers in bot.ts no longer have the single-street guard (removed in Task 3). They now correctly validate single-street builds the same as multi-street builds (even-build rule is trivially satisfied for a single-street group, so a bot with a single-street monopoly will build immediately). This is the desired behavior.

No code change needed — just confirm the bot logic is consistent. Run:

```bash
npm test 2>&1 | tail -5
```

Expected: All tests pass.

- [ ] **Step 3: Commit (no-op if no changes, or tiny comment update)**

If no code changes were needed in bot.ts, skip the commit. If you added a comment for clarity:

```bash
git add packages/shared/src/bot.ts
git commit -m "chore: verify bot BUILD policy correct under one-build-per-turn"
```

---

### Task 5: Measure AFTER metrics and verify improvement

**Files:**
- Read only: `packages/shared/src/sim.ts` (no changes needed unless metrics are outside targets)

**Targets:**
- Termination ≥ 90% of games finish within maxTurns
- Median game length: 25–120 turns (not 5, not 200+)  
- Early knockouts (first elim by turn 28): <5% of games
- Snowball: bankruptcy distribution should not be degenerate

- [ ] **Step 1: Run the simulator**

```bash
npm run sim 2>&1
```

Record all output lines. Compare to BEFORE:

```
BEFORE:
Finished within maxTurns: 112/200 (56.0%)
All turns — median: 226.5, avg: 971.8
Finished  — median: 133, avg: 163.1
First elimination turn — median: 95, avg: 101.5, min: 26
Early knockouts (first elim by turn 28): 1/200 (0.5%)
```

Expected AFTER (Option A prediction):
- Finished: ≥ 180/200 (90%+)
- Median turns: 40–100
- Early knockouts: <5% (target: <1%)

- [ ] **Step 2: Evaluate results**

If termination ≥ 90% AND early-KO <5%: Option A succeeded. Go to Step 3.

If termination <90% but early-KO <5%: try adjusting `DANGER_THRESHOLD` in bot.ts slightly downward (from 200 to 150) to make bots more aggressive buyers — the key lever for termination is property ownership and rent collection. Re-run sim.

If early-KO ≥ 5%: the one-per-turn limit alone isn't enough pacing. Consider adding Option C fallback (cap single-street at 2 houses, no hotel) and re-measure.

- [ ] **Step 3: Confirm full test suite still passes**

```bash
npm test 2>&1 | tail -5
```

Expected: "Tests  N passed (N)".

- [ ] **Step 4: Commit sim verification note**

No code change to sim.ts required unless metrics forced a knob adjustment. If you adjusted `DANGER_THRESHOLD`:

```bash
git add packages/shared/src/bot.ts
git commit -m "tune: lower bot DANGER_THRESHOLD to improve termination rate"
```

---

### Task 6: Final verification — full test suite and build

- [ ] **Step 1: Run complete test suite**

```bash
npm test 2>&1
```

Expected final output: `Tests  N passed (N)` with zero failures. Record N.

- [ ] **Step 2: Verify client still compiles**

```bash
npm run build -w @laspoly/client 2>&1 | tail -20
```

Expected: exits 0 with no TypeScript errors.

- [ ] **Step 3: Final commit if anything uncommitted**

```bash
git status
```

If clean, done. If any uncommitted changes:

```bash
git add -p  # review each hunk
git commit -m "fix: balance - one-build-per-turn replaces single-street ban"
```

- [ ] **Step 4: Report final metrics**

Collect and report:
- BEFORE: `56% finish, median 226.5 turns, early-KO 0.5%`
- AFTER: (numbers from Task 5 Step 1)
- Test count: N passed
- Option chosen: A (one-build-per-turn + revert single-street ban)
- Why: removes the multi-build-per-turn rush that let a player go 0→hotel in round 3, while restoring building as a termination driver

---

## Self-Review Checklist

**Spec coverage:**
- [x] Option A (one-build-per-turn) implemented
- [x] Single-street ban reverted
- [x] `builtThisTurn` tracked in GameState, reset on turn advance
- [x] BUILD handler rejects 2nd build with clear error
- [x] `legalCommands` omits BUILD after first build
- [x] `canBuild` predicate updated
- [x] bot.ts adapted (guard via legalCommands)
- [x] Tests updated: single-street tests replaced with one-per-turn tests
- [x] Multi-BUILD test sequences fixed with `resetBuildFlag`
- [x] Sim run BEFORE and AFTER with metrics quoted
- [x] Client build verified

**Placeholder scan:** None — all code blocks are complete.

**Type consistency:**
- `state.builtThisTurn` (boolean) used consistently in engine.ts, types.ts, and tests
- Error message `"one building per turn"` consistent between engine.ts throw and test `.toThrow(/one building per turn/)`
- `resetBuildFlag(s: GameState): GameState` used only in buildings.test.ts, not exported
