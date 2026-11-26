# src/logic/commands/

**Layer 2 — Game Logic** — The command catalog and the one entry point that applies a command.

## Owns
- command types: Move, Turn, Attack, Barrage, UseSkill, Emplace, Pack, Board, Dismount, Build, Produce, Research, Retreat, Repair, Convert, EndTurn …
- validation before apply (reason codes)
- routing each command to the system that owns it
- the order of turn phases and reactions (sequencing only; each rule is its owner's)

## Public API (exported from `index.js`)
- `validate(state, cmd, data)` → reason | null, `apply(state, cmd, data, rng)` → `{ state, events, undoable }` | `{ error }` — done
- `ROUTES` (type → owning system's validate / apply), `MACHINES` (unit axes checked by `permits`) — filled as systems ship.
  Done: Move, Turn, Attack (with counter fire), AttackFeature, Emplace, Pack, Hold, Retreat, Recrew, Abandon, ClearWreck, Produce,
  EndTurn, StartMatch (`side: null`, first turn)
- `steps.js`: shared sequences — `fire` (an attack and all its consequences), `counterFire`, `overwatchStep` (move hook) — done (D2-7)
- `phases.js`: turn phases in order — `UNIT_TURN_START`, `UNIT_TURN_END`, `SIDE_TURN_START`, `startTurn`, `endTurn`, `retreatWalk` — done (D2-7)

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- implement a rule itself (it routes to the owning system)
