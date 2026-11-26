# src/presentation/ui/

**Layer 1 — Input / Presentation** — DOM panels and screens. Each component renders (state, ui, data, i18n) and emits intents.

## Owns
- HUD: resource bar, unit card, attack / counter preview, skill tray, turn tray, VP meter, battle log
- menus: production, build, research, doctrine
- screens: lobby, setup, briefing, turn curtain, AAR, settings
- theme tokens (CSS variables)

## Public API (planned, exported from `index.js`)
- `mount(root, { onIntent })`
- `update(state, ui, data, i18n)`

## May import
- `presentation/*`, `logic/<system>/index.js`, `services/<system>/index.js`

## Must not
- call logic commands directly (buttons emit tapButton intents)
- hold game state of its own
