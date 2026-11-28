# src/logic/economy/

**Layer 2 — Game Logic** — Game resources (manpower, munitions, fuel) and spending.

## Owns
- `GameState.teams[team].resources`, `unlocks` (research / doctrine held), `research` (under way)
- income (base + supplied points, `data/balance/economy.json`), upkeep (share of price, capped, excess in fuel)
- prices and unit production at map production buildings (`data/rules/production.json`)
- research in production buildings (`data/rules/research.json`) — done; CP milestones, refit prices — later

## Public API (exported from `index.js`)
- `priceOf`, `grossIncome`, `upkeep`, `collectIncome`, `canAfford`, `pay` — done (D2-8)
- `producers` (map production buildings + HQs), `offers`, `population`, `validateProduce` (route `Produce`: pay, then `state.spawnUnit` beside the building; population cap) — done (D2-8)
- `conversionOf`, `validateConvert` (route `Convert`, `data/rules/conversions.json`) — done
- `hasUnlock`, `researchOffers`, `researchOf`, `validateResearch`, `startResearch`, `researchTick` (route `Research`; tick in the income phase) — done
- `doctrinesOf`, `validateDoctrine`, `chooseDoctrine` (route `ChooseDoctrine`, `data/rules/doctrines.json`) — done

## May import
- `logic/*` only (other systems through their `index.js`)
