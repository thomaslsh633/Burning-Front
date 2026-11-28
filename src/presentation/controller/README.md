# src/presentation/controller/

**Layer 1 — Input / Presentation** — Gives intents a meaning: owns UiState and the UI mode machine, sends commands to the store.

## Owns
- UiState: selection, mode, preview, camera target, open panel
- modes: idle → unitSelected → movePreview / attackPreview / skillTargeting / deployPlacement / buildPlacement / turnStage (one file per mode)
- UI rules from SPEC §8: two-tap confirm, tap elsewhere cancels, turn tray, long-press range view

## Public API (exported from `index.js`)
- `createController({ store, data, onUiChange })` → `{ ui(), onIntent(intent) }` — done for the greybox: select, two-tap
  move and attack, buttons end / emplace / pack / hold / retreat; one file per mode follows with the real screen (D3)

## May import
- `presentation/*`, `logic/<system>/index.js`, `services/<system>/index.js`

## Must not
- change GameState except through store.dispatch(command)
- compute a rule result itself (ask logic: canAttack, previewAttack, reachable …)
