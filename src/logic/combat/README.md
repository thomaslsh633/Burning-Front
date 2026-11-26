# src/logic/combat/

**Layer 2 — Game Logic** — Attack resolution as formulas.

## Owns
- bands, hit chance, penetration chance, damage, persons reached
- suppression amounts, counter fire, overwatch fire (MG teams only), critical rolls (applied by logic/lifecycle)
- indirect fire, scatter, AoE falloff
- attack preview (same formulas as resolve)

## Public API (exported from `index.js`)
- `band`, `armorFace`, `penChance`, `splashFactor`, `targetMods`, `hitChance`, `wholeDamage` — done
- `firingWeapons(unit, data)`, `weaponReach(state, data, unit, weapon, hex)` — done
- `canAttack`, `volleyModel`, `previewAttack`, `resolveAttack` (direct and indirect fire) — done; barrages, blind fire, counter fire and overwatch follow with `turn` / `skills`

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- hard-code a number a designer would tune (it comes from data/balance)
