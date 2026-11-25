# src/logic/movement/

**Layer 2 — Game Logic** — Movement rules.

## Owns
- move cost per terrain and pass type
- path finding, reachable hexes
- facing, hull turn cost, reverse
- retreat movement multiplier

## Public API (planned, exported from `index.js`)
- `moveCost`
- `findPath`
- `reachable`
- `turnCost`
- `applyMove`

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- animate the move (emits Moved / Turned)
