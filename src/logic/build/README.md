# src/logic/build/

**Layer 2 — Game Logic** — Engineer construction.

## Owns
- footprints and overlap
- build range
- site HP and build progress

## Public API (planned, exported from `index.js`)
- `canBuild`
- `placeStructure`
- `buildProgress`

## May import
- `logic/*` only (other systems through their `index.js`)
