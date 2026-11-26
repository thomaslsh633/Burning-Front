# src/presentation/models/

**Layer 1 — Input / Presentation** — 3D vehicle and soldier meshes (TankBaker) used to bake unit sprites.

## Owns
- mesh definitions carried over from legacy/js/*17e_models-*
- sprite baking and sprite cache

## Public API (planned, exported from `index.js`)
- `bake(modelId, angle, options) → image`
- `modelIds()`

## May import
- `presentation/*`, `logic/<system>/index.js`, `services/<system>/index.js`

## Must not
- know unit stats or rules (model ids come from data/presentation)
