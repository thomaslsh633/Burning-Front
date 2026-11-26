# Dev log

Newest first. One entry per finished task: done / next / blocked.

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
