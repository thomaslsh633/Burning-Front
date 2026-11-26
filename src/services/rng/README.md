# src/services/rng/

**Layer 3 — Data / Service** — Seeded random numbers. Pure: state in, number and new state out.

## Owns
- the generator (state lives in GameState.rng)

## Public API (exported from `index.js`)
- `createRng(seed | { state })` → `{ next, int, chance, state }` — done (mulberry32; state is one integer)

## May import
- `services/*` only (other systems through their `index.js`)

## Must not
- use Math.random
