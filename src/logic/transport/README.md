# src/logic/transport/

**Layer 2 — Game Logic** — Garrisons and transports: going inside, riding, getting out.

## Owns
- location FSM (ON_MAP, GARRISONED, LOADED) (`docs/unit-state.md` §5.3), `container`
- capacity (squad slots: squad 1, carried heavy weapon team 2), what a container accepts
- exit hexes, passengers of a destroyed transport (`stranded`, `survivors`)

## Public API (`index.js`)
- `LOCATION`, `slotsOf`, `containerOf`, `passengers`
- `validateEnter` / `enter` (Garrison, Board), `validateExit` / `exitHex` / `leave` (Exit), `validateUnload`
- `stranded`, `survivors`

## Must not
- set positions (movement `place`, the route calls it) or kill units (lifecycle).
- Airborne deploy: not built.

## May import
- `logic/*` only (other systems through their `index.js`)
