# src/logic/turn/

**Layer 2 — Game Logic** — Turn flow and the action budget of a unit.

## Owns
- action FSM (IDLE, MOVING, ATTACKING, OVERWATCH, EXHAUSTED), budgets, overwatch eligibility: machine guns only (`docs/unit-state.md` §5.1)
- turn phases in SPEC order: strikes → status → capture → victory → income
- per-unit action budget (move points, attack, counter); the AP model would replace this one module

## Public API (planned, exported from `index.js`)
- `endTurn(state, data, rng) → { state, events }`
- `startTurn`
- `actionsLeft(unit)`

## May import
- `logic/*` only (other systems through their `index.js`)
