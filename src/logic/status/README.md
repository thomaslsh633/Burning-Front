# src/logic/status/

**Layer 2 — Game Logic** — Per-unit status over time.

## Owns
- morale FSM (NORMAL, SUPPRESSED, PINNED, RETREATING) and suppression points (`docs/unit-state.md` §5.4)
- engaged, retreat, pinned / suppressed decay
- repair mark, healing
- veterancy XP and ranks

## Public API (planned, exported from `index.js`)
- `onTurnStart(state, team, data)`
- `onTurnEnd(state, team, data)`
- `gainXp`

## May import
- `logic/*` only (other systems through their `index.js`)
