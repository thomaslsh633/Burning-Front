# src/presentation/audio/

**Layer 1 — Input / Presentation** — Plays sound for events and UI actions.

## Owns
- event → sound cue table (from data/presentation)
- volume, mute, channel limits

## Public API (planned, exported from `index.js`)
- `createAudio(assets, settings)`
- `onEvents(events)`
- `ui(cue)`

## May import
- `presentation/*`, `logic/<system>/index.js`, `services/<system>/index.js`

## Must not
- load files itself (services/assets does that)
- change any state
