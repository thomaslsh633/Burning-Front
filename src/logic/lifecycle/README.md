# src/logic/lifecycle/

**Layer 2 — Game Logic** — The lifecycle axis: active, decrewed, wrecked; critical conditions; recrew and capture of equipment (`docs/unit-state.md` §5.5, §6).

## Owns
- lifecycle FSM: ACTIVE → DECREWED (towed team weapons) → ACTIVE (recrewed) or WRECKED; vehicles are never abandoned or captured
- critical conditions set: engine_damaged, immobilised, main_gun_damaged, crew_shocked (set by combat, cleared by repair)
- recrew / capture command (approved design), manual abandon, wreck creation and clearance; a crewless gun destroyed by fire

## Public API (exported from `index.js`)
- `LIFE` machine, `checkDeaths` (squad removed, crewless gun DECREWED, vehicle / structure / gun WRECKED), `applyCriticals` — done
- `lifeTurnEnd` (a served crew shock is cleared) — done (D2-7)
- `validateRecrew`, `recrewMembers`, `recrew` (team weapons; own or enemy guns alike) — done (D2-7)
- `validateAbandon`, `freeNeighbour`, `splitCrew`, `abandon` (the crew becomes a separate unit beside its gun) — done (D2-7)
- `convertedMembers`, `convert` (field conversion: the new blueprint, members' HP share) — done
- `validateClearWreck` (who may clear; `logic/terrain` `clearWreck` applies the work) — done (D2-7)

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- roll damage or criticals (logic/combat does; this system applies the resulting condition)
