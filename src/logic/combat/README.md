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
- `canAttack`, `volleyModel`, `previewAttack`, `resolveAttack` (direct and indirect fire) — done; counter fire and overwatch fire use `resolveAttack` (who may react: `logic/turn`); barrages and blind fire follow with `skills`
- `setMembers` (crew changes: abandon, recrew) — done (D2-7); a crew without its towed gun fires its own small arms

## May import
- `logic/*` only (other systems through their `index.js`)

## Must not
- hard-code a number a designer would tune (it comes from data/balance)
