# src/logic/build/

**Layer 2 — Game Logic** — Construction.

## Owns
- who may build what, where, at what price (the map change itself is `logic/terrain`'s)
- rebuilding a destroyed HQ on its footprint (one HQ per side at a time) — done
- footprints and overlap, build range, site HP and build progress of new structures — later

Engineer construction of new structures waits for the build-menu entities (stage G import) and runtime-placed lines /
structures in `logic/terrain`.

## Public API (exported from `index.js`)
- `rebuildOf`, `validateRebuild`, `rebuildCost` (route `Rebuild`: pay, `terrain.rebuildStructure`, the action) — done
- `canBuild`, `placeStructure`, `buildProgress` — planned

## May import
- `logic/*` only (other systems through their `index.js`)
