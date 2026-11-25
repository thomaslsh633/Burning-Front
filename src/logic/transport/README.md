# src/logic/transport/

**Layer 2 — Game Logic** — Boarding, dismount, airborne deploy.

## Owns
- capacity
- passengers
- unload hexes

## Public API (planned, exported from `index.js`)
- `canBoard`
- `board`
- `dismount`
- `paradrop`

## May import
- `logic/*` only (other systems through their `index.js`)
