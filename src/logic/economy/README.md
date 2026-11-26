# src/logic/economy/

**Layer 2 — Game Logic** — Game resources (manpower, munitions, fuel) and spending.

## Owns
- `GameState.teams[team].resources`
- income (base + supplied points, `data/balance/economy.json`), upkeep (share of price, capped, excess in fuel)
- prices and unit production at map production buildings (`data/rules/production.json`)
- research, CP milestones, conversion and refit prices — later

## Public API (exported from `index.js`)
- `priceOf`, `grossIncome`, `upkeep`, `collectIncome`, `canAfford`, `pay` — done (D2-8)
- `producers` (map production buildings + HQs), `offers`, `population`, `validateProduce` (route `Produce`: pay, then `state.spawnUnit` beside the building; population cap) — done (D2-8)
- `research` — later

## May import
- `logic/*` only (other systems through their `index.js`)
