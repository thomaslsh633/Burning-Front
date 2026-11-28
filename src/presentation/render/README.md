# src/presentation/render/

**Layer 1 — Input / Presentation** — Draws GameState + UiState + the animation ViewModel onto the canvas.

## Owns
- the camera: quarter view, map turned 45°, seen from 35° above the ground (SPEC §9; same projection as the greybox)
- camera / projection, hex → screen
- passes: terrainPass (cached offscreen), overlayPass (move green / attack red / skill yellow / deploy blue), structurePass, unitPass (sprites, banners, HP bars, marks), fxPass
- frame composition order

## Public API (planned, exported from `index.js`)
- `createRenderer(canvas, assets)`
- `draw(state, ui, viewModel)`
- `invalidate(layer)`

## May import
- `presentation/*`, `logic/<system>/index.js`, `services/<system>/index.js`

## Must not
- change any state
- decide whether something is allowed
