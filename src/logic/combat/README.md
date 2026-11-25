# src/logic/combat/

**Layer 2 — Game Logic** — Attack resolution as formulas.

## Owns
- bands, hit chance, penetration chance, damage, persons reached
- suppression amounts, counter fire, overwatch fire (MG only), critical rolls (applied by logic/lifecycle)
- indirect fire, scatter, AoE falloff
- attack preview (same formulas as resolve)

## Public API (planned, exported from `index.js`)
- `formulas.js: band, hitChance, penChance, personsReached, shotsThisTurn …`
- `canAttack(state, attackerId, targetId, data) → ok | reason`
- `previewAttack(...)`
- `resolveAttack(state, att, def, data, rng) → { state, events }`
- `resolveBarrage(...)`

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- hard-code a number a designer would tune (it comes from data/balance)
