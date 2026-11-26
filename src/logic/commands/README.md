# src/logic/commands/

**Layer 2 — Game Logic** — The command catalog and the one entry point that applies a command.

## Owns
- command types: Move, Turn, Attack, Barrage, UseSkill, Emplace, Pack, Board, Dismount, Build, Produce, Research, Retreat, Repair, Convert, EndTurn …
- validation before apply (reason codes)
- routing each command to the system that owns it

## Public API (exported from `index.js`)
- `validate(state, cmd, data)` → reason | null, `apply(state, cmd, data, rng)` → `{ state, events, undoable }` | `{ error }` — done
- `ROUTES` (type → owning system's validate / apply), `MACHINES` (unit axes checked by `permits`) — filled as systems ship

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- implement a rule itself (it routes to the owning system)
