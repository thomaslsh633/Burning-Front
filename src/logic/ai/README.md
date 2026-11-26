# src/logic/ai/

**Layer 2 — Game Logic** — Computer player. Reads state, returns commands, like a human would through the controller.

## Owns
- target scoring and move choice
- difficulty profiles (from data/balance)
- self-play for balance tests

## Public API (planned, exported from `index.js`)
- `decide(state, team, data, rng) → command[]`

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- mutate state (it returns commands; the store applies them)
- see hidden information unless the profile allows it
