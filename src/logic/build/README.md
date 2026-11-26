# src/logic/build/

**Layer 2 — Game Logic** — Engineer construction.

## Owns
- footprints and overlap
- build range
- site HP and build progress

Not started: the CoH3 build menus name entities that are not imported yet, and runtime-placed lines / structures need
`logic/terrain` support (D2-8 left this for stage G).

## Public API (planned, exported from `index.js`)
- `canBuild`
- `placeStructure`
- `buildProgress`

## May import
- `logic/*` only (other systems through their `index.js`)
