# Data labels: decisions and label list for applying CoH3 unit data

Status: **approved** (2026-11-25): decisions A–J and the recrew / capture design as recommended; K revised (below). Consolidates `docs/unit-data-format.md` (first label selection),
`docs/data-form-roadmap.md` (core + modules + profiles) and `docs/unit-state.md` (state tuning) into one list.
Source: `data/source/coh3` (coh3-data `49fc4dbc`), census `data/source/coh3/CENSUS.md`.
CoH3 is the data authority; v214 is a gameplay reference only (SPEC §10).

Status codes used in the label tables:

| Code | Meaning |
| --- | --- |
| **K** keep | copied from CoH3 unchanged (CoH3 scale: HP, damage, penetration, armour, cost, XP) |
| **C** convert | read from CoH3, converted once by the importer (metres → hexes, seconds → turns) |
| **A** add | Burning Front only; CoH3 has no such value. Set by hand or by a default in `data/balance` |
| **O** override | CoH3 has a value, but a Burning Front rule replaces it (SPEC) |
| **D** derived | not stored; computed at build or at runtime from other labels |

---

## 1. Decisions

### Decided

| # | Decision | Effect on data |
| --- | --- | --- |
| 1 | CoH3 is the data authority; v214 is reference only | every number traces to a CoH3 path (`coh3_ref`) or is marked A / O |
| 2 | Four factions: `german`, `american`, `afrika_korps`, `british` (+ `common`) | one folder per faction under `data/units/` |
| 3 | Size values stay on the CoH3 scale; the engine scale (HP / damage ×0.36, penetration / armour ×0.12) is one constant | HP, damage, pen, armour, cost, XP are **K** |
| 4 | Distance and time are converted once to hexes and turns | range, sight, move, rate of fire, reload, build time are **C** |
| 5 | Per-unit ammunition kept, per-unit fuel removed | `supply.ammo` is **A**; no unit fuel label |
| 6 | Overwatch: emplaced machine-gun teams only | no flag; **D** from `kind = team_weapon` + weapon `class = hmg` |
| 7 | Veterancy does not carry over between missions | no persistence labels |
| 8 | Unit behaviour comes from six state axes | state tuning labels below (setup, stealth, recrew, wreck, criticals) |

### Approved 2026-11-25 (A–J as recommended, K revised)

| # | Question | Recommendation | Why |
| --- | --- | --- | --- |
| A | Veterancy: inline in sbps, or its own file? | **own file** `veterancy.json` per faction, sbps points to a rank set | matches CoH3 (`veterancy/<race>.json`) and your file list; many squads share rank sets |
| B | Which of the 49 CoH3 veterancy modifiers to support | **the 20 that map to a Burning Front stat** (§4); the rest are ignored and listed in the import report | rotation, acceleration, burst duration … have no meaning on a hex turn |
| C | Upgrade effects: CoH3 keeps them in game scripts (state trees), not in data | **weapon kits are read from data** (79 infantry kits name their weapon); **all other effects are written by hand** with a fixed effect list (§5) | about 360 vehicle / status upgrades have no readable effect |
| D | Setup / teardown time: CoH3 `setup.duration` is mostly 0 (animation-driven) | **SPEC rule**: setup 1 turn, teardown 0 (end of turn), per-weapon override allowed (**O**) | CoH3 seconds do not describe the turn cost |
| E | Team weapons that are carried (HMG, mortar) vs towed guns (AT, howitzer) | **both become a `DECREWED` object on the hex**; carried weapons use the weapon item, towed guns use CoH3 `recrewable_ext` | one rule for the player; data differs only in where the crew size comes from |
| F | Unit names and descriptions | **our own Korean text** in `data/i18n/ko.json`; CoH3 locstrings are not imported | names must be ours (IP), Korean first |
| G | Ammo amounts (no CoH3 source) | **defaults per weapon class** in `data/balance/ammo.json`, override per unit | consistent, few numbers to tune |
| H | Population cap | **keep `pop` (K)**, decide later whether a cap is used | free to keep; needed if a cap comes |
| I | CoH3 battlegroups (639 upgrades) | **not imported**; doctrines are original | IP and design |
| J | Abilities | **ids only for now** (from sbps); full ability form designed with `logic/skills` | not needed before D2 |
| K | Shots per turn formula (§2.2) | **fire cycle from CoH3 timings, 6 s fire window per turn, per band, fraction carries over** | SPEC §1; one tested function |

### Decided 2026-11-25 (later)

| # | Decision | Effect on data |
| --- | --- | --- |
| L | British Forces use two CoH3 sets: `british_africa` in North Africa, `british` in Italy | `data/rules/roster.json` `factions.british.sources`; both downloaded; `british_africa` has no veterancy file and uses `british` ranks |
| M | Units missing from CoH3 production are restored: the 9 v214 units and all 18 remaining British North Africa squads | `roster.json` `restore`; `clone` for missing stats (Australian supply truck cost ← CWT 15 flatbed) |
| N | CoH3 battlegroup units are unlocked by Burning Front doctrines | catalog flags them `doctrine`; doctrine design assigns them |
| P | coh3stats.com is the second source: English names and descriptions, squad price / population / build time, roster completeness, and a cross-check of our fire rate | `data/source/coh3stats` (224 units); catalog takes names, prices and every named coh3stats unit; `reports/coh3stats-compare.md` |
| O | Numbers are whole wherever possible | shots, damage per shot, HP, cost rounded; only ratios keep two decimals |

---

## 2. weapon.json (per faction; CoH3 `weapon/<race>.json` → `weapon_bag`)

### 2.1 Labels

| Label | Type | CoH3 source | Code | Used by |
| --- | --- | --- | --- | --- |
| `id`, `coh3_ref`, `parent` | id | key, path, `parent_pbg` | K | build |
| `class` | vocab | `weapon_class` (rifle, smg, lmg, hmg, sniper, pistol, mortar, at_gun, bazooka, panzerbuchse, cannon, cannon_large, cannon_burst, artillery_small / medium / mobile, nebelwerfer, flame, grenade, rifle_grenade, grenade_launcher, mine, smoke) | K | combat, overwatch (D), audio grouping |
| `category` | vocab | file tree (e.g. `small_arms/machine_gun/heavy_machine_gun`) | K | profiles |
| `tags` | vocab[] | `weapon_tags` | K | upgrades, abilities |
| `damage` | number | mean of `damage.min/max` | K | combat |
| `damage_type` | vocab | `damage.damage_type` | K | combat (resist) |
| `accuracy` | Band3 | `accuracy.near/mid/far` | K | combat |
| `penetration` | Band3 | `penetration.near/mid/far` | K | combat |
| `range_hex` | {min, max} | `range.min/max` ÷ 7 m, +1 for direct fire (SPEC §1) | C | combat, vision overlay |
| `band_end_hex` | {near, mid} | thirds rule; override for lobbed HE | D / O | combat |
| `fire_mode` | vocab direct · indirect · lobbed | from class / projectile / `artillery_force_obey_los` | D, O | combat |
| `shots_per_turn` | Band3 (whole numbers) | `aim`, `fire.wind_up/wind_down`, `burst.*`, `cooldown.*`, `reload.*` → cycle per band in a 6 s window, rounded | C | combat |
| `damage_per_shot` | Band3 | CoH3 damage; volley ÷ multiplier; single-shot round(damage × raw); artillery unchanged | C | combat |
| `shot_multiplier` | ratio | volley: CoH3 damage ÷ game damage per shot (suppression per shot scaled the same way) | C | combat, status |
| `accuracy_scale` | Band3 | artillery: CoH3 rate ÷ game rate (≤ 1); others 1 | C | combat |
| `reload_turns` | int | artillery slower than one shell per turn: floor(1 / raw) − 1; override allowed | C / O | turn, combat |
| `deflection_damage` | ratio | `deflection.deflection_damage_multiplier` (0 if `has_deflection_damage` false) | K | combat |
| `suppression` | {amount, nearby_mult, nearby_radius_m} | `suppression.amount`, `nearby_suppression_*` | K | status (morale FSM) |
| `aoe` | {damage Band3, distance_m Band3, suppression Band3, max_members, friendly_fire} | `area_effect.*`, `damage_max_members_per_squad` | K | combat |
| `scatter` | {angle_deg, distance_ratio, distance_max_m} | `scatter.*` (indirect / explosive only) | K | combat |
| `arc_deg` | number | `tracking.normal.max_left/right` | C | crew, combat |
| `emplace` | {required, setup_turns, teardown_turns} | `behaviour.non_moving_setup`; turns per decision D | K + O | crew (stance FSM) |
| `moving` | {can_fire, accuracy} | `moving.can_fire_while_moving`, `moving.accuracy_multiplier` | K | turn, combat |
| `vs_target` | {tag: Mods} | `target_type_table` | K | combat |
| `vs_cover` | {none, light, heavy, garrison, trench, smoke, water, negative: Mods} | `cover_table` (`tp_road_*` folded) | K | combat |
| `vs_suppressed`, `vs_pinned` | Mods | `suppression.target_*_multipliers` | K | combat |
| `height` | {advantage, disadvantage: Mods} | `height_bonuses` | K | combat |
| `persons` | number | — (SPEC §4 tank vs infantry) | A | combat |
| `trigger` | {on, targets} | mine data | K / A | combat (mines) |
| `ammo_per_shot` | int | — (default 1) | A | status (ammo) |
| `reveals_on_fire` | bool | `fog_of_war.reveal_self_on_attack` | K | vision (visibility FSM) |
| `traits` | vocab[] | `behaviour.piercing`, `can_damage_allies`, `hit_everything_on_*` | K | combat |

### 2.2 Shots per turn (decision K, approved with revisions)

Implemented in `tools/import-coh3/fire-rate.js` (tested), settings in `data/balance/fire-rate.json`,
full result for all 878 weapons in `reports/fire-rate.md`.

- One CoH3 magazine: `n = frequency + 1` shots (a burst counts every bullet);
  `time = n × (aim × aim multiplier + wind-up + wind-down + burst) + (n − 1) × cooldown + reload`, per band;
  `raw = shots per magazine / time × 6 s`. Ready-aim time is not counted (sustained rate).
- Expected damage per turn stays the CoH3 rate in every rule:

| Rule | Weapons | Shots per turn | Damage per shot | Other | Example |
| --- | --- | --- | --- | --- | --- |
| `volley` | small arms, MGs, flamethrowers, AA (260) | round(raw × CoH3 damage ÷ d) | whole d, largest within 5 % (≥ CoH3 ÷ 6) | suppression per shot × d ÷ CoH3 damage | Garand 13 / 9 / 7 at 3; Kar98k 5 / 4 / 4 at 5; MG42 90 / 74 / 64 at 4 |
| `single_shot` | tank guns, AT guns, infantry AT, tungsten rounds, small arms under 1 shot per turn (223) | 1 | round(CoH3 × raw) | — | Sherman 75 mm 125; 57 mm AT 202 / 201 / 199 |
| `artillery` | mortars, light and heavy artillery (245) | ceil(raw) shells, or 1 shell then `reload_turns = floor(1 / raw) − 1` | CoH3 (kept) | `accuracy_scale = raw ÷ game rate` (≤ 1) | 81 mm: 2 shells, acc ×0.89; 105 mm: 1 every 2 turns, acc ×0.83 |
| `ability` | CoH3 dummy artillery fired only by abilities (15) | 1 per use | CoH3 | — | 150 mm Hummel dummy |
| `per_use` | grenades, mines (135) | 1 per use | CoH3 | — | — |

- Result (whole numbers throughout): 868 of 878 weapons within 5 % of the CoH3 rate, 9 within 10 % (one 0-damage tracer off); artillery balance is then tuned by hand
  through `reload_turns`, `scatter` and `accuracy` overrides without touching shell damage.
- Infantry weapons are per model; a squad fires with every member carrying the weapon.

---

## 3. ebps.json (per faction; one entity = one soldier, vehicle, gun or building)

| Label | Type | CoH3 source | Code | Used by |
| --- | --- | --- | --- | --- |
| `id`, `coh3_ref`, `parent` | id | key, path, `parent_pbg` | K | build |
| `category` | vocab | file tree (`infantry`, `vehicles`, `team_weapons`, `emplacements`, `buildings`, `aircraft`) | K | profiles |
| `tags` | vocab[] | `type_ext.unit_type_list` | K | combat (`vs_target`) |
| `hp` | number | `health_ext.hitpoints` | K | combat, lifecycle |
| `target_size` | number | `health_ext.target_size` | K | combat |
| `armor` | Armor3 | `health_ext.armor_layout_option.front/side/rear_armor` | K | combat |
| `directional_damage` | Armor3 | `armor_layout_option.*_damage_multiplier` | K | combat |
| `resist` | {ballistic, explosive, flame, true} | `health_ext.armor_scaler_by_damage_type` | K | combat |
| `receives_cover` | bool | `health_ext.receive_weapon_cover_modifiers` | K / O (vehicles false, SPEC §4) | vision (cover) |
| `regen_per_turn` | number | `health_ext.regeneration` × 10 s | C | status |
| `cost` | Resources | `cost_ext.time_cost.cost` | K | economy |
| `build_turns` | int | `cost_ext.time_cost.time_seconds` → turns | C | economy, build |
| `move_hex` | int | `moving_ext.speed_scaling_table.max_speed` (3.6 m/s = 4 hexes) | C | movement |
| `pass` | vocab | `moving_ext.pass_type` | K | movement |
| `sight_hex` | int | `sight_ext.sight_package.outer_radius` ÷ 7 + 1 | C | vision |
| `detect_hex` | int | `sight_ext.detect_camouflage.tp_global` ÷ 7 | C | vision |
| `weapons` | [{weapon, mount, slot}] | `combat_ext.hardpoints[].weapon_table[]` → weapon ebp → `weapon_ext.weapon` | K | combat |
| `stealth` | {detected_hex, first_strike_shots, recloak_turns} | `camouflage_ext.detection_radius`, `first_strike_shots`, `combat_reset_time` → turns | C | vision (visibility FSM) |
| `hold` | {slots} | `hold_ext` | K | transport (location FSM) |
| `crew` | {roles, min} | `crew_ext.role_list`, `team_weapon_ext.role_list` | K | lifecycle |
| `recrew` | {by_faction: {squad}, min_crew, max_squad, manual_abandon, abandoned_on_spawn} | `recrewable_ext.race_list[].info.capture_squad_blueprint`, `min_capture_crew_size`, `recrew_max_squad_size`, `team_weapon_ext.can_manual_abandon`, `is_abandoned_on_spawn` | K | lifecycle (recrew) |
| `wreck` | {entity, cover, blocks} | `health_ext.wreck_entity_option.wreck_entities.default` | K + A | lifecycle (wrecks) |
| `criticals` | {table} | — (chances per vehicle class) | A (`data/rules/criticals.json`) | combat → lifecycle |
| `tow` | {by} | `towing_trailer_ext` | K | transport |
| `produces` | sbps id[] | `spawner_ext` | K | economy |
| `aura` | {heal_per_turn, radius_hex} | `aide_station_ext` | C | status |
| `construction` | {build_turns, footprint} | `construction_ext` | C + A | build |
| `traits` | vocab[] | `health_ext.can_repair`, `is_salvagable_wreck`, `paradrop_ext` … | K | various |

---

## 4. sbps.json (per faction; the unit you buy and command)

| Label | Type | CoH3 source | Code | Used by |
| --- | --- | --- | --- | --- |
| `id`, `coh3_ref`, `parent` | id | key, path, `parent_pbg` | K | build |
| `category` | vocab | file tree | K | profiles |
| `kind` | vocab squad · team_weapon · vehicle · structure | from category and members | D | every FSM |
| `tags` | vocab[] | `squad_type_ext.squad_type_list` | K | AI, UI |
| `role` | vocab | — | A | AI, UI |
| `members` | [{entity, count}] | `squad_loadout_ext.unit_list[].loadout_data.num/type` (team weapons: 1 weapon item + crew) | K | combat, lifecycle |
| `cost` | Resources | coh3stats squad total where present, else sum of member `cost` | K / D (`cost_override` A) | economy |
| `pop` | int | `squad_population_ext.personnel_pop` | K | economy |
| `requires` | {buildings, upgrades, cp} | `squad_requirement_ext.requirement_table` | K | economy |
| `reinforce` | {cost_ratio} | `squad_reinforce_ext.time_cost_percentage.cost_percentage` | K | economy |
| `capture` | {rate} | `squad_capture_strategic_point_ext.capture_rate_multiplier` | K / O (vehicles: none, SPEC §3) | capture |
| `build` | {menu: ebps id[]} | `squad_engineer_ext.construction_groups` | K | build |
| `supply` | {ammo} | — | A (decision G) | status (ammo) |
| `upgrades` | {slots, list} | `squad_upgrade_ext.number_of_slots`, `upgrades` | K | economy |
| `abilities` | id[] | `squad_ability_ext.abilities` + member `ability_ext` | K (ids only, decision J) | skills |
| `veterancy` | rank set id | `squad_veterancy_ext.veterancy_rank_info[].custom_properties` → `VETERANCY_PBG_n` | K | status |
| `traits` | vocab[] | `squad_ability_ext.squad_orders` (retreat, load …), `squad_paradrop_ext` | K | various |

---

## 5. veterancy.json (per faction; CoH3 `veterancy/<race>.json`, decision A)

| Label | Type | CoH3 source | Code |
| --- | --- | --- | --- |
| `id`, `coh3_ref` | id | key, path | K |
| `xp` | [n, n, n] | sbps `veterancy_rank_info[].veterancy_value` | K |
| `ranks` | [{modifier: value}] × 3 | `custom_property_bag.custom_float_properties[].id / value` | K (names mapped) |

**Modifier mapping (decision B).** The 20 supported CoH3 modifiers and the game stat each changes:

| CoH3 modifier | Burning Front stat | CoH3 modifier | Burning Front stat |
| --- | --- | --- | --- |
| `WEAPON_OVERALL_ATTACK_SPEED` (+ `_MULT_ADD`) | shots per turn | `UNIT_SIGHT_MODIFIER` | sight (m → hex) |
| `HEALTH_MODIFIER_ADDITION` | HP per member | `WEAPON_RANGE_MODIFIER` | range |
| `WEAPON_ACCURACY_MODIFIER` | accuracy | `SPEED_MODIFIER` | move hexes |
| `RECEIVED_ACCURACY_MODIFIER` | received accuracy | `WEAPON_PENETRATION_MODIFIER` | penetration |
| `RECEIVED_DAMAGE_MODIFIER` | received damage | `WEAPON_SCATTER` | scatter |
| `ABILITY_RECHARGE_MODIFIER` | ability cooldown | `DETECTION_VISION_MODIFIER(_SQUAD)` | detection |
| `WEAPON_DAMAGE_MODIFIER` (+ `_ADDITION_`) | damage | `CAPTURE_RATE_MODIFIER` | capture rate |
| `ABILITY_RANGE_(ADDITION_)MODIFIER` | ability range | `CONSTRUCTION_RATE_MODIFIER` | build speed |
| `WEAPON_SUPPRESSION_MODIFIER` | suppression dealt | `FRONT / SIDE_ARMOR_ADDITION` | armour |
| `ABILITY_COST_MUNITION_MODIFIER`, `GRENADE_COST_MODIFIER` | ability cost | `WEAPON_AOE_MAX_MEMBER_HIT_MODIFIER` | AoE member cap |

Ignored (listed in the import report): rotation / pivot rate, acceleration, horizontal traverse speed, burst duration and
burst rate (folded into attack speed), reinforce radius, capture revert rate, channel time, ability resource rates.

---

## 6. upgrade.json (per faction; CoH3 `upgrade/<race>.json` → `upgrade_bag`, decision C)

| Label | Type | CoH3 source | Code |
| --- | --- | --- | --- |
| `id`, `coh3_ref` | id | key, path | K |
| `category` | vocab | file tree (`infantry`, `vehicle`, `team_weapons`, `research`, `defense`) | K |
| `scope` | vocab unit · player | `owner_type`, `filter_conditions.apply_to_target_type` | K |
| `cost` | Resources | `time_cost.cost` | K |
| `build_turns` | int | `time_cost.time_seconds` → turns | C |
| `requires` | {upgrades, buildings} | `requirements[]` (`required_player_upgrade`, …) | K |
| `limit` | int | `local_max_limit` | K |
| `effects` | [{type, …}] | weapon kits: `requirements_to_complete[].ebps_name` → weapon; others: — | K (kits) / A |

Effect types (closed list): `add_weapon {weapon, members}`, `replace_weapon {from, to}`, `stat {target, stat, mult|add}`,
`add_ability {ability}`, `add_trait {trait}`, `unlock {sbps|upgrade}`. Not imported: `battlegroups`, `veterancy`,
`halftrack_deployment`, `items`, `ability`, `specialists` categories.

---

## 7. fx.json (per faction; looks, sound and names; no stats)

| Label | For | Source | Code |
| --- | --- | --- | --- |
| `name`, `short_name`, `desc` | weapon, ebps, sbps, upgrade | i18n keys into `data/i18n/ko.json` (decision F) | A |
| `icon` | ebps, sbps, upgrade | our SVG icon id | A |
| `portrait` | sbps | our portrait id | A |
| `model` | {id, sprite_scale, anim_class} | ebps | our code mesh id (legacy TankBaker ids as reference) | A |
| `menu` | {tab, order} | sbps | `ui_position` as starting order | C |
| `sound` | {fire, impact, move, death} | weapon (by `class`), ebps | cue ids grouped by weapon class | D / A |
| `effect` | {muzzle, tracer, impact, death} | weapon, ebps | effect ids by class and calibre | D / A |

CoH3 `fx_*`, `icon_name`, `anim_table`, `ui_info` locstrings and audio paths are never imported (IP, decision F).

---

## 8. abilities (later, decision J)

Only ability ids are carried in sbps for now. The ability form (cost, cooldown turns, range, target type, weapon or
effect) is designed with `logic/skills`; CoH3 `abilities/<race>.json` is already downloaded.

---

## 9. Shared types and closed lists

- Types: `Band3 {near, mid, far}`, `Resources {manpower, munition, fuel}`, `Mods {accuracy, damage, penetration, suppression}`,
  `Armor3 {front, side, rear}`; ids are CoH3 ids; text is an i18n key; units in the label name (`_hex`, `_turns`, `_m`, `_deg`).
- Closed lists in `data/rules/vocab.json`: weapon `class` (CoH3 `weapon_class` values), `damage_type`, unit `tags`
  (CoH3 `unit_type_list` values in use), `pass`, cover names, `fire_mode`, `kind`, `role`, `traits`, veterancy modifier names
  (§5), upgrade effect types (§6), state names of the six axes (`docs/unit-state.md`).

## 10. Next

On approval: D1-3 builds `data/rules/vocab.json` and the shared types with `tools/validate.js`; D1-4 the six schemas and
category profiles; D1-5 the importer pilot (no data enters the engine before the state model is implemented in D2).
