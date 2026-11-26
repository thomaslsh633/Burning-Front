# Map design: layers, linear obstacles, new maps

Status: **decided and implemented** (2026-11-26): candidate **B** (`src/logic/terrain`), layered map files (`data/maps`, compiled
by `npm run build:data`), destruction rules (§5), the two v214 maps converted. Open: garrison command (transport), production
buildings (economy), mines, smoke / craters from shells, CoH3 weapon modifiers against sandbags / wire / buildings (dropped by
the importer today), the map editor (stage G).
Rules it touches: SPEC §2 (maps), §3 (points, sectors), §5 (emplacements), §10 (edge cover, destruction).

## 1. Audit: is the map split into tiles and objects?

What D2 has now (`data/rules/terrain.json`, `GameState.map`):

```text
map = { cols, rows,
        terrain: { "c,r": { ground: "plains", object: "forest", elev: 1 } },   // one ground + at most one object per hex
        edges:   { "c,r,d": "stone_wall" } }                                  // one edge object per hex edge
```

| Check | Result |
| --- | --- |
| Ground (tile) separate from things on it | **Yes, in the rules**: `ground` sets the base move cost; an `object` replaces the cost and adds cover / sight / height; `edges` add a crossing cost and directional cover. |
| Objects are placed things, not tile types | **No.** `object` is a *type* (`forest_dense`), not an instance: it has no id, HP, owner or state, so a hedge cannot be crushed, a house cannot become ruins and a crater cannot appear (SPEC §10). |
| Buildings and structures | **Not separated.** `building` is a terrain object. Legacy buildings are multi-hex entities with HP, a team (HQ), garrison and production; bunkers and mines are separate lists. |
| Static map vs changes during a match | **Not separated.** `createMatch` copies the terrain into `GameState`, so destruction would have to edit the map itself. |
| Map content beyond terrain | **Missing**: capture points, sectors, deployment zones, HQ / rally points, pre-placed units, mines, mission objectives, theatre and briefing. |
| Text in map data | Legacy maps store Korean names and display codes per hex (`"name": "울창한 숲"`); the new format must hold only ids and i18n keys. |
| Schema, checks, tools | None for maps yet: no schema, no link check (unknown terrain ids, units, overlapping footprints), no converter for the two v214 maps. |

Conclusion: the rules separate ground from objects, but the map data does not yet separate **terrain** (what a hex is
made of) from **features** (placed things with identity and state). §3 proposes that split.

## 2. Linear obstacles (walls, hedges, fences, sandbags, wire)

### The two problems

1. **Visibility**: a thin line on a hex border is hard to see on a phone and hard to read as "cover on this side".
2. **Shape**: a wall can only follow hex borders, so a wall at 30° becomes a straight run or a zig-zag of 60° steps.

```text
 wanted (natural angle)        hex-edge version (zig-zag)
     ____                         /\  /\  /\
 ___/    \___                   _/  \/  \/  \_
```

### How other games do it

| Game | Model | What we can take |
| --- | --- | --- |
| **CoH3** | No grid. Walls, hedges and sandbags are freely placed meshes or splines with collision. Cover is decided per soldier: standing next to a cover object, on the side away from the shooter, gives green or yellow cover. Sight and shots are ray-cast against object heights. The UI shows cover as green / yellow / red markers when a squad is ordered to move. | Draw obstacles as free geometry, and decide cover by geometry *relative to the shooter*. Show cover only when it matters: while choosing where to move. |
| **XCOM / XCOM 2** | Square grid. Cover lives on **tile edges** (half / full); walls are art drawn along tile borders, and levels are built from rectilinear pieces, so diagonals rarely appear. The move preview shows **shield icons** (half / full) on the sides of the hovered tile. | The edge model is ours today. XCOM hides the zig-zag problem by designing the art around the grid. Its shield-icon preview fixes the visibility problem. |
| Hex wargames (Panzer Corps, Unity of Command) | Hedgerows and walls are a **hex terrain type** (bocage hex), not an edge. | Simple, but loses directional cover. We already decided on directional cover (SPEC §10). |
| Close Combat | Vector map over a coarse grid for movement; sight and cover from vector geometry. | Movement on the grid, sight and cover from vectors: the hybrid behind candidate B. |

### Candidates

**A. Keep hex-edge obstacles; improve the drawing (XCOM approach).**
- Logic is unchanged.
- Visibility improves through drawing:
  - thick three-tone strokes with a drop shadow on the protected side;
  - when a unit is selected, the edges near it are tinted green (heavy) or yellow (light);
  - the move preview shows shield icons on the hovered hex.
- Shape is still a problem. The renderer can draw a smooth curve through the edge midpoints, but the rules still follow the zig-zag: what you see and what applies differ by up to half a hex.
- Cost: small.

**B. Free polylines in the map, compiled to hex edges (recommended).**

The map stores each obstacle as a polyline at any angle. The build step derives the edge set with one rule:

> The edge between hexes P and Q carries the obstacle when the polyline crosses the segment from P's centre to Q's centre.

That is exactly "a unit stepping from P to Q climbs the wall" and "a shot passing from P into Q crosses the wall", so the
existing movement, sight and cover rules work unchanged on the derived edges. The player sees the natural line, and the
rules match what is drawn: the line is always between the two hex centres it separates.

```text
 polyline at ~30°            derived edges (rules)         drawn (player sees)
   P ● ─ ─ ● Q                P | Q  wall on P–Q              P   ╲ Q
        ╲                     edges whose centre-to-centre        ╲
   R ●    ╲ ● S               segment the line crosses       R      ╲ S
```

- Line ends that stop inside a hex count only for the centre segments they actually cross (a gate is a gap in the line).
- Destruction works per segment: a tank crushing a hedge removes the crossed segment, and its edges are derived again.
- Optional upgrade (B+): sight and cover use exact segment intersection with the polylines instead of the derived edges.
  On hex-centre lines the result is the same; it matters only if sight lines ever start off-centre.
- Cost: medium. It needs a map compiler (segment intersection, about 100 lines, testable), a polyline layer in the map
  schema, and a renderer that draws splines.

**C. Oriented obstacles inside a hex (CoH3 cover direction, hex-sized).**
- A wall becomes a hex object with an angle. It gives cover against shots coming from the side its normal faces, and it
  raises the move cost into that hex.
- Any angle is possible per hex, but a wall no longer blocks movement *between* hexes.
- Which side a unit is on is ambiguous: a unit standing in the wall's hex is on both sides.
- Long walls are many separate pieces.
- Cost: medium, and the rules get harder to read in previews.

**D. Full vector map (CoH3 / Close Combat).**
- Continuous geometry for sight, cover and collision; hexes only for counting movement.
- This gives the most natural result.
- But it is the heaviest option, and the hardest to preview clearly on a phone: two-tap previews need simple, certain
  answers.
- It also does not fit turn-based hex rules well.
- Cost: large.

**Recommendation: B, plus A's visibility measures.**
- Natural lines on the map, and rules that stay as simple as today.
- Previews stay exact, because they read the same derived edges.
- The visibility fixes (cover tint near the selected unit, shield icons in the move preview, three-tone strokes) apply
  whichever candidate is chosen. They belong to `presentation/render` and `presentation/ui`; logic already provides
  `coverAgainst(state, data, target, fromHex)` for every edge.

## 3. Map architecture and data structures

### Layers of a map

| Layer | What | Shape in the map file | Changes in a match? |
| --- | --- | --- | --- |
| `ground` | what a hex is made of (move cost, water) | rows of one-letter codes with a legend | no |
| `elevation` | height steps (ridges block sight) | rows of digits | no |
| `cover` | area cover on a hex: bush, forest (3 densities), crater, rubble, trench, rock | rows of codes with a legend (`.` = none) | yes (craters appear; forest burns later) |
| `lines` | walls, hedges, fences, sandbags, wire as polylines (§2 B) | `[{ id, kind, points: [[x, y], …] }]` in hex-space coordinates | yes (segments destroyed) |
| `structures` | placed things with identity: houses, church, HQ, bunker, bridge | `[{ id, kind, hexes: ["c,r", …], team?, garrison?, hp? }]` | yes (HP, ruins, owner) |
| `points` | victory, fuel and munition points; their zones and sectors | `[{ id, kind, hex, radius, sector }]` | yes (owner, progress) |
| `sectors` | supply areas (SPEC §3) | `[{ id, hexes or polygon }]`; adjacency is derived | no |
| `deploy` | deployment zones and rally points per side | `{ blue: { zone, rally }, red: { … } }` | no |
| `placements` | pre-placed units, abandoned vehicles, mines | `[{ team, sbps, hex, facing, stance, state? }]` | becomes units |
| `meta` | id, size, theatre (`north_africa` / `italy`), lighting, i18n keys for name and briefing | object | no |

Ground and cover rows stay readable and diff-friendly in git; 48 × 48 is 48 short lines per layer.

```json
{
  "meta": { "id": "salerno_1", "cols": 22, "rows": 14, "theatre": "italy", "name": "map.salerno_1.name", "briefing": "map.salerno_1.briefing" },
  "legend": { "ground": { ".": "plains", "=": "road", "~": "shallow_water", "W": "deep_water" },
              "cover":  { ".": null, "b": "bush", "f": "forest", "F": "forest_dense", "c": "crater", "t": "trench" } },
  "ground":    ["......==......", "…"],
  "elevation": ["00011100000000", "…"],
  "cover":     ["..bb....ff....", "…"],
  "lines":     [{ "id": "w1", "kind": "stone_wall", "points": [[3.2, 1.5], [6.8, 3.1], [9.0, 3.4]] }],
  "structures":[{ "id": "church", "kind": "church", "hexes": ["10,6", "11,6"], "garrison": 2 }],
  "points":    [{ "id": "vp_centre", "kind": "vp", "hex": "10,7", "radius": 2, "sector": "s3" }],
  "deploy":    { "blue": { "zone": "rows:0-2", "rally": "2,1" }, "red": { "zone": "rows:11-13", "rally": "19,12" } },
  "placements":[{ "team": "blue", "sbps": "at_gun_57mm_us", "hex": "5,4", "facing": 0, "stance": "EMPLACED" }]
}
```

### Static map vs match state

- **Map definition** (`data/maps/<id>/map.json`, hand-edited; text in `data/i18n`) →
  **`npm run build:data`** → **compiled map** (`data/generated/maps/<id>.json`).
- The compiled map is immutable game data (`data.maps[id]`):
  - per-hex records resolved from the legends;
  - edges derived from the lines;
  - zones expanded;
  - structure footprints checked.
- **Match state** holds only what changes: `GameState.map = { id, changes: { hexes: {}, lines: {}, structures: {} } }`
  (a crater added, a wall segment destroyed, a house in ruins).
  - Lookups read the compiled map first, then the changes.
  - Saves stay small.
  - Undo works as for everything else.

### Who owns what (proposed new system folder)

`src/logic/terrain/` (new, needs approval per CLAUDE.md):
- owns the map lookups that movement, vision and combat use today from `movement/terrain.js` and `vision/sight.js`:
  `hexAt`, `edgeBetween`, `elevation`, `coverOf`;
- owns the `changes` overlay, with commands or effects such as `damageLine`, `addCrater` and `ruinStructure`.

Movement keeps costs and paths, vision keeps sight lines and cover per shot; both read terrain only through
`logic/terrain`. Structures with HP and garrison become state owned by `logic/transport` (garrison) and
`logic/lifecycle` (HP, ruins), like units.

### Build-time checks for a map

- **Schema:** layer sizes match `cols × rows`; every legend code is known.
- **Words:** every terrain id is in `data/rules/terrain.json`; every unit is in the unit data.
- **Placement:** structures do not overlap each other, water or map edges; points and placements are on passable hexes;
  each side has a deployment zone and a rally point.
- **Lines:** every line kind is an edge kind in terrain.json; at least two points; inside the map.
- **Reports:** a map report (hex counts per terrain, derived edge count per line, sector graph) in `reports/maps/`.

### Tools and workflow

1. `tools/maps/import-legacy.js`: converts the two v214 maps (Skirmish 22 × 14, Faymonville 48 × 48) into the new format.
   The display text goes to i18n, and the forest density becomes the cover legend.
2. Hand-edit `map.json` for small maps.
3. Stage G (greybox): an art-free map view with an editor mode (paint ground / cover, draw lines, place structures),
   saving `map.json`. That is the practical way to draw natural wall lines.
4. Theatre presets: North Africa (desert, dunes, wadis as elevation, minefields, stone sangars as lines) and Italy
   (terraces as elevation steps, stone walls and hedges as lines, villages as structures).

## 4. Decisions (2026-11-26)

1. Linear obstacles: **B**, polylines compiled to hex edges, plus the visibility measures of A.
2. `src/logic/terrain/` owns map lookups, the line-to-edge geometry and the change overlay.
3. Map files: text-row layers plus lists, compiled by `npm run build:data`.

## 5. Destruction and wrecks (decided 2026-11-26)

| Feature | Examples | HP | HP bar | Destroyed by | When destroyed |
| --- | --- | --- | --- | --- | --- |
| Garrisonable building | houses, church, farm | hundreds to thousands, by size (`data/rules/terrain.json` structures) | on hover / select | explosives, fire, AT weapons | **collapses**: every garrisoned infantry man dies, garrisoned team weapons are destroyed; the footprint becomes rubble |
| Natural cover | fences, hedges, walls, debris | per kind | none by default | explosives, fire, AT weapons; fences and hedges also by vehicle crush | the segment / hex is gone (rubble walls leave light cover) |
| Defensive structure | sandbags, wire, tank traps, bunkers | **per faction from CoH3** (sandbags 300 / armour 25, wire 150 / 20, tank traps 400 / 50) | on select | explosives, fire, AT weapons, vehicle crush (not tank traps) | gone; a bunker leaves a wreck |
| Wreck | destroyed vehicles and emplacements | per kind | none | explosives, AT weapons | heavy cover (green shield) for infantry; blocks vehicles where the data says so |

HQ buildings stay indestructible (crippled state, SPEC §2). "AT weapons" are the weapon categories `anti_tank_gun`, `tank_gun`
and `infantry_anti_tank_weapon`; explosives and fire are the CoH3 damage types `explosive` and `flame`.
A shot or shell damages a feature when it crosses the feature's edge (lines) or lands on its hex (hex cover, buildings);
a vehicle crushes a crushable line segment it crosses.

Changes from the earlier documents: a building's garrison now dies when the building collapses (was: leaves damaged,
`docs/unit-state.md` §5.3), and wrecks are map objects in the change overlay instead of units in a `WRECKED` state.

## 6. Earlier decision list

1. Linear obstacles: **B** (recommended), A, C or D.
2. New system folder `src/logic/terrain/` for map lookups and the change overlay.
3. Map files as text-row layers plus lists, compiled at build time (as above).

After approval, the order is:
1. map schema and compiler (with tests);
2. legacy map import;
3. move the terrain lookups into `logic/terrain`;
4. then continue D2-7 (turn order, counter fire, overwatch, recrew).
