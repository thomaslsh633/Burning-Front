# src/services/data/

**Layer 3 — Data / Service** — Game data resource management: loads, validates and indexes the generated data.

## Owns
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
