# Dev log

Newest first. One entry per finished task: done / next / blocked.

## 2026-11-28 (abilities)
- **Done:** importer `convertAbility` → `ability.json` (new unit-data kind, schema): 125 CoH3 abilities that fire a weapon
  with known shells; `logic/skills` (cooldowns, requirements, cost, the ability weapon); `UseSkill` route; combat fires an
  ability's weapons at a hex or a unit (`resolveAttack(…, use)`); greybox ability buttons; autoplay uses abilities.
  317 tests.
- **Not built:** buffs / toggles / passives (state trees), smoke, off-map strikes, barrages without published shells,
  ability names in i18n.
- **Next:** research (unlocks for ability requirements, doctrine / research lists) — needs the user's numbers.

## 2026-11-28 (fortified positions, paradrop, slots)
- **Done:** carried team weapons take 1 slot. Importer: build-menu positions with a CoH3 hold but no squad (fighting
  positions, bunker_ger, fighting_nest_ger …) become one-entity structure squads; trait `paradrop` from CoH3 paradrop call-ins
  (icon names the squad; `roster.paradrop` for the rest). `Build` command (`logic/build`, lifecycle `CONSTRUCTING`,
  `timers.build`); paradrop squads land anywhere. Autoplay garrisons, rides, unloads, builds and paradrops: 12 matches, no
  error. 313 tests.
- **Next:** ability import + `logic/skills`.

## 2026-11-28 (garrisons and transports)
- **Done:** importer reads CoH3 `hold_ext` into ebps `hold` (slots, heavy_weapons, survive_share) for transports and
  positions (num_slots ≥ 1000 rule leaves out tanks' tiny holds); `logic/transport` (location FSM, capacity, enter, exit,
  unload, stranded passengers); Garrison / Board / Exit / Unload commands; passengers ride with the vehicle; garrisoned units
  fire all round; greybox buttons and counts. 309 tests.
- **Next:** ability import + `logic/skills`.

## 2026-11-28 (autoplay 1v1s, weapon kits)
- **Done:** `tools/greybox/autoplay.js`: 12 whole capture 1v1s over 6 faction pairs by a scripted player, commands only:
  all end by tickets in 19–34 turns, no error, no invariant break. Found: roster clone never applied (free Australian supply
  truck, spammed) — fixed. Weapon kits: `Upgrade` command (CoH3 squad upgrades: cost, limit, requirements via
  `teams[t].unlocks`), one model fires the kit's weapon; greybox lists upgrades (`?unlock=all` for testing). 302 tests.
- **Not built (asked to test):** garrison / transport (load, carry, unload) — `logic/transport`; unit abilities —
  `logic/skills`, ability data not imported; research / doctrines (fill `unlocks`).
- **Next:** transport and garrison, then abilities (needs the ability import).
- **Blocked:** nothing.

## 2026-11-28 (greybox production and conversion, greybox map)
- **Done:** new map `data/maps/greybox` (from scratch, mirrored: HQ and every tier slot per side, VP / fuel / munition
  points, forest, bush, a raised hill, houses); the greybox opens it by default. Controller: tap an own HQ / tier building
  → its base units as buttons → tap a free hex beside it to produce; a selected unit lists its conversions (locked ones
  with the reason). Checked in Chromium. 298 tests.
- **Next:** G-6 on a real phone (pinch, Safari) and the data-review sign-off; then D3.
- **Blocked:** a real phone.

## 2026-11-28 (G-5 data fixes, camera, phone check)
- **Done:** ammo ×1.5; roles from CoH3 squad types (bazooka / AT squads, snipers, transports, HE support vehicles);
  spawn-granted weapons from coh3stats as squad `loadout_weapons` (bazooka team, Panzerjäger, Guards N. Africa,
  Stormtroopers …); splash cap −1 = whole squad (was no splash); zero-accuracy direct guns hit by scatter; recorded reasons
  for 20 squads (`data/balance/greybox.json` exceptions): 3 left flagged (Guards Italy loadout, Indian infantry, Brummbär
  as heavy artillery). Camera turn (60° steps) and zoom (buttons, wheel, pinch) with the angle fixed. Phone check in
  Chromium emulation (Pixel 7, iPhone 13, CPU ×4): load 0.4–0.5 s, redraw 15–21 ms on skirmish, 110 ms on Faymonville
  48×48; touch tap selects. 296 tests.
- Then: the last 3 flags — Brummbär as an `assault` indirect class (every turn, no spread: kills infantry in 2 turns),
  Guards (Italy) bazookas from a hand loadout (`data/rules/roster.json` loadout), Indian support infantry recorded. 0 flagged.
- **Next:** production / conversion in the greybox; a real-phone check (pinch, Safari).
- **Blocked:** a real phone and Safari are not available here.

## 2026-11-28 (quarter view)
- **Done:** greybox camera is a quarter view: map turned 45°, seen from 35° above the ground, raised hexes lifted with front
  faces, upright unit tokens with shadows, back-to-front drawing, taps mapped through the same projection (SPEC §9).
  Checked in Chromium. 293 tests.
- **Next:** G-5 decisions, G-6 phone check.
- **Blocked:** nothing.

## 2026-11-28 (G-2, G-3: greybox view)
- **Done:** `greybox.html` + `src/app/greybox.js` (fetches the game files listed by `services/data gameFiles`, starts a
  1v1 on a map), `presentation/input` (taps), `presentation/controller` (select, two-tap move / attack, end turn, emplace,
  pack, hold, retreat; refusals shown), `presentation/greybox` (Canvas 2D grey hexes, team discs with kind letter and HP,
  points, reachable hexes; debug panel with state axes, budget, weapons, attack preview). `node tools/greybox/serve.js`
  serves it (also to a phone on the same network). Checked in Chromium: select, move, end turn, no errors. 293 tests.
- **Next:** G-5 decisions (roles, ammo), G-6 phone check and playing 1v1s by faction pair; production / conversion
  buttons in the greybox.
- **Blocked:** the phone check needs the developer's phone.

## 2026-11-28 (G-4: time-to-kill report)
- **Done:** `tools/greybox/report.js` duels every armed squad (217) against 8 reference targets with the rules engine
  (200 seeds, 20 turns, mid-band range, open ground) → `reports/greybox/ttk.md`; criteria `data/balance/greybox.json`
  (TTK per role, time to pin for suppression). Shared loader `tools/lib/game-data.js`. 33 squads flagged. 290 tests.
- **Found:** ammo runs out in 140 of 217 squads' 20-turn duels (`data/balance/ammo.json` looks small); many flags are
  importer role guesses (transports / recon vehicles as suppression, assault guns as all-round, bazooka team, officers,
  scouts, snipers as anti-infantry); 105 mm guns and the Stummel do not kill infantry within 20 turns.
- **Next:** decide roles / ammo (G-5); greybox view (G-2, G-3).
- **Blocked:** nothing.

## 2026-11-28 (G-1: all four factions imported)
- **Done:** `import.js <faction> --all` imports every roster squad: 287 squads (US 72, Wehrmacht 66, DAK 52, British 97).
  The importer skips CoH3 placeholder weapons, drops weapon links nothing imported, leaves out squads whose records fail
  their profile (9, reported) and their orphan entities; veterancy is optional for squads; recrewable vehicle variants are
  out of the roster; identical records shared by two factions are fine. English names seeded (+627). New gate test
  `tests/integration/all-units.test.js`: every squad is created, moves, fires and dies. 288 tests.
- **Next:** G-4 TTK report (`tools/greybox/report.js`, `data/balance/greybox.json`), then the greybox view (G-2, G-3).
- **Blocked:** 48 squads cannot fire until barrages / abilities exist; Korean text for 1409 keys.

## 2026-11-28 (production per faction, three unlock kinds)
- **Done:** `production.json` per faction; each building's units are base / doctrine / research (doctrine = CoH3 call-ins
  and coh3stats-only battlegroup units, doctrine conversions; research = heroes, heavy armour, pricier variants, research
  conversions); HQ only base engineers and recon; conversions carry `unlock` and the CoH3 battlegroup. Report by faction →
  building. 287 tests.
- **Next:** stage G; doctrines and research need a design and numbers.
- **Blocked:** nothing.

## 2026-11-28 (production by tier)
- **Done:** map production types are tier slots (`hq`, `t1`–`t3`, branches `t2a` …) per faction; no doctrine buildings;
  the HQ makes only engineers and recon; non-production units placed by CoH3 tier tag, then resemblance; research-locked
  conversion targets locked in production too (Sturmpioneer, 251/16). `reports/production.md` regenerated. 288 tests.
- **Next:** stage G.
- **Blocked:** nothing.

## 2026-11-28 (decisions on the status report)
- **Done:** pinned units no counter fire; retreat arrival at turn start keeps the action; recrew any squad size; capture
  = sum of squads' CoH3 capture rates (steps separate); building classes; tier buildings 1000 / 1375, HQ 2000 HP, armour 35
  (a Sherman needs 8 / 11 / 16 hits, tested). 285 tests.
  Then the remaining open items with my values: neutral buildings 625 / 1000 / 1375 / 2000 HP, armour 35; explosives at
  full damage on map features; Crusader III 45 munitions; M29 Weasel in the US Tier 2 building. 286 tests.
- **Next:** stage G; research needs numbers.
- **Blocked:** nothing.

## 2026-11-26 (buildings destructible, HQ rebuild, status report)
- **Done:** every building destructible in every mode (HQ 3000, production buildings 1500 / 2000 HP, CoH3); map production
  buildings compiled as structures; a destroyed HQ stops base income, HQ production and its supply link; `Rebuild` of the
  HQ by engineers (`logic/build`). Capture mode still won by tickets. Status report `docs/reviews/status-2026-11-26.md`.
  282 tests.
- **Next:** decisions in the status report; stage G.
- **Blocked:** nothing.

## 2026-11-26 (annihilation HQ, conversions)
- **Done:** annihilation is won by destroying the enemy HQ or eliminating every enemy unit (HQ capture and "cannot deploy"
  dropped; HQ destructible in annihilation mode only). `Convert` command and `data/rules/conversions.json` (23 CoH3 field
  conversions; battlegroup / global ones need research); conversion-only squads left out of production. 279 tests.
- **Next:** stage G; research and the weapon-upgrade system need numbers and a design.
- **Blocked:** nothing.

## 2026-11-26 (D2-9, D2 exit gate)
- **Done:** production rules (non-production units produced directly, research only for high tier, support vehicles in
  Tier 2); v214 maps recorded as reference only. D2-9 `logic/victory`: Victory Meter (VP-lead bleed, momentum, parity
  tiebreak), annihilation (no units + cannot deploy, round cap), `data/balance/victory.json`; the victory slot of the turn
  start. D2 exit gate: `tests/integration/match.test.js` plays an annihilation and a capture match to the end through
  `store.dispatch` only. 275 tests.
- **Next:** stage G (greybox); decide when to build `logic/build`, research and the annihilation HQ.
- **Blocked:** nothing.

## 2026-11-26 (rule decisions, D2-8)
- **Done:** decisions: vehicles never abandoned or captured (ABANDONED removed), crewless guns are targets for every side
  (wreck at 0 HP, no XP), reload timers block fire and counter fire, pickups limited to upgrade / slot weapons (not built).
  D2-8: `logic/capture` (strength ticks, contest, sector supply), `logic/economy` (income, upkeep, `Produce`),
  `data/balance/economy.json`, `data/rules/production.json`. 263 tests.
  Follow-up: capture per squad, map point yield override, production generated from CoH3 spawner data
  (`tools/coh3/production.js`), HQ produces, population cap 300. Then: non-production units produced directly, research
  only for high-tier units, support vehicles in Tier 2. 269 tests.
- **Next:** decide when to build `logic/build`; D2-9 victory and the full-match integration test.
- **Blocked:** `logic/build` waits for the build-menu entities (stage G import).

## 2026-11-26 (D2-7 turn flow, reactions, recrew)
- **Done:** turn phases in `logic/commands/phases.js` (per-unit hooks in axis order, SPEC §2 side phases with empty slots for
  strikes / capture / victory / income), `EndTurn` and `StartMatch` commands, match clock in `logic/turn`; counter fire
  (one per enemy turn, armed at the enemy turn start, vetoed like a command named `Counter`); MG overwatch (`Hold`, move
  hook, stop on death / pin, no undo after a reaction); engaged (status) and turret return (movement); crew shock cleared
  after the turn it cost; `Recrew` (team weapons, own or enemy), `Abandon` (crew becomes its own unit beside the gun; a
  crew without its gun fights with small arms), `ClearWreck` (engineer role, `clear_turns`). New `data/balance/turn.json`,
  wreck `clear_turns` and `wreck_clearing` in `data/rules/terrain.json`. Unit fields: `engaged` (status), `sbps` owned by
  lifecycle. 247 tests.
- **Next:** D2-8 `logic/capture`, `logic/economy`, `logic/build`.
- **Blocked:** nothing; open questions in `docs/handover.md` §5.

## 2026-11-26 (D2-1 … D2-6, map design)
- **Done:** D2-1 `logic/hex`, `services/rng`; D2-2 `fsm`, `events`, `state`, `commands`, `store`, `services/data indexUnits`;
  D2-3 `movement` + action budget (`data/rules/terrain.json`, `data/balance/movement.json`); D2-4 `vision` (sight lines,
  concealment, cover per shot); D2-5 `combat` (preview = resolve, checked over 300 seeds); D2-6 `crew`, `status`
  (suppression, retreat, veterancy), `lifecycle` deaths and criticals. Attack / Move / Turn / Emplace / Pack / Retreat
  routes. 187 tests.
- **Proposal:** `docs/map-design.md` — map audit (ground and objects are split in the rules, but map objects have no
  identity or state, buildings are terrain, static map and match changes are mixed); linear obstacles as polylines
  compiled to hex edges (candidate B); map layers and a new `logic/terrain` folder.
- **Next:** decisions in `docs/map-design.md` §4; then D2-7 (turn order, counter fire, MG overwatch, recrew).
- **Blocked:** waiting for the map decisions.

## 2026-11-26 (D2 readiness fixes 1–7)
- **Done:** (1) data layers: importer writes `data/base`, designers override in `data/units`, `npm run build:data` merges
  by id into `data/generated/units.json`; (2) game scale in `data/balance/scale.json`, read only through
  `tools/lib/config.js`; (3) pure `tools/coh3/roster.js` and shared `tools/lib/coh3.js`, nothing reads `reports/` as input;
  (4) link check on the merged data (`tools/data-links.js`), carried team weapons as `team_weapon.weapon`, squad
  upgrades split into imported `list` and `pending`; (5) mods: `mods/load-order.json`, manifest, same merge and checks,
  example mod (not enabled); (6) `check-layers` rejects unit ids in `logic/`, unit field owners in
  `src/logic/state/ownership.js` + `assertOwnsOnly` test helper; (7) `data/i18n/ko.json` (hand-written) and `en.json`
  (CoH3 names + hand-written gaps) cover all 85 keys in use, merged with mod text into `data/generated/i18n.json`.
  Generated unit values unchanged by fixes 2–3; 106 tests.
- **Next:** D2 rules engine (hex, fsm, state, events, commands, store …), each system's apply test ending with
  `assertOwnsOnly`.
- **Blocked:** nothing.

## 2026-11-26 (D1-5 importer pilot)
- **Done:** `tools/import-coh3/convert.js` (weapon, entity, squad, veterancy, upgrade conversions, profile-driven module
  filter, weapon-flag tests) and `import.js` (follows sbps → ebps → weapons, kits, veterancy, fx stubs). Pilot: 6 US and
  6 German squads (infantry, tank, AT gun, mortar, HMG team, MG emplacement) → `data/units/{american,german}` (12 files, in
  `npm run check` with profiles). Reports `reports/import/`. Matches v214 on cost / HP / move / sight (AT gun HP is the gun
  entity's in CoH3). New: `data/balance/ammo.json`, weapon category `smoke`, `any_upgrades`.
- **Fixed during the pilot:** move from default speed; role guessing; upgrade alternatives on hardpoints; indirect accuracy from
  scatter; common veterancy file; all-of vs any-of upgrade requirements.
- **Next:** D2 rules engine (hex, fsm, state, events, commands, store …). Stage G imports all four factions later.

## 2026-11-26 (D1-4 schemas and profiles; Greybox stage)
- **Done:** six unit-data schemas (`data/schema/{weapon,ebps,sbps,veterancy,upgrade,fx}.schema.json`: core + modules, shared
  types, vocab-checked words and keys), category profiles `data/schema/profiles.json` (17 weapon, 6 entity, 6 squad
  categories), `tools/profiles.js`, validator keyword `propertyVocab`, hand-written samples for every category
  (`tests/fixtures/forms`). Gate passed: samples valid; a mine with attack, a mortar without scatter, a capturing vehicle,
  wrong words / shapes rejected. Files grouped one level by category (decision V). Vocab: `mine`, `aircraft` added by hand.
- **Plan:** stage **G Greybox play** inserted after D2 (rules engine) and before D3 (first screen): all four factions
  imported, art-free Canvas view with debug numbers, automatic time-to-kill report, data sign-off. D6 becomes balance tuning.
- **Next:** D1-5 importer pilot (one unit per category from CoH3 into the new forms).

## 2026-11-26 (D1-3 word lists and validator)
- **Done:** `data/rules/vocab.json` (31 lists: CoH3 weapon classes 25, damage types 4, unit tags 113, pass 8, plus game
  lists — states of the six axes, status flags, weapon traits, unit traits, roles, cover, fire modes / rules, indirect
  classes, upgrade effects …; veterancy modifier mapping 20 used / 18 ignored). `tools/vocab/sync.js` keeps CoH3 lists
  complete. `data/schema/types.schema.json` + schemas for the 6 rule / balance files, `data/schema/index.json`.
  `tools/validate.js` (no dependencies, tested). `npm run check` = layers + data + vocab coverage.
- **Next:** D1-4 schemas for weapon / ebps / sbps / veterancy / upgrade / fx and the category profiles.

## 2026-11-26 (minimum range, counter-barrage)
- **Done:** indirect minimum range (scaled CoH3 min, class floors), rocket volley cap 3, blind fire beyond sight
  (CoH3 fog multipliers, +1 spread), counter-battery `sound_ranged` hexes (no blind penalty). SPEC §10, status flags, labels.

## 2026-11-26 (indirect fire for turn play)
- **Done:** `data/balance/indirect.json` + `tools/import-coh3/indirect.js` (tested): one volley every N turns per class
  (mortar / SPG / light 1, heavy / rocket 2), shells from the CoH3 rate over N turns (fewer shells for faster cadence),
  CoH3 shell damage, accuracy carries rounding, range capped (12–18 hexes), spread 0 / 1 / 2 hexes. Applied to normal fire
  (fire-rate rule) and barrage abilities (`reports/barrages.md` game columns).
- **Next:** D1-3 vocab and validator.

## 2026-11-26 (barrages, heroes, flags)
- **Done:** `tools/coh3/barrages.js` → `reports/barrages.md`: 284 barrage abilities, 246 with weapon data, 153 with
  shells × damage, 38 off-map (shells not published in coh3-data). Heroes included and unique (6). Weapon operation flags
  `data/rules/weapon-flags.json` (from 1033 weapons' behaviour). Status flags `data/rules/status-flags.json` (37).
- **Open:** CoH3 barrage ranges are long for our maps (105 mm 300 m = 43 hexes); off-map strike shells to set by hand.
- **Next:** D1-3 vocab (incl. these flag ids and state names) and validator.

## 2026-11-25 (coh3stats)
- **Done:** `tools/coh3stats/fetch.js` → `data/source/coh3stats` (224 multiplayer units: names, squad totals, entities,
  weapon DPS curves, veterancy, upgrades). Catalog: every named coh3stats unit added (+6 german, +11 american, +8 afrika_korps),
  English names, price / pop / time from coh3stats. `tools/coh3stats/compare.js` → `reports/coh3stats-compare.md`.
- **Found:** fire-cycle formula matches coh3stats DPS within ~6 % for rifles, MGs and tank guns; AT gun gap explained
  (coh3stats DPS is vs infantry, ×0.25); snipers / Boys / 20 mm unexplained; some squad prices below entity sums (340 vs 360).
- **Note:** Node `fetch` needs `NODE_USE_ENV_PROXY=1` behind this proxy (DNS fails otherwise).
- **Next:** D1-3 vocab and validator.

## 2026-11-25 (all British North Africa units)
- **Done:** all 18 remaining `british_africa` squads restored (Indian infantry, SAS, Commandos, medic, officer, sniper,
  Crusader 57 mm, Priest, Marmon-Herrington, Sherman, command Churchill, CWT trucks …); Australian supply truck cost cloned
  from the CWT 15 flatbed. British North Africa: 73 units, 113 weapons, 0 excluded.
- **Blocked:** coh3stats.com is outside this environment's network rules; the same data comes from coh3-data, already pinned.
- **Next:** D1-3 vocab and validator.

## 2026-11-25 (whole numbers, British sets, roster)
- **Done:** whole numbers: small arms choose whole damage per shot and whole shots together; single-shot damage rounded.
  `british_africa` downloaded (35 files); `data/rules/roster.json` (British per theatre, 9 restored v214 units, clones,
  doctrine unlock). Catalog now finds references in every race's files: british · north_africa 55 units (Gurkhas,
  Commandos, Matilda, Crusader, Grant …), german 68, american 64, afrika_korps 44, british · italy 32.
- **Open:** 18 British North Africa squads still unreferenced (Indian infantry, Crusader 57 mm, Priest, SAS …).
- **Next:** D1-3 vocab and validator.

## 2026-11-25 (unit catalog)
- **Done:** `tools/coh3/catalog.js` → `reports/catalog/`: per faction the cleaned list of units (squads kept when produced,
  built, spawned by an upgrade or called in), members with HP, weapons, equipment with cost and granted weapon, weapons in use
  with fire-rate values, excluded records with v214 flags. german 58 · american 61 · afrika_korps 44 · british 30 units.
  Values to two decimals (single-shot damage). Fixed: upgrade records were not recognised by the record walker.
- **Found:** CoH3 `british` lacks the North Africa British (Matilda, Crusader, Grant, Indian, Gurkha, Commando);
  they are in `british_africa` (73 squads).
- **Next:** decide british vs british_africa; then D1-3 vocab and validator.

## 2026-11-25 (fire rate revised)
- **Done:** small arms use a shot multiplier (≤ ×6, 5 % tolerance) with damage and suppression ÷ multiplier; artillery keeps
  CoH3 shell damage, rounds its rate up and scales accuracy (reload / scatter / accuracy for further balance); dummy artillery
  is ability-only. All 878 weapons within 6 % of the CoH3 rate (`reports/fire-rate.md`). SPEC §10 and data-labels updated.
- **Next:** D1-3 vocab (incl. state names, rules) and `tools/validate.js`.

## 2026-11-25 (decisions approved, fire rate)
- **Done:** decisions A–J and recrew / capture approved and recorded (SPEC §10, data-labels, unit-state §6). Fire rate (K, revised):
  `tools/import-coh3/fire-rate.js` + tests, `data/balance/fire-rate.json`, report over 878 weapons in `reports/fire-rate.md`.
- **Found:** rounding ordinary weapons moves 185 of 478 more than 10 % off their CoH3 rate (Kar98k mid 1.44 → 1).
- **Next:** decide whether rounded weapons also get the damage correction; then D1-3 vocab and validator.

## 2026-11-25 (data labels)
- **Done:** overwatch narrowed to emplaced machine-gun teams (SPEC §10, unit-state §5.1.1). `docs/data-labels.md`: decisions
  (8 decided, 11 to decide) and the label list for weapon, ebps, sbps, veterancy, upgrade, fx, with CoH3 source paths and
  keep / convert / add / override / derived codes. Findings: upgrade effects live in CoH3 state trees (only weapon kits are
  readable); HMG / mortar teams are a carried weapon item + crew, AT guns / howitzers are entities with `recrewable_ext`.
- **Next:** decisions A–K approved → D1-3 vocab and validator.
- **Blocked:** nothing.

## 2026-11-25 (architecture before data)
- **Done:** `docs/unit-state.md`: layers, generic FSM, unit runtime state, six state axes with owners, recrew / capture
  design from CoH3 `recrewable_ext`. SPEC §10: overwatch for machine guns only, CoH3 as data authority (v214 reference only),
  state model, recrew design. New system folders `logic/fsm`, `logic/lifecycle`.
- **Next:** approval of the recrew design; then D1-3 vocab (incl. state names) and validator.
- **Blocked:** wikidocs.net is outside this environment's network rules, so the referenced page was not read.

## 2026-11-25
- **Done:** D0-1 SPEC §10 combat rules for the rewrite. D0-2 `tools/oracle/snapshot.js` → `data/legacy-snapshot/`
  (79 units spawned, rules, veterancy, doctrines, skirmish and Faymonville maps). D1-1 `tools/coh3/fetch.js` → CoH3
  `data/chunked` for german, american, afrika_korps, british, common (30 files, 160 MB, commit `49fc4dbc`).
  D1-2 `tools/coh3/census.js` → `data/source/coh3/CENSUS.md`; profiles corrected in `docs/data-form-roadmap.md`.
- **Next:** D1-3 `data/rules/vocab.json`, shared types and `tools/validate.js`; then D1-4 schemas and profiles; D1-5 importer pilot.
- **Blocked:** nothing.
