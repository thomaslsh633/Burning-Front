# src/logic/lifecycle/

**Layer 2 — Game Logic** — The lifecycle axis: active, decrewed, abandoned, wrecked; critical conditions; recrew and capture of equipment (`docs/unit-state.md` §5.5, §6).

## Owns
- lifecycle FSM: ACTIVE → DECREWED (team weapons) / ABANDONED (vehicles) → ACTIVE (recrewed) or WRECKED
- critical conditions set: engine_damaged, immobilised, main_gun_damaged, crew_shocked (set by combat, cleared by repair)
- recrew / capture command (approved design), manual abandon, wreck creation and clearance, denial of own abandoned equipment

## Public API (exported from `index.js`)
- `LIFE` machine, `checkDeaths` (squad removed, crewless gun DECREWED, vehicle / structure / gun WRECKED), `applyCriticals` — done
- `lifeTurnEnd` (a served crew shock is cleared) — done (D2-7)
- `validateRecrew`, `recrewMembers`, `recrew` (team weapons; own or enemy guns alike) — done (D2-7)
- `validateAbandon`, `freeNeighbour`, `splitCrew`, `abandon` (the crew becomes a separate unit beside its gun) — done (D2-7)
- `validateClearWreck` (who may clear; `logic/terrain` `clearWreck` applies the work) — done (D2-7)
- vehicle recrew (abandoned vehicles): waits for recrewable vehicle blueprints in the data

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- roll damage or criticals (logic/combat does; this system applies the resulting condition)
