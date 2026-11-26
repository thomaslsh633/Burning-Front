# src/logic/state/

**Layer 2 — Game Logic** — The shape of GameState and pure read helpers (state management, data side).

## Owns
- unit runtime state shape `unit.js` with its invariants (`docs/unit-state.md` §4)
- GameState: { match, map, units, structures, points, teams: { blue, red }, turn, pending, rng }
- factories: createMatch(setup, data)
- selectors: unitAt, unitsOf, teamOf, isEngaged …
- field ownership `ownership.js`: which system may write each unit field (`docs/unit-state.md` §7); done

## Public API (exported from `index.js`)
- `createMatch(setup, data)`, `createUnit(spec, data)` (`spec.members` carries HP over), `spawnUnit(state, spec, data)` (next free id), `checkUnit(unit)` (invariants) — done
- selectors `unitById`, `allUnits`, `unitsOf`, `unitAt`, `enemyOf`, `isOnMap`, `isActive`, `putUnit` — done
- `UNIT_FIELD_OWNERS`, `ownerOf(path)`, `changedPaths(a, b)`, `foreignWrites(system, before, after)` — done

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- hold UI-only state (that is UiState in presentation/controller)
