# src/logic/crew/

**Layer 2 — Game Logic** — Crew weapons: pack, emplace, arcs, crew turning.

## Owns
- packed / emplacing / emplaced status
- firing arc of emplaced weapons
- auto-emplace at end of turn

## Public API (planned, exported from `index.js`)
- `emplace`
- `pack`
- `canFire`
- `arcOf`

## May import
- `logic/*` only (other systems through their `index.js`)
