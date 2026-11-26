# src/logic/victory/

**Layer 2 — Game Logic** — Win conditions, one function per mode chosen by data.

## Owns
- capture (VP tickets)
- annihilation
- room for new modes

## Public API (planned, exported from `index.js`)
- `checkVictory(state, data) → null | { winner, reason }`

## May import
- `logic/*` only (other systems through their `index.js`)
