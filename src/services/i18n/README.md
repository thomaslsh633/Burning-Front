# src/services/i18n/

**Layer 3 — Data / Service** — Every player-visible text.

## Owns
- key → text (data/i18n/ko.json)
- number formatting
- event → log line templates

## Public API (planned, exported from `index.js`)
- `t(key, params)`
- `logLine(event)`

## May import
- `services/*` only (other systems through their `index.js`)
