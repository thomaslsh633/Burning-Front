# src/logic/vision/

**Layer 2 — Game Logic** — Sight and line of sight.

## Owns
- visibility FSM (REVEALED, CONCEALED) and derived cover `coverAgainst(state, unit, attacker)` (`docs/unit-state.md` §5.2, §5.6)
- visible hexes per team
- line of sight through cover and buildings
- concealment, camouflage, detection
- garrison sight

## Public API (planned, exported from `index.js`)
- `visibleHexes`
- `hasLineOfSight`
- `isConcealed`
- `isDetected`

## May import
- `logic/*` only (other systems through their `index.js`)
