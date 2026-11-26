# src/logic/movement/

**Layer 2 — Game Logic** — Movement rules.

## Owns
- move cost per terrain and pass type
- path finding, reachable hexes
- facing, hull turn cost, reverse
- retreat movement multiplier

## Public API (exported from `index.js`)
- `moveClass`, `movePoints`, `reachable`, `pathTo`, `turnCost`, `validateMove` / `applyMove(…, onStep)`, `validateTurn` / `applyTurn` — done
- `stepCost` (reads the map through `logic/terrain`); vehicles crush crushable lines as they cross them — done

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- animate the move (emits Moved / Turned)
