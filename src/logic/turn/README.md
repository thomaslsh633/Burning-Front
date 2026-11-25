# src/logic/turn/

**Layer 2 — Game Logic** — Turn flow and the action budget of a unit.

## Owns
- turn phases in SPEC order: strikes → status → capture → victory → income
- per-unit action budget (move points, attack, counter); the AP model would replace this one module

## Public API (planned, exported from `index.js`)
- `endTurn(state, data, rng) → { state, events }`
- `startTurn`
- `actionsLeft(unit)`

## May import
- `logic/*` only (other systems through their `index.js`)
