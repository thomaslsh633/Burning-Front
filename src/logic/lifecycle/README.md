# src/logic/lifecycle/

**Layer 2 — Game Logic** — The lifecycle axis: active, decrewed, abandoned, wrecked; critical conditions; recrew and capture of equipment (`docs/unit-state.md` §5.5, §6).

## Owns
- lifecycle FSM: ACTIVE → DECREWED (team weapons) / ABANDONED (vehicles) → ACTIVE (recrewed) or WRECKED
- critical conditions set: engine_damaged, immobilised, main_gun_damaged, crew_shocked (set by combat, cleared by repair)
- recrew / capture command (approved design), manual abandon, wreck creation and clearance, denial of own abandoned equipment

## Public API (planned, exported from `index.js`)
- `lifeMachine` (FSM definition)
- `canRecrew(state, squadId, targetId, data) → ok | reason`
- `recrew(state, squadId, targetId, data) → { state, events }`
- `abandon(state, unitId, data) → { state, events }`
- `clearWreck(state, engineerId, wreckId, data) → { state, events }`

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- roll damage or criticals (logic/combat does; this system applies the resulting condition)
