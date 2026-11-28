# src/presentation/input/

**Layer 1 — Input / Presentation** — Turns raw pointer and keyboard events into intents.

## Owns
- the single pointer handler on the canvas
- gesture recognition: tap, long press, drag, pan, pinch
- keyboard shortcuts

## Public API (exported from `index.js`)
- `attach(canvas, toHex, onIntent)` — done for taps (`tapHex`); long press, drag, pan, pinch, keys follow (D3)
- `intents: tapHex(c, r) · longPressHex · dragFacing · pan · pinch · tapButton(id) · key(name)`

## May import
- `presentation/*`, `logic/<system>/index.js`, `services/<system>/index.js`

## Must not
- decide what an intent means (that is the controller)
- call any logic rule
