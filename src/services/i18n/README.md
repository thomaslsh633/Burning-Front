# src/services/i18n/

**Layer 3 — Data / Service** — Every player-visible text.

## Owns
- key → text, loaded from `data/generated/i18n.json` (data/i18n + mods); a missing key falls back to English, then to the key
- number formatting
- event → log line templates

## Public API (planned, exported from `index.js`)
- `t(key, params)`
- `logLine(event)`

## May import
- `services/*` only (other systems through their `index.js`)
