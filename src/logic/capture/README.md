# src/logic/capture/

**Layer 2 — Game Logic** — Points, zones, sectors and victory points.

## Owns
- capture ticks and progress
- contested zones
- sector links to HQ
- VP drain

## Public API (planned, exported from `index.js`)
- `captureTick`
- `sectorLinked`
- `vpDrain`

## May import
- `logic/*` only (other systems through their `index.js`)
