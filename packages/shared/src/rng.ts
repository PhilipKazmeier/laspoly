/**
 * Deterministic, serializable RNG (mulberry32). State is a single uint32 so it
 * lives inside GameState and replays identically on server, bots and tests.
 */
export interface RngState {
  seed: number;
}

export function makeRng(seed: number): RngState {
  return { seed: seed >>> 0 };
}

/** Advance the rng in place, returning a float in [0, 1). */
export function nextFloat(rng: RngState): number {
  rng.seed = (rng.seed + 0x6d2b79f5) >>> 0;
  let t = rng.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Integer in [min, max] inclusive. */
export function nextInt(rng: RngState, min: number, max: number): number {
  return min + Math.floor(nextFloat(rng) * (max - min + 1));
}

export function rollDie(rng: RngState): number {
  return nextInt(rng, 1, 6);
}

/** Fisher-Yates shuffle in place using the rng. */
export function shuffle<T>(rng: RngState, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = nextInt(rng, 0, i);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}
