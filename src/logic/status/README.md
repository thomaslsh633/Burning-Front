# src/logic/status/

**Layer 2 — Game Logic** — Per-unit status over time.

## Owns
- morale FSM (NORMAL, SUPPRESSED, PINNED, RETREATING) and suppression points (`docs/unit-state.md` §5.4)
- engaged, retreat, pinned / suppressed decay
- repair mark, healing
- veterancy XP and ranks

## Public API (exported from `index.js`)
- `MORALE` machine, `applySuppression`, `decaySuppression`, `validateRetreat`, `startRetreat`, `arriveIfNear`, `ammoState` — done
- `xpFor`, `gainXp`, `rankMods`, `unitValue` (veterancy) — done; repair mark and healing follow with skills

## May import
- `logic/*` only (other systems through their `index.js`)
