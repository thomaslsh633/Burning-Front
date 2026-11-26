// Seeded random numbers (mulberry32). The whole generator state is one 32-bit integer, so it fits in GameState.rng and
// a saved game replays the same rolls. Never Math.random.

/** A seed string or number → a 32-bit start state (FNV-1a for strings). */
export function seedState(seed) {
  if (typeof seed === 'number') return seed >>> 0;
  let h = 0x811c9dc5;
  for (const ch of String(seed)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/**
 * createRng(seed) or createRng({ state }) to resume.
 * next() → [0, 1); int(n) → 0 … n−1; chance(p) → true with probability p; state() → the integer to store.
 */
export function createRng(seed = 0) {
  let s = typeof seed === 'object' && seed !== null ? seed.state >>> 0 : seedState(seed);
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: n => Math.floor(next() * n),
    chance: p => next() < p,
    state: () => s,
  };
}
