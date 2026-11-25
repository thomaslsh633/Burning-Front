# src/services/save/

**Layer 3 — Data / Service** — Save and load.

## Owns
- save schema with a version number
- migration of older saves
- autosave slots, legacy `coh1944.*` keys

## Public API (planned, exported from `index.js`)
- `serialize(state) → string`
- `deserialize(string) → state`
- `migrate(old) → current`

## May import
- `services/*` only (other systems through their `index.js`)

## Must not
- touch localStorage directly (services/storage does that)
