# data/base/

**Generated** by the CoH3 importer (`node tools/import-coh3/import.js <faction> [squad …]`). **Never edit these files**:
the next import rewrites the whole faction folder. Put changes in `data/units/<faction>/` (overrides) or in a mod (`mods/`).

```text
data/base/<faction>/
  <squad id>/      everything only this unit uses: sbps.json, ebps.json (its members), weapon.json, upgrade.json (its kits),
                   veterancy.json, fx.json; abilities join later
  shared/          records two or more units use (e.g. the crew carbine of the AT gun, mortar and HMG teams)
```

Inside each file, records are grouped by category (`{ "<category>": { "<id>": record } }`). The folder is for people:
the build merges by id, so a record moving between a unit folder and `shared/` (when a second unit starts using it)
changes nothing in the game. Conversion rules (fire rate, indirect fire, scale) are not stored per unit: they live in
`tools/import-coh3/` with their settings in `data/balance/`, and the game rules in `src/logic/`.
