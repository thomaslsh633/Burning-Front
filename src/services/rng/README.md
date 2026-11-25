# src/services/rng/

**Layer 3 — Data / Service** — Seeded random numbers. Pure: state in, number and new state out.

## Owns
- the generator (state lives in GameState.rng)

## Public API (planned, exported from `index.js`)
- `createRng(seed)`
- `rng.next() → [0, 1)`
- `rng.int(n)`
- `rng.state()`

## May import
- `services/*` only (other systems through their `index.js`)

## Must not
- use Math.random
