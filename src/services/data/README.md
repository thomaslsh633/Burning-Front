# src/services/data/

**Layer 3 — Data / Service** — Game data resource management: loads, validates and indexes the generated data.

## Owns
- the data layers: generated base → designer overrides → mods, merged by id (`merge.js`: `deepMerge`, `mergeKind`, `UNIT_KINDS`); the build step `tools/build-data.js` uses the same function
- loading data/generated/*.json
- schema validation (data/schema)
- lookups by id: unit, entity, weapon, upgrade, ability, terrain, map

## Public API (planned, exported from `index.js`)
- `loadData(source) → GameData (frozen)`
- `GameData.unit(id) …`

## May import
- `services/*` only (other systems through their `index.js`)

## Must not
- patch data at load time (values are final when generated)

Done: `mergeKind`, `combineFiles`, `deepMerge` (layers), `indexUnits(generated)` → flat maps by id for the rules (`data.units.sbps[id]` …);
`gameFiles()`, `assembleGameData(files, maps)` → the GameData shape the rules read (the browser fetches the files, tools read them).
