# src/logic/events/

**Layer 2 — Game Logic** — The event catalog: every fact logic can report.

## Owns
- event type names and payload shapes (Moved, Turned, Fired, ShotHit, PenetrationFailed, Damaged, Suppressed, ModelKilled, UnitDestroyed, PointCaptured, IncomeReceived, TurnStarted …)
- helpers to build events

## Public API (planned, exported from `index.js`)
- `EVENT (frozen name table)`
- `make.<event>(payload)`

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- carry display text (presentation turns events into text via i18n)
