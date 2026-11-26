# src/services/assets/

**Layer 3 — Data / Service** — Asset resource management: fonts, images, baked sprites, sound files.

## Owns
- load, cache and release
- preload lists per screen
- embedded (base64) assets for the single-HTML build

## Public API (planned, exported from `index.js`)
- `createAssets(manifest)`
- `get(id)`
- `preload(ids) → Promise`

## May import
- `services/*` only (other systems through their `index.js`)
