# Roadmap — one data form across all unit categories

Status: **plan** (2026-11-25). Data import (Phase 2 onward) starts only after the unit state model `docs/unit-state.md`;
CoH3 is the data authority, v214 a gameplay reference only. Builds on `docs/unit-data-format.md` (label selection) and feeds the rewrite
(`docs/ARCHITECTURE.md`: `services/data` loads the result, `logic/*` systems read it).

## The idea: core + modules + category profile

A rifle, a mine and a howitzer cannot have the same fields, but every field that exists must mean the same
thing everywhere. So each file kind has three parts:

```text
record = CORE (same labels for every category of this kind)
       + MODULES (named blocks, each with one fixed shape, each read by one logic system)

category profile = which modules a category must have, may have, or must not have, plus its default values
```

- **One shape per label.** `aoe` always has `{ damage, distance_m, suppression, max_members, friendly_fire }`,
  whether it is on a grenade, a tank gun or a howitzer.
- **One owner per module.** `aoe` is read by `logic/combat`, `capture` by `logic/capture`, `hold` by
  `logic/transport`. Adding a module means adding one rule system, not touching the others.
- **Profiles are data** (`data/schema/profiles.json`). They let the build reject a mortar without `scatter`, or a
  mine with `shots_per_turn`, and they let a new unit start from its category's defaults.

## What the CoH3 data shows (census of `american`, coh3-data 2026-11-18)

Share of records in each category that use a block (weapon: blocks with a value; ebps / sbps: extension present).

**Weapon**

| Subcategory | n | AoE | scatter | setup | burst | min range | deflect | moving fire | reload cycle |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| anti_tank_gun | 3 | 3 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| infantry_anti_tank_weapon | 11 | 9 | 9 | 0 | 0 | 1 | 6 | 0 | 0 |
| tank_gun | 37 | 37 | 33 | 0 | 0 | 5 | 7 | 34 | 2 |
| grenade | 27 | 22 | 6 | 0 | 0 | 12 | 4 | 0 | 0 |
| heavy_artillery | 38 | 33 | 36 | 14 | 8 | 21 | 17 | 5 | 1 |
| light_artillery | 19 | 11 | 15 | 10 | 0 | 18 | 8 | 13 | 0 |
| mine | 6 | 6 | 5 | 0 | 0 | 0 | 5 | 0 | 0 |
| mortar | 20 | 16 | 20 | 19 | 0 | 19 | 16 | 1 | 0 |
| flame_throwers | 2 | 0 | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| heavy_machine_gun | 25 | 2 | 20 | 8 | 23 | 0 | 0 | 17 | 18 |
| light_machine_gun | 17 | 0 | 17 | 0 | 17 | 0 | 0 | 14 | 17 |
| sub_machine_gun | 12 | 0 | 12 | 0 | 12 | 0 | 0 | 12 | 12 |
| rifle | 17 | 0 | 17 | 0 | 0 | 0 | 0 | 14 | 17 |
| sidearm | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 1 |

(Small-arms "scatter" is the miss spread of bullets. It has no game effect on a hex board and is not imported for them.)

**ebps**: extension present (%)

| Extension → module | infantry (50) | vehicles (63) | team_weapons (4) | emplacements (1) | buildings (69) | aircraft (12) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| health, type, cost → core | 100 | 100 | 100 | 100 | 97 | 100 |
| moving → `move` | 100 | 92 | 75 | 0 | 0 | 100 |
| sight → `sight` | 94 | 65 | 100 | 100 | 75 | 100 |
| combat → `weapons` | 100 | 94 | 100 | 100 | 68 | 100 |
| camouflage → `stealth` | 100 | 92 | 100 | 100 | 42 | 0 |
| hold → `hold` | 0 | 30 | 0 | 0 | 17 | 0 |
| crew / recrewable / team_weapon → `crew` | 0 | 57 | 100 | 100 | 12 | 0 |
| towing_trailer → `tow` | 0 | 0 | 75 | 0 | 0 | 0 |
| construction → `construction` | 0 | 3 | 25 | 100 | 90 | 0 |
| spawner → `produces` | 0 | 37 | 0 | 100 | 36 | 17 |
| aide_station → `aura` | 0 | 2 | 0 | 100 | 4 | 0 |
| flight → `flight` | 0 | 0 | 0 | 0 | 0 | 100 |

**sbps**: extension present (%)

| Extension → module | infantry (30) | vehicles (44) | team_weapons (10) | emplacements (10) | aircraft (12) |
| --- | ---: | ---: | ---: | ---: | ---: |
| loadout, type, upgrade, ability → core | 100 | 100 | 100 | 100 | 100 |
| capture_strategic_point → `capture` | 100 | 100 | 100 | 0 | 0 |
| reinforce → `reinforce` | 93 | 100 | 100 | 10 | 0 |
| veterancy → `veterancy` | 97 | 98 | 100 | 40 | 0 |
| engineer → `build` | 70 | 0 | 0 | 0 | 0 |
| team_weapon → `team_weapon` | 0 | 0 | 100 | 100 | 0 |
| paradrop → trait `paradrop` | 17 | 2 | 80 | 0 | 0 |

SPEC differs from CoH3 here: CoH3 vehicles have a capture extension, but SPEC §3 says armed vehicles only contest.
The vehicle profile follows SPEC (no `capture`, trait `contests`).

## Proposed forms (to be fixed in Phase 3–4)

### weapon

- **Core:** `id`, `coh3_ref`, `parent`, `class`, `tags`, `damage`, `damage_type`, `penetration` (Band3), `vs_target`, `traits`
- **Modules:**
  - `attack`: `{ fire_mode, accuracy, range_hex, band_end_hex?, shots_per_turn, arc_deg, vs_cover, vs_suppressed, vs_pinned, height }`
  - `aoe`, `scatter`, `suppression`, `deflection`
  - `reload` `{ turns }`
  - `emplace` `{ required }`
  - `moving` `{ can_fire, accuracy }`
  - `persons` `{ vs_infantry }`
  - `trigger` `{ on, targets }` (mines)
  - `burn` `{ turns, damage }` (flame)
  - `use` `{ by_ability }` (grenades and satchels fired by an ability)

| Profile | Must | May | Must not |
| --- | --- | --- | --- |
| small_arms (rifle, sidearm, smg, lmg) | attack | suppression, moving | aoe, scatter, reload, trigger |
| heavy_machine_gun | attack | suppression, emplace, moving | aoe, trigger |
| infantry_anti_tank_weapon | attack, deflection | aoe | emplace, trigger |
| tank_gun | attack, deflection | aoe, scatter, persons, moving, reload | emplace, trigger |
| anti_tank_gun | attack, deflection, emplace | aoe, scatter | trigger |
| mortar, light_artillery, heavy_artillery | attack (fire_mode indirect / lobbed), aoe, scatter, emplace | reload, suppression | trigger |
| grenade | aoe, use | attack, scatter | emplace, trigger |
| mine | aoe, trigger | deflection, suppression | attack, emplace |
| anti_air_gun | attack, emplace | aoe, scatter, suppression | trigger |
| tungsten_round_upgrade (ammo kits) | same as tank_gun | | |
| aircraft (off-map, used by abilities) | aoe | attack, scatter | emplace, trigger |
| flame_throwers | attack | burn, moving | aoe, scatter, trigger |

### ebps

- **Core:** `id`, `coh3_ref`, `parent`, `tags`, `hp`, `target_size`, `armor`, `directional_damage`, `resist`, `cost`, `traits`
- **Modules:**
  - `move` `{ hex, pass }`, `sight` `{ hex, detect_hex }`
  - `weapons` `[{ weapon, mount, slot }]`, `stealth`
  - `hold` `{ slots }`, `crew` `{ squad, min_members }`, `tow` `{ by }`
  - `construction` `{ build_turns, footprint }`, `produces` `[sbps]`
  - `aura` `{ heal_per_turn, radius_hex }`, `flight` `{ … }`

| Profile | Must | May |
| --- | --- | --- |
| infantry | move, sight, weapons | stealth |
| vehicles | move, sight, weapons | hold, crew, produces, aura, stealth |
| team_weapons | sight, weapons, crew | tow, move, stealth |
| emplacements | sight, construction | weapons, crew, aura, hold, stealth |
| buildings | construction | produces, sight, weapons, hold, aura |
| aircraft | flight | weapons, sight |

### sbps

- **Core:** `id`, `coh3_ref`, `parent`, `tags`, `role`, `members`, `cost` (sum or `cost_override`), `pop`, `requires`, `upgrades`, `abilities`, `traits`
- **Modules:** `capture`, `reinforce`, `veterancy`, `build`, `team_weapon` `{ weapon_entity, crew_entity }`, `supply` `{ ammo }` (unit fuel removed 2026-11-25)

| Profile | Must | May |
| --- | --- | --- |
| infantry | capture, reinforce, veterancy, supply | build |
| vehicles | veterancy, supply | — (SPEC: contest only, repair instead of reinforce) |
| team_weapons | capture, reinforce, veterancy, team_weapon, supply | — |
| emplacements | team_weapon | veterancy |
| aircraft | — | — (used by abilities and strikes, later) |

### fx

- **Core:** `name`, `desc`, `icon`
- **Modules:** `model` `{ id, sprite_scale, anim_class }`, `menu` `{ tab, order }`, `sound`, `effect`
- Profiles follow the stat file the record belongs to (weapon: sound, effect; ebps: model, sound, effect; sbps: menu).

### Census result (Phase 1, all four factions + common)

`data/source/coh3/CENSUS.md` (coh3-data `49fc4dbc`) confirmed the profiles above with these changes, already applied:
`suppression` is optional for small arms and HMGs (2 of 58 rifles and 37 of 57 HMGs carry it); mines may carry
suppression; three subcategories added (`anti_air_gun`, `tungsten_round_upgrade`, `aircraft`).
Not imported as records: weapon `campaign`, `dummy_construction_*`, `preroll_destruction`; ebps `gameplay`, `props`,
`misc`, `missions`, `weapons` (link only); sbps `squad_size_variants`. `parent` records in `common` are read only to
resolve inheritance. Afrikakorps keeps its emplacements under ebps `buildings` and has one sbps `buildings` record.

## Phases

Each phase ends with a gate. The next phase starts when the gate passes. Sizes: S < 1 day, M 1–3 days, L > 3 days of work.

| # | Phase | Delivers | Gate | Size |
| --- | --- | --- | --- | --- |
| 0 | Decisions | answers to the open points below, written into `docs/unit-data-format.md` | you approve both plan docs | S |
| 1 | Source and census | `tools/coh3/fetch` (pins a coh3-data commit), `tools/coh3/census` (the tables above for all 4 factions + common), `data/source/coh3/SOURCE.md` | census for `german`, `afrika_korps`, `british` agrees with the American profiles, or the profiles are adjusted | S |
| 2 | Shared foundation | `data/rules/vocab.json` (tags, traits, damage types, cover, fire modes, roles, modifier names); shared types `Band3`, `Resources`, `Mods`, `Armor3`; `tools/validate` (small JSON-Schema subset, no dependencies) with tests | validator accepts / rejects fixtures for every shared type and vocab list | M |
| 3 | Core and modules | `data/schema/{weapon,ebps,sbps,fx}.schema.json`: core + every module, each field documented | one fixture per module validates, a wrong shape is rejected | M |
| 4 | Category profiles | `data/schema/profiles.json` (must / may / must not + defaults per category); one hand-written sample per category (14 weapon, 6 ebps, 5 sbps) | every sample validates; a mine with `attack` and a mortar without `scatter` are rejected | M |
| 5 | Importer pilot | `tools/import-coh3`: follow sbps → ebps → weapon, resolve `parent_pbg` (incl. `common`), map fields, convert distance / time, sum cost, map veterancy and cover, one tested step each. Pilot: one American unit per category (riflemen, Sherman, 57 mm AT gun, 81 mm mortar, M1919 team, one emplacement) | pilot records validate and follow the documented CoH3 conversion; differences from v214 are reported for reference | L |
| 6 | American + German | every unit in the v214 roster (as a checklist of what to cover), plus the upgrades (kits) they use: `upgrade.json` per faction with the same core + module pattern | records validate; conversion report (CoH3 → game values) reviewed by you; v214 differences listed for reference | L |
| 7 | Afrika Korps + British | full rosters from CoH3; units with no CoH3 data marked `estimated` | validate; your balance review | L |
| 8 | Build and links | build step: resolve `parent`, apply profile defaults, check every id link (members, weapons, upgrades, fx, i18n keys), write `data/generated/units.json`; runs in `npm run check` | a broken link or unknown word fails the build | M |
| 9 | Editing workflow | `tools/unit.js <id>` (final values from `data/generated`, no browser, replaces `unit.py`), `tools/new-unit <category> <id>` (starts from the profile defaults), a short "add or change a unit" guide | you add one unit using only the guide | S |

Phases 2–4 need no CoH3 import and can be reviewed on small hand-written samples. Phase 5 is where the format
meets real data; profiles may change once more there. After Phase 8, `src/services/data` loads
`data/generated/units.json`, and the logic systems start from it.

Abilities (`ability.json`) follow the same pattern but are planned with `logic/skills`. Until then, ability ids
in sbps are checked against a list, not against full records.

## Decisions (Phase 0, 2026-11-25)

1. **British:** use CoH3 race `british` (not `british_africa`).
2. **"fh"** is the weapon file: `coh3-data/data/chunked/weapon/<race>.json`.
3. **Data entry is postponed.** Game planning (`docs/game-design.md`) goes first; Phases 1–9 start after it.
4. **Source:** load the per-faction files from `coh3-data/data/chunked` (`weapon/<race>.json`, `ebps/races/<race>.json`,
   `sbps/races/<race>.json`, plus `common`). Proposal: pin the coh3-data commit and commit only the records the roster uses
   (the full set is about 100 MB); settled in Phase 1.
5. **Values follow the game, not CoH3,** wherever Burning Front has its own rule (for example vehicles only contest points,
   SPEC §3). CoH3 values are the starting point; Burning Front values are the result.

Scope of the first import (infantry, vehicles, team weapons, emplacements first) stands as proposed.
