# src/logic/hex/

**Layer 2 — Game Logic** — Hex grid math.

## Owns
- offset / cube / axial coordinates
- distance, neighbours, line, ring, arcs

## Public API (exported from `index.js`)
- `distance`, `neighbour(s)`, `line`, `ring`, `disk`, `direction`, `angle`, `turnSteps`, `arcContains`, `inside`, `toCube` / `fromCube`, `key` — done (odd-r pointy-top, directions 0 E clockwise)

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- know about units or terrain
