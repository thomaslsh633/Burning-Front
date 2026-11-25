# src/logic/state/

**Layer 2 — Game Logic** — The shape of GameState and pure read helpers (state management, data side).

## Owns
- unit runtime state shape `unit.js` with its invariants (`docs/unit-state.md` §4)
- GameState: { match, map, units, structures, points, teams: { blue, red }, turn, pending, rng }
- factories: createMatch(setup, data)
- selectors: unitAt, unitsOf, teamOf, isEngaged …

## Public API (planned, exported from `index.js`)
- `createMatch(setup, data, seed) → GameState`
- `selectors (pure functions of state)`

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- hold UI-only state (that is UiState in presentation/controller)
