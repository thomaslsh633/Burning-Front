# src/logic/fsm/

**Layer 2 — Game Logic** — The generic state-machine helper every unit axis uses (`docs/unit-state.md` §3).

## Owns
- `defineMachine(axis, initial, states)`: a frozen machine of state handlers (allows / denies, enter, exit, onTurnStart, onTurnEnd, onStep, on)
- `transition`, `send`: pure state changes returning `{ unit, events }`
- `permits(machines, unit, command)`: command validity as the intersection of all axes, with the vetoing axis and reason

## Public API (planned, exported from `index.js`)
- `defineMachine(axis, initial, states)`
- `transition(machine, unit, to, ctx) → { unit, events }`
- `send(machine, unit, eventName, ctx) → { unit, events }`
- `permits(machines, unit, commandType) → { ok } | { ok: false, axis, reason }`

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- know any concrete state or rule (the axes live in their owning systems)
