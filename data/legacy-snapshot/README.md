# data/legacy-snapshot/

Final values of the legacy v214 game, read from a headless run after all its load-time patches.
A **gameplay reference** only: the rewrite takes its data from CoH3 (`data/source/coh3`). Comparisons with these files
report differences for review; they are not targets.

| File | Contents |
| --- | --- |
| `units.json` | `UNIT_ROSTER`, categories, CoH3 raw tables (`COH3_RAW`, `COH3_IND`, `COH3_COST`), kits, squad sizes, v199 / v200 / v214 rule tables |
| `spawned-units.json` | every roster unit as `createUnitFromKey` builds it (weapons, squad, kits applied), keyed `blue/<key>`, `red/<key>` |
| `rules.json` | terrain, ground, objects, edges, cover ranks, tech, buildings, fortifications, upgrades, income, zones, suppression and penetration constants |
| `veterancy.json` | thresholds, tables, multipliers |
| `doctrines.json` | doctrines, packages, battle-group abilities |
| `maps/skirmish.json`, `maps/faymonville.json` | size, terrain, edges, points, buildings, bunkers, mines, starting units |
| `meta.json` | legacy version, table list, anything missing, page errors |

Regenerate: `node tools/oracle/snapshot.js` (needs Playwright + Chromium). Never edit by hand.
Team `blue` = US Forces, `red` = Wehrmacht in v214.
