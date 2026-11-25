# src/logic/commands/

**Layer 2 — Game Logic** — The command catalog and the one entry point that applies a command.

## Owns
- command types: Move, Turn, Attack, Barrage, UseSkill, Emplace, Pack, Board, Dismount, Build, Produce, Research, Retreat, Repair, Convert, EndTurn …
- validation before apply (reason codes)
- routing each command to the system that owns it

## Public API (planned, exported from `index.js`)
- `apply(state, command, data, rng) → { state, events } | { error: reason }`
- `validate(state, command, data) → ok | reason`

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- implement a rule itself (it routes to the owning system)
