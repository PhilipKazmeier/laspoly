import { applyCommand, aliveCount, currentPlayer, createGame } from "./engine.js";
import { botDecide } from "./bot.js";
import type { GameState } from "./types.js";

export interface SimResult {
  winnerId: string | null;
  turns: number;
  finished: boolean;
  bankruptcies: number;
  /** turn on which the first player was eliminated, or null if none */
  firstEliminationTurn: number | null;
}

function assertInvariants(state: GameState, context: string): void {
  for (const p of state.players) {
    if (p.alive && p.money < 0) {
      throw new Error(`[${context}] Player ${p.id} has negative money: ${p.money}`);
    }
  }
  for (const posStr of Object.keys(state.ownership)) {
    const pos = Number(posStr);
    if (pos < 0 || pos > 39) {
      throw new Error(`[${context}] Invalid ownership position: ${pos}`);
    }
  }
  if (state.casinoPool < 0) {
    throw new Error(`[${context}] casinoPool is negative: ${state.casinoPool}`);
  }
  if (state.phase !== "finished") {
    const cp = state.players[state.currentPlayerIndex];
    if (!cp || !cp.alive) {
      throw new Error(`[${context}] currentPlayerIndex ${state.currentPlayerIndex} does not point to an alive player`);
    }
  }
}

export function simulateGame(
  boardId: string,
  seed: number,
  numPlayers: number,
  maxTurns: number,
): SimResult {
  const players = Array.from({ length: numPlayers }, (_, i) => ({
    id: `p${i}`,
    name: `Bot${i}`,
    isBot: true,
    color: `#${i}`,
  }));

  let state = createGame({ boardId, seed, players });
  const initialAlive = aliveCount(state);
  const maxCommands = maxTurns * numPlayers * 4; // safety cap
  let commandCount = 0;
  let firstEliminationTurn: number | null = null;

  while (state.phase !== "finished" && state.turn <= maxTurns && commandCount < maxCommands) {
    const cmd = state.phase === "turn-end"
      ? { type: "END_TURN" as const }
      : botDecide(state);
    const result = applyCommand(state, cmd);
    state = result.state;
    commandCount++;
    if (firstEliminationTurn === null && result.events.some((e) => e.key === "bankrupt")) {
      firstEliminationTurn = state.turn;
    }
    assertInvariants(state, `turn=${state.turn} cmd=${commandCount} lastCmd=${cmd.type}`);
  }

  return {
    winnerId: state.winnerId,
    turns: state.turn,
    finished: state.phase === "finished",
    bankruptcies: initialAlive - aliveCount(state) - (state.phase === "finished" ? 1 : 0),
    firstEliminationTurn,
  };
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1]! + sorted[mid]!) / 2)
    : sorted[mid]!;
}

function main(): void {
  const N = 200;
  const NUM_PLAYERS = 4;
  const MAX_TURNS = 2000;

  console.log(`Simulating ${N} games, ${NUM_PLAYERS} players, maxTurns=${MAX_TURNS}...`);

  const results: SimResult[] = [];
  for (let i = 0; i < N; i++) {
    results.push(simulateGame("vegas", i, NUM_PLAYERS, MAX_TURNS));
  }

  const finished = results.filter((r) => r.finished);
  const turnCounts = results.map((r) => r.turns);
  const finishedTurns = finished.map((r) => r.turns);
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const bankruptcyDist: Record<number, number> = {};
  for (const r of results) {
    bankruptcyDist[r.bankruptcies] = (bankruptcyDist[r.bankruptcies] ?? 0) + 1;
  }

  console.log(`Finished within maxTurns: ${finished.length}/${N} (${((finished.length / N) * 100).toFixed(1)}%)`);
  console.log(`Games with a winner: ${results.filter((r) => r.winnerId !== null).length}`);
  console.log(`All turns   — median: ${median(turnCounts)}, avg: ${avg(turnCounts).toFixed(1)}`);
  if (finishedTurns.length > 0) {
    console.log(`Finished    — median: ${median(finishedTurns)}, avg: ${avg(finishedTurns).toFixed(1)}`);
  }
  const finishedBankruptcyDist: Record<number, number> = {};
  for (const r of finished) {
    finishedBankruptcyDist[r.bankruptcies] = (finishedBankruptcyDist[r.bankruptcies] ?? 0) + 1;
  }
  console.log(`Bankruptcy distribution (all games):`, bankruptcyDist);
  console.log(`Bankruptcy distribution (finished games):`, finishedBankruptcyDist);

  // Balance: how soon does the first elimination happen? (early = pre-round-7)
  const firstElims = results
    .map((r) => r.firstEliminationTurn)
    .filter((t): t is number => t !== null);
  const EARLY_TURN = 28; // ~round 7 in a 4p game
  const earlyKnockouts = firstElims.filter((t) => t <= EARLY_TURN).length;
  if (firstElims.length > 0) {
    console.log(
      `First elimination turn — median: ${median(firstElims)}, avg: ${avg(firstElims).toFixed(1)}, min: ${Math.min(...firstElims)}`,
    );
    console.log(
      `Early knockouts (first elim by turn ${EARLY_TURN}): ${earlyKnockouts}/${results.length} (${((earlyKnockouts / results.length) * 100).toFixed(1)}%)`,
    );
  }
}

// Run main() when invoked directly
const isMain =
  typeof process !== "undefined" &&
  process.argv[1] !== undefined &&
  process.argv[1].endsWith("sim.ts");

if (isMain) {
  main();
}
