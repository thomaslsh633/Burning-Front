# Dev log

Newest first. One entry per finished task: done / next / blocked.

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
