# src/logic/build/

**Layer 2 — Game Logic** — Construction.

## Owns
- who may build what, where, at what price (the map change itself is `logic/terrain`'s)
- rebuilding a destroyed HQ on its footprint (one HQ per side at a time) — done
- building the unit-structures on a squad's build menu (fighting positions, bunkers, emplacements): where, price, site HP,
  `timers.build` (work turns left) — done; walls, wire, mines and multi-hex footprints — later

Walls, wire and mines wait for runtime-placed lines / objects in `logic/terrain`.

## Public API (exported from `index.js`)
- `rebuildOf`, `validateRebuild`, `rebuildCost` (route `Rebuild`: pay, `terrain.rebuildStructure`, the action) — done
- `buildable`, `validateBuild`, `startSite`, `work`, `isBuilt`, `siteMembers` (route `Build`) — done

## May import
- `logic/*` only (other systems through their `index.js`)
