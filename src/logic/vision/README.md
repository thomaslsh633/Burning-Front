# src/logic/vision/

**Layer 2 — Game Logic** — Sight and line of sight.

## Owns
- visibility FSM (REVEALED, CONCEALED) and derived cover `coverAgainst(state, unit, attacker)` (`docs/unit-state.md` §5.2, §5.6)
- visible hexes per team
- line of sight through cover and buildings
- concealment, camouflage, detection
- garrison sight

## Public API (exported from `index.js`)
- `sightLine`, `sightRange`, `hasLineOfSight`, `visibleHexes`, `detectionRange`, `canSee`, `unitSees` (one viewer, for overwatch) — done
- `coverAgainst(state, data, target, fromHex)`, `receivesCover`, `hexCover` — done
- `VISIBILITY` machine, `revealOnFire`, `revealOnMove`, `visibilityTurnEnd` — done; smoke follows with skills

## May import
- `logic/*` only (other systems through their `index.js`)
