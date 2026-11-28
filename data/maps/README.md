# data/maps/

The current maps (`skirmish`, `faymonville`) are converted from v214 for reference only; new maps are made from scratch.

One folder per map: `data/maps/<id>/map.json` (schema `data/schema/map.schema.json`, design `docs/map-design.md`).
`npm run build:data` checks and compiles every map into `data/generated/maps/<id>.json`; the game reads only the compiled map.

| Layer | Form | Notes |
| --- | --- | --- |
| `meta` | `{ id, cols, rows, theatre?, name, briefing? }` | `id` = folder name; `name` / `briefing` are i18n keys |
| `legend` | `{ ground: { code: id }, objects: { code: id \| null } }` | one character per hex in the row layers |
| `ground`, `objects` | rows of codes | ground ids and hex objects from `data/rules/terrain.json` |
| `elevation` | rows of digits | one step = `elevation_height` (data/balance/vision.json) |
| `bounds` | rows of `.` / `#` | `#` = scenery outside the play area (seen, never entered) |
| `hexes` | `{ "c,r": { ground?, object?, elev?, oob? } }` | single-hex overrides |
| `lines` | `[{ id, kind, points: [[x, row], …], team? }]` | walls, hedges, fences, sandbags, wire at any angle; a line takes the hex edge whose centre-to-centre segment it crosses. `x` is in hex columns (odd rows sit half a hex right), `row` in rows |
| `edges` | `{ "c,r,d": kind }` | a line on exactly one edge (d = 0 E, 1 SE, 2 SW) |
| `structures` | `[{ id, kind, hexes, team?, name? }]` | buildings (house_small … church, hq): HP by size, garrison, collapse |
| `production` | `[{ id, type, team, hexes, kind? }]` | tier buildings: `type` is the tier slot `t1`–`t3`, a branch with a letter (`t2a`, `t2b`; each faction's CoH3 building per slot in `data/rules/production.json`); also structures of `kind` production (T1–T2, default) or production_heavy (T3), so they block movement and can be destroyed. The HQ is a `structures` entry of kind `hq`. No doctrine buildings |
| `points` | `[{ id, kind: vp \| manpower \| munition \| fuel, hex, radius, sector?, name }]` | zones are the hexes within `radius` |
| `sectors` | `[{ id, hexes }]` | supply areas |
| `deploy` | `{ team: { zone: [hexes] \| { rows: [a, b] }, rally } }` | deployment zone and retreat point |
| `placements` | `[{ team, sbps, hex, facing?, stance? }]` | units at match start |
| `mines` | `[{ team, hex }]` | |

No display text in a map file: names live in `data/i18n` under `map.<id>.…`.
`skirmish` and `faymonville` were converted from v214 by `node tools/maps/import-legacy.js` (what was left out:
`reports/maps/legacy-import.md`).
