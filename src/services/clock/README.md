# src/services/clock/

**Layer 3 — Data / Service** — The only reader of time.

## Owns
- now(), frame scheduling (requestAnimationFrame), timers

## Public API (planned, exported from `index.js`)
- `now()`
- `onFrame(fn)`
- `after(ms, fn)`

## May import
- `services/*` only (other systems through their `index.js`)
