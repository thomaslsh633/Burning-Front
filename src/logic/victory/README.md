# src/logic/victory/

**Layer 2 — Game Logic** — Win conditions, one function per mode chosen by `match.mode` (tuning `data/balance/victory.json`).

## Owns
- `teams[team].tickets`, `GameState.victory` (Victory Meter momentum), `match.over` (`{ winner, reason }`)
- capture: VP-lead ticket bleed with momentum, parity tiebreak by resource control (v214 Victory Meter)
- annihilation: no units and cannot deploy; optional round cap (`match.roundCap`) decided by surviving value
- room for new modes

## Public API (exported from `index.js`)
- `settle(state, data, side)` (the `victory` slot of the turn start), `canDeploy(state, data, team)` — done (D2-9)
- the dedicated capturable HQ of annihilation mode (SPEC §10) — not built

## May import
- `logic/*` only (other systems through their `index.js`)
