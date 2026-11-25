# Dev log

Newest first. One entry per finished task: done / next / blocked.

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
