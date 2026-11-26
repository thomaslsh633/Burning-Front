# src/logic/victory/

**Layer 2 — Game Logic** — Win conditions, one function per mode chosen by `match.mode` (tuning `data/balance/victory.json`).

## Owns
- `teams[team].tickets`, `GameState.victory` (Victory Meter momentum), `match.over` (`{ winner, reason }`)
- capture: VP-lead ticket bleed with momentum, parity tiebreak by resource control (v214 Victory Meter)
- annihilation: enemy HQ destroyed or no enemy units left (2026-11-26); optional round cap (`match.roundCap`) decided by surviving value
- room for new modes

## Public API (exported from `index.js`)
- `settle(state, data, side)` (the `victory` slot of the turn start), `hqDestroyed` is `logic/terrain`'s — done (D2-9)

## May import
- `logic/*` only (other systems through their `index.js`)
