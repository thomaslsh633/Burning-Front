# src/logic/skills/

**Layer 2 — Game Logic** — Doctrines, abilities, barrages, strikes.

## Owns
- ability cooldowns and costs
- pending strikes and smoke
- doctrine choice

## Public API (planned, exported from `index.js`)
- `canUseSkill`
- `useSkill`
- `runPendingStrikes`

## May import
- `logic/*` only (other systems through their `index.js`)
