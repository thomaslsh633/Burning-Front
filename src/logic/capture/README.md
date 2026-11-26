# src/logic/capture/

**Layer 2 — Game Logic** — Points, zones, sectors and victory points.

## Owns
- `GameState.points`: `[{ id, owner, progress, by }]` (the map's point definitions stay in `data.maps[id].points`)
- capture ticks and progress (1 point per capturing squad, `data/balance/economy.json`), contested zones
- sector links to HQ (which owned points pay)
- VP drain (D2-9)

## Public API (exported from `index.js`)
- `capturePower`, `contests`, `captureTick(state, data, side)`, `suppliedPoints(state, data, team)` — done (D2-8)
- `vpDrain` — planned (D2-9)

## May import
- `logic/*` only (other systems through their `index.js`)
