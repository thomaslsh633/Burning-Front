# src/logic/turn/

**Layer 2 — Game Logic** — Turn flow and the action budget of a unit.

## Owns
- action FSM (IDLE, MOVING, ATTACKING, OVERWATCH, EXHAUSTED), budgets, overwatch eligibility: emplaced machine-gun teams only (`docs/unit-state.md` §5.1)
- per-unit action budget (move points, attack, counter); the AP model would replace this one module
- the match clock: `match.side`, `match.turn`
- who may react: counter fire budget, overwatch (`data/balance/turn.json`)

The order of turn phases (SPEC §2: strikes → status → capture → victory → income; per unit lifecycle → … → visibility)
is sequenced in `logic/commands/phases.js`, because it calls every owner and `logic/turn` cannot import them all without
import cycles. The rules each phase applies stay in their owners.

## Public API (exported from `index.js`)
- `ACTION` machine, `freshBudget`, `refreshUnit`, `budgetCheck`, `spend`, `exhaust` — done (D2-3)
- `actionTurnEnd`, `armCounter`, `counterCheck`, `spendCounter` — done (D2-7)
- `overwatchWeapon`, `validateHold`, `hold`, `overwatchers`, `overwatchFired`, `stopsMover` — done (D2-7)
- `nextSide`, `openTurn`, `closeTurn` (clock) — done (D2-7)
- reload timers (reloading units neither fire nor counter) — with barrages / indirect cadence

## May import
- `logic/*` only (other systems through their `index.js`)
