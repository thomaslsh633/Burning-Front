# Unit data format — label selection and standard form

Status: **plan, waiting for approval** (2026-11-25). Nothing in `data/` follows it yet.
Roadmap and the core + module + profile form: `docs/data-form-roadmap.md`.

## Goal

Unit stats come from CoH3 and must be easy to add and change. Units are stored per faction, split like CoH3 into
**weapon → ebps (one entity) → sbps (the squad)**, with everything about looks and sound split off into **fx**.
Every record of one kind has the same shape, so one form fits every unit.

Sources read for this plan:
- `cohstats/coh3-data` (2026-11-18): `data/chunked/{weapon,ebps/races,sbps/races}/<race>.json`, e.g. `riflemen_us`, `rifleman_us`, `sherman_76mm_us`.
- legacy v214: `UNIT_ROSTER` (`legacy/js/0110`), `COH3_RAW` (`0120`), `COH3_IND` (`0125`), kits (`0190`), veterancy (`0060`), SPEC §1, §4–§6.

## How CoH3 links the three files

```text
sbps  infantry/riflemen_us
  squad_loadout_ext.unit_list ─▶ 1 × ebps infantry/rifleman_squad_leader_us
                               ─▶ 5 × ebps infantry/rifleman_us
ebps  infantry/rifleman_us
  combat_ext.hardpoints[].weapon_table[].weapon_entity_attachment.ebp
       ─▶ ebps weapons/small_arms/single_fire/rifle/w_garand_rifleman_us     (link only, no stats)
            weapon_ext.weapon ─▶ weapon small_arms/single_fire/rifle/garand_rifleman_us   (the stats)
```

The ebps `weapons/` category is only a link. Our ebps points at the weapon id directly, so that category is dropped.
Cost sits on each **entity** in CoH3 (rifleman 45 MP); a squad costs the sum of its members.

## Files

```text
data/units/
  common/        weapon.json  ebps.json  fx.json            shared by all factions (grenades, mines, common guns)
  german/        weapon.json  ebps.json  sbps.json  fx.json   Wehrmacht      (CoH3 race "german")
  american/      weapon.json  ebps.json  sbps.json  fx.json   US Forces      (CoH3 race "american")
  afrika_korps/  weapon.json  ebps.json  sbps.json  fx.json   Afrikakorps    (CoH3 race "afrika_korps")
  british/       weapon.json  ebps.json  sbps.json  fx.json   British Forces (CoH3 race "british")
```

Inside each file, records keep the CoH3 category tree, so the files read like the game's own tree:

| File | Top level → sub level (kept) | Dropped |
| --- | --- | --- |
| weapon | `ballistic_weapon` → `anti_tank_gun`, `infantry_anti_tank_weapon`, `tank_gun` · `explosive_weapon` → `grenade`, `heavy_artillery`, `light_artillery`, `mine`, `mortar` · `flame_throwers` · `small_arms` → `machine_gun` → `heavy_machine_gun`, `light_machine_gun`, `sub_machine_gun` · `single_fire` → `rifle`, `sidearm` | `campaign` |
| ebps | `infantry`, `vehicles`, `team_weapons`, `emplacements`, `buildings`, `aircraft` | `weapons` (link only), `gameplay`, `props` (map objects live in `data/maps`) |
| sbps | `infantry`, `vehicles`, `team_weapons`, `emplacements`, `aircraft` | — |
| fx | `weapon`, `ebps`, `sbps` (same ids as the stat files) | — |

The legacy roster key for each unit (`infantry` → `riflemen_us`, …) goes in `data/legacy-snapshot/keymap.json`, not in the game data.

## Standard rules for every record

1. **Same shape everywhere.** A record has `id`, `coh3_ref`, optional `parent`, then fixed blocks. A block a unit
   does not have is left out. It is never filled with zeros.
2. **Shared value types**, used by every file:

   | Type | Shape | Used for |
   | --- | --- | --- |
   | `Band3` | `{ "near": n, "mid": n, "far": n }` | accuracy, penetration, shots per turn, AoE falloff |
   | `Resources` | `{ "manpower": n, "munition": n, "fuel": n }` (zeros omitted) | cost, reinforce cost |
   | `Mods` | `{ "accuracy": x, "damage": x, "penetration": x, "suppression": x }` (1 omitted) | cover, target type, suppressed / pinned target, height |
   | `Armor3` | `{ "front": n, "side": n, "rear": n }` | armour, directional damage |
   | id | `"riflemen_us"` (CoH3 id, snake_case, unique per file kind across all factions) | every link |

3. **Units of measure are in the field name.** Hexes `_hex`, turns `_turns`, metres `_m` (only for effects smaller
   than a hex: AoE, scatter), degrees `_deg`. A field without a suffix is a count, a ratio (0–1) or a CoH3 value.
4. **Size values stay on the CoH3 scale**: HP, damage, penetration, armour, cost, suppression, XP. The player sees
   CoH3 numbers (SPEC §1). The engine scale (HP / damage × 0.36, penetration / armour × 0.12) is one constant in `data/balance`.
5. **Distance and time are converted to the board** once, by the importer: range and sight in hexes, rate of fire
   as shots per turn, reload and build time in turns. CoH3 seconds (aim, wind-up, burst, cooldown, reload) are
   read by the importer and are not stored.
6. **`parent`** inherits a record of the same kind. It is resolved at build time, so `data/generated` is flat.
7. **`coh3_ref`** is the source path. The importer uses it to report differences after a CoH3 patch, and it never
   overwrites a hand-edited value without listing it. Units with no CoH3 data have `"coh3_ref": null, "estimated": true`.
8. **Closed lists.** `tags`, `traits`, `damage_type`, cover names and fire modes come from `data/rules/vocab.json`.
   The build rejects unknown words.
9. **No text and no visuals** in weapon / ebps / sbps. Names are i18n keys in fx; models, icons and sounds are in fx.
10. **Plain JSON, no comments.** `data/schema/{weapon,ebps,sbps,fx}.schema.json` documents and checks every field.

## Labels selected

### weapon.json — one record per weapon

| Label | Type | From CoH3 `weapon_bag` | Legacy field | Note |
| --- | --- | --- | --- | --- |
| `id`, `coh3_ref`, `parent` | id | key, path, `parent_pbg` | — | |
| `class` | vocab | `weapon_class` | — | rifle, smg, lmg, hmg, at_gun, tank_gun, mortar, howitzer, rocket, flame, grenade, mine |
| `tags` | vocab[] | `weapon_tags` | — | for upgrades / skills |
| `fire_mode` | vocab | derived (projectile, `artillery_force_obey_los`) | `isArtillery`, lobbed-HE rule | `direct` · `indirect` · `lobbed` (SPEC §1, §5) |
| `damage` | number | `damage.min/max` (mean) | `atk` | CoH3 scale |
| `damage_type` | vocab | `damage.damage_type` | — | ballistic · explosive · flame · true |
| `accuracy` | Band3 | `accuracy` | `acc` | |
| `penetration` | Band3 | `penetration` | `pen` | CoH3 scale |
| `range_hex` | `{min, max}` | `range.min/max` ÷ 7 m, +1 direct fire | `minR`, `range` | SPEC §1 |
| `band_end_hex` | `{near, mid}` | — (thirds rule from `data/balance`) | — | only when a weapon breaks the rule (lobbed HE) |
| `shots_per_turn` | Band3 | aim + wind-up + burst + cooldown + wind-down + reload cycle, 6 s window, per band | `rof`, `spt` | fraction carries to next turn |
| `reload_turns` | int | — | `COH3_IND` reload | 0 when absent |
| `deflection_damage` | ratio | `deflection.deflection_damage_multiplier` | `deflectDmgPct` | |
| `suppression` | `{amount, nearby_mult, nearby_radius_m}` | `suppression.*` | `supp` | |
| `aoe` | `{damage: Band3, distance_m: Band3, suppression: Band3, max_members, friendly_fire}` | `area_effect.*` | `area`, `COH3_IND.aoe/maxM` | splash inside the target hex |
| `scatter` | `{angle_deg, distance_ratio, distance_max_m}` | `scatter.*` | `COH3_IND.sc` | indirect fire: chance to land on the hex |
| `persons` | number | — | tank table (SPEC §4) | tank main gun vs infantry |
| `arc_deg` | number | `tracking.normal.max_left/right` | `arc`, `cone` | 360 when free |
| `emplace` | bool | `behaviour.non_moving_setup` | `hw` | crew weapons (SPEC §5) |
| `moving` | `{can_fire, accuracy}` | `moving.can_fire_while_moving`, `accuracy_multiplier` | — | fire after moving this turn |
| `vs_target` | `{<unit tag>: Mods}` | `target_type_table` | `saImm` / `sa` (rifle fire vs armoured cars) | |
| `vs_cover` | `{none, light, heavy, garrison, trench, smoke, water, negative: Mods}` | `cover_table` (`tp_road_*` folded into light / heavy) | cover rules (SPEC §4) | only values that differ from the `data/rules` default |
| `vs_suppressed`, `vs_pinned` | Mods | `suppression.target_*_multipliers` | — | |
| `height` | `{advantage: Mods, disadvantage: Mods}` | `height_bonuses` | elevation rule | |
| `traits` | vocab[] | `behaviour.piercing`, `can_damage_allies`, `hit_everything_on_*` | — | |

Dropped from the weapon bag: `anim_table`, `aim`, `burst`, `cooldown`, `fire`, `reload` durations (folded into
`shots_per_turn`), all `fx_*`, `icon_name`, `help_text`, `ui_*` (to fx / i18n), `priority` (the AI scores targets
itself), `projectile`, `tracking` speeds, `avoid_blockers_of_relationship`, `animation_role_option`, `fog_of_war`,
`audio`, `weapon_impact_modifier`, `building_charring_settings`, `conditional_table` (state trees; upgrades and
veterancy cover it), `charge/siege/brace_option`, `pbgid`, `custom_properties`.

### ebps.json — one record per entity (one soldier, vehicle, gun or building)

| Label | Type | From CoH3 ext | Legacy field | Note |
| --- | --- | --- | --- | --- |
| `id`, `coh3_ref`, `parent` | id | | | |
| `tags` | vocab[] | `type_ext.unit_type_list` | `armorType`, `cat` | infantry, vehicle, tank, team_weapon … matched by weapon `vs_target` |
| `hp` | number | `health_ext.hitpoints` | `maxHp` (× N), `vhp` | per entity |
| `target_size` | number | `health_ext.target_size` | `ts` | |
| `armor` | Armor3 | `health_ext.armor_layout_option.*_armor` | `armor`, `armorS`, `armorR` | infantry 1 / 1 / 1 |
| `directional_damage` | Armor3 | `*_damage_multiplier` | `rm` | |
| `resist` | `{ballistic, explosive, flame, true}` | `armor_scaler_by_damage_type` | — | |
| `regen_per_turn` | number | `health_ext.regeneration` × 10 s | — | |
| `cost` | Resources | `cost_ext.time_cost.cost` | `cost`, `fcost` (squad sum) | |
| `build_turns` | int | `cost_ext.time_cost.time_seconds` → turns | — | for buildings and single-entity squads |
| `move_hex` | int | `moving_ext.speed_scaling_table.max_speed` (3.6 m/s = 4) | `move` | SPEC §1 |
| `pass` | vocab | `moving_ext.pass_type` | — | infantry, light_vehicle, tank … (terrain costs in `data/rules`) |
| `sight_hex` | int | `sight_ext.sight_package.outer_radius` ÷ 7 + 1 | `sight` | SPEC §1 |
| `detect_hex` | int | `sight_ext.detect_camouflage.tp_global` | — | |
| `weapons` | `[{weapon, mount, slot}]` | `combat_ext.hardpoints` (parent hardpoint → turret) | `atk…`, `sub` | `mount`: turret · hull · fixed; `slot`: main · secondary · accessory |
| `stealth` | `{detected_hex, first_strike_shots, recloak_turns}` | `camouflage_ext` | concealment rule | |
| `hold` | `{slots}` | `hold_ext` | `cargoCap` | transport / garrison capacity |
| `produces` | sbps id[] | spawner / production ext | building data | buildings only |
| `traits` | vocab[] | `health_ext.can_repair`, `is_salvagable_wreck`, `receive_weapon_cover_modifiers`, `paradrop_ext` … | `isHeavy`, … | |

Dropped: `ui_ext`, `presentation_override_ext` (to fx), `moving_ext` motion and acceleration fields,
`rotation_rate` (turn cost is a SPEC rule), `population_ext` (squad level), CoH3 upkeep (SPEC uses % of price),
`line_of_sight_ext`, `trench_crossing_ext`, `entity_inventory_ext`, `crew_ext` (recrewing is out of scope),
`pbgid`, `custom_properties`.

### sbps.json — one record per squad (the unit you buy and command)

| Label | Type | From CoH3 ext | Legacy field | Note |
| --- | --- | --- | --- | --- |
| `id`, `coh3_ref`, `parent` | id | | | |
| `tags` | vocab[] | `squad_type_ext.squad_type_list` | `tab`, `macro` | |
| `role` | vocab | — | `role` | AI · AT · ALV · ALL · SUPP · IND · REC · ENG · LOG |
| `members` | `[{entity, count}]` | `squad_loadout_ext.unit_list` | `N` | |
| `cost` | Resources | sum of member `cost` | `cost`, `fcost` | `cost_override` when the game price differs |
| `pop` | int | `squad_population_ext.personnel_pop` | — | |
| `build_turns` | int | from member `time_seconds` | — | |
| `requires` | `{buildings: id[], cp}` | `squad_requirement_ext` | `req` | |
| `reinforce` | `{cost_ratio}` | `squad_reinforce_ext.time_cost_percentage.cost_percentage` | reinforce | |
| `capture` | `{rate}` | `squad_capture_strategic_point_ext` | `capt` | left out = cannot capture |
| `build` | `{menu: id[]}` | `squad_engineer_ext.construction_groups` | `ENG` role | left out = cannot build |
| `supply` | `{ammo, fuel}` | — (Burning Bridges supply) | `ammo`, `fuel`, `maxFuel`, `supplies` | |
| `upgrades` | `{slots, list: id[]}` | `squad_upgrade_ext` | kits (`0190`) | |
| `abilities` | id[] | `squad_ability_ext` + member `ability_ext` | skills | |
| `veterancy` | `{xp: [n, n, n], ranks: [{<modifier>: x}]}` | `squad_veterancy_ext` + `veterancy.json` | `COH3_RAW.vet` | modifier names from `data/rules/vocab.json` |
| `traits` | vocab[] | `squad_orders` (retreat, load, …) | `isElite`, … | |

Dropped: `squad_formation_ext`, `squad_action_apply_ext`, `squad_inventory_ext`, `squad_breach_ext`,
`squad_ui_ext` (to fx), `squad_female_chance`, `paradrop_requirements` (as rules), `pbgid`, `custom_properties`.

### fx.json — looks, sound and names (no stats)

| Label | For | From | Note |
| --- | --- | --- | --- |
| `name`, `short_name`, `desc` | weapon, ebps, sbps | `ui_info.screen_name` locstrings | i18n keys (`data/i18n/ko.json`) |
| `icon`, `portrait`, `symbol` | ebps, sbps | `ui_ext.icon_name`, `portrait_name`, `symbol_icon_name` | |
| `model`, `sprite_scale` | ebps | legacy TankBaker model ids | |
| `anim_class` | ebps | legacy v207 weight classes | infantry · crew · wheeled · tank_medium · tank_heavy |
| `menu` | `{tab, order}` | sbps | `ui_position`, legacy `tab` | production menu |
| `sound` | `{fire, impact, move, death, select}` | weapon, ebps | `fx_munition_name`, `speech_code` | cue ids |
| `effect` | `{muzzle, tracer, impact, death}` | weapon, ebps | `fx_*` | |

## Example (riflemen, short)

```json
// american/sbps.json → infantry
"riflemen_us": {
  "coh3_ref": "sbps/races/american/infantry/riflemen_us",
  "tags": ["infantry", "rifleman"], "role": "AI",
  "members": [{ "entity": "rifleman_squad_leader_us", "count": 1 }, { "entity": "rifleman_us", "count": 5 }],
  "pop": 2, "reinforce": { "cost_ratio": 0.667 }, "capture": { "rate": 1 },
  "upgrades": { "slots": -1, "list": ["bar_rifleman_squad_us", "m1919a6_rifleman_squad_us"] },
  "veterancy": { "xp": [900, 2700, 5400],
    "ranks": [{ "received_accuracy": 0.9 }, { "weapon_accuracy": 1.25, "attack_speed": 0.9 },
              { "received_accuracy": 0.8, "hp_add": 15, "attack_speed": 0.75 }] }
}
// american/ebps.json → infantry
"rifleman_us": {
  "coh3_ref": "ebps/races/american/infantry/rifleman_us",
  "tags": ["infantry"], "hp": 95, "target_size": 1, "armor": { "front": 1, "side": 1, "rear": 1 },
  "cost": { "manpower": 45 }, "move_hex": 4, "pass": "infantry", "sight_hex": 6,
  "weapons": [{ "weapon": "garand_rifleman_us", "mount": "hull", "slot": "main" }],
  "traits": ["receives_cover"]
}
// american/weapon.json → small_arms → single_fire → rifle
"garand_rifleman_us": {
  "coh3_ref": "weapon/american/small_arms/single_fire/rifle/garand_rifleman_us",
  "class": "rifle", "fire_mode": "direct", "damage": 12, "damage_type": "ballistic",
  "accuracy": { "near": 0.68, "mid": 0.62, "far": 0.35 }, "penetration": { "near": 2, "mid": 1, "far": 1 },
  "range_hex": { "min": 0, "max": 6 }, "shots_per_turn": { "near": 2.6, "mid": 1.8, "far": 1.4 }
}
// american/fx.json
"sbps": { "riflemen_us": { "name": "unit.riflemen_us.name", "icon": "rifle_squad", "menu": { "tab": "infantry", "order": 2 } } }
```

(The `//` lines only label the excerpts. The data files themselves contain no comments. `shots_per_turn` here is
illustrative; the importer computes it and the oracle checks it against v214.)

## Approaches considered

| | What the files hold | Trade-off |
| --- | --- | --- |
| A. CoH3 shape, filled in | every CoH3 field, seconds and metres | easy re-import, but ~80 % of the fields mean nothing on a hex board and every rule converts units at runtime |
| B. Board units only | everything converted (HP × 0.36 too) | simplest runtime, but the numbers no longer match CoH3 or what the player sees |
| **C. Chosen**: CoH3 tree and CoH3 size values, board distance and time | as above | matches SPEC §1 (player sees CoH3 numbers), easy to compare with coh3stats, and only distance and time are converted, once |

## Pipeline

```text
data/source/coh3/<race>/{weapon,ebps,sbps}.json   (raw, untouched)
        │ tools/import-coh3 <race> <sbps id…>      picks a unit and follows sbps → ebps → weapon,
        ▼                                          converts distance / time, writes new records, reports diffs
data/units/<faction>/{weapon,ebps,sbps,fx}.json    (hand-editable source of truth)
        │ build: resolve parent, apply defaults, check schema + vocab + every link
        ▼
data/generated/units.json                           (flat, what the game loads)
        │ oracle
        ▼
compare with data/legacy-snapshot/ (v214) → every difference listed
```

## Decisions

See `docs/data-form-roadmap.md` → Decisions (2026-11-25): British = `british`, "fh" = weapon file,
source = `coh3-data/data/chunked` per faction, values follow Burning Front rules, data entry after game planning.

## After approval

1. `data/rules/vocab.json` and the four schemas.
2. `tools/import-coh3` with one named, tested step per conversion (range, sight, move, shots per turn, cost sum, veterancy).
3. Import the legacy roster's units for `american` and `german` first, then `afrika_korps` and `british`.
4. Build step and oracle comparison against the v214 snapshot.
