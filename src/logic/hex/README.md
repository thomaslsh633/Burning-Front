# src/logic/hex/

**Layer 2 — Game Logic** — Hex grid math.

## Owns
- offset / cube / axial coordinates
- distance, neighbours, line, ring, arcs

## Public API (planned, exported from `index.js`)
- `distance`
- `neighbours`
- `line`
- `ring`
- `arcContains`
- `direction`

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- know about units or terrain
