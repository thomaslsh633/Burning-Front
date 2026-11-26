# src/logic/terrain/

**Layer 2 — Game Logic** — The map: what each hex and hex edge is made of, and how that changes in a match
(`docs/map-design.md`).

## Owns
- map geometry: hex centres, polyline lines → hex edges (a line takes the edge between two hexes when it crosses the
  segment joining their centres)
- the map compiler `compileMap(def, rules)` (pure; used by `tools/build-data.js` and tests)
- map lookups for every other system: `hexAt`, `edgeAt`, `elevation`, `structureAt`
- the match's change overlay `GameState.map.changes`: feature HP, destroyed line segments, collapsed buildings, craters, wrecks
- feature durability: who may damage what (explosives, fire, AT weapons, crush), destruction and what it leaves

## Public API (exported from `index.js`)
- `hexCentre`, `segmentsCross`, `lineEdges` — geometry
- `compileMap(def, rules) → { map, errors }`
- `mapOf`, `hexAt`, `edgeAt`, `elevation`, `structureAt`
- `canDamage`, `damageHex`, `damageEdge`, `damageStructure`, `crushEdge`, `placeWreck`, `clearWreck` (one turn of work; gone after the wreck's `clear_turns`)

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- know units' rules (movement costs, sight lines and cover per shot stay in movement and vision; deaths of a collapsed
  building's garrison are lifecycle's: terrain reports who was inside)
