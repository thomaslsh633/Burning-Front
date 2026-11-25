# src/logic/economy/

**Layer 2 — Game Logic** — Game resources (manpower, munitions, fuel) and spending.

## Owns
- income, upkeep
- prices, production queue, research, CP milestones
- conversion and refit prices

## Public API (planned, exported from `index.js`)
- `income`
- `upkeep`
- `canAfford`
- `canProduce`
- `buy`
- `research`

## May import
- `logic/*` only (other systems through their `index.js`)
