# src/logic/skills/

**Layer 2 — Game Logic** — Abilities (SPEC §10).

## Owns
- `cooldowns` (own turns left per ability), who may use which ability now (requirements, cost)
- the ability's weapon as combat fires it (`abilityWeapon`), the hexes a smoke ability covers (`smokeHexes`; terrain stores the smoke)

## Public API (`index.js`)
- `abilitiesOf`, `abilityWeapon`, `useOf`, `isSmoke`, `smokeHexes`, `skillReady`, `validateUseSkill`, `startCooldown`, `tickCooldowns`
  (route `UseSkill`: pay, `steps.fire` with the use, cooldown, the action)

## Must not
- resolve hits (combat), pay (economy) or spend the budget (turn): the route sequences them.

## Not built
- buffs, toggles, passives, off-map strikes, pending (next-turn) barrages, doctrine choice

## May import
- `logic/*` only (other systems through their `index.js`)
