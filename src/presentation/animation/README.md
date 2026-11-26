# src/presentation/animation/

**Layer 1 — Input / Presentation** — Plays the events returned by logic as animations, in order.

## Owns
- event queue and player
- ViewModel: displayed position, hull / turret angle, displayed HP per unit (separate from GameState)
- one animation per event type: Turned, Moved, Fired, ShotHit, Ricochet, Damaged, ModelKilled, Exploded …
- reduceMotion (skip to the end, same result)

## Public API (planned, exported from `index.js`)
- `createAnimator(clock)`
- `play(events) → Promise`
- `isBusy()`
- `viewModel()`

## May import
- `presentation/*`, `logic/<system>/index.js`, `services/<system>/index.js`

## Must not
- read rule internals or recompute results (the event already carries the outcome)
