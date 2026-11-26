# D2 readiness review: modularity, chains, data editing, mods

Date 2026-11-26 · Scope: `src/` (structure only, no system code yet), `tools/` (data pipeline, 16 files, 1,810 lines),
`data/` (rules, balance, schemas, imported units), architecture docs.

## Verdict

| Question | Answer | Why |
| --- | --- | --- |
| Are systems modular and able to work alone? | **Yes, by design and enforced** | one folder per system, `index.js` as the only entry, layer direction and logic purity checked by `npm run check`; no system code exists yet to break it |
| Free of complex, interconnected chains? | **Yes, with two weak links** | no wrappers, import graph acyclic and at most 3 deep; but the importer depends on a report file and on the report builder |
| Can data be modified easily? | **Partly: editing yes, keeping edits no** | every value is plain JSON, schema- and word-list-checked; but re-running the importer overwrites `data/units` and loses hand edits |
| Does the environment support mods? | **No, not yet** | there is no layer where a mod's files sit next to the base data, no merge rule, no load order |

## 1. Modularity (systems work alone)

What is in place:
- One folder per system under `src/` with a README stating what it owns, its planned public API and what it must not do
  (33 systems + `logic/fsm`, `logic/lifecycle`, `presentation/greybox`).
- `tools/check-layers.js` (in `npm run check`) rejects: imports against the layer direction, imports of another system
  other than through its `index.js`, package imports, and DOM / storage / clock / `Math.random` in `logic/`.
- Unit behaviour is specified as six state machines, each owned by one system (`docs/unit-state.md` §7); rules read data
  passed in as arguments, so each system can be tested alone in Node.

What D2 must add to keep it that way:
- **No system writes another system's part of the state.** Each state axis has one owner; others send events or call the
  owner's public function. Proposed check: a test per system that its `apply` only changes the fields it owns.
- **No unit ids in rule code.** Rules decide by tags, traits, classes and flags from data (`data/rules/vocab.json`), never by
  `if (id === 'sherman_us')`. Proposed check: `check-layers` rejects string literals that match a squad / entity / weapon id
  in `logic/`.

## 2. Chains and coupling

- No wrapper chains, no monkey-patching, no load-order dependence (all ES modules).
- Import graph of `tools/` is acyclic; longest path 3 (`import.js → convert.js → fire-rate.js → indirect.js`).

Weak links found:

| # | Finding | Effect | Fix |
| --- | --- | --- | --- |
| C1 | `import.js`, `vocab/sync.js` and `coh3stats/compare.js` read `reports/catalog.json`, a generated report | hidden order: the catalog must be rebuilt before importing, or the import uses stale roster decisions | move roster selection into a pure `tools/coh3/roster.js` (source + `roster.json` → roster); the importer calls it; `catalog.js` only renders the report |
| C2 | `catalog.js` does four jobs: reference walking, roster decisions, pricing, report rendering | changing the report can change the import | same split as C1 |
| C3 | Helpers copied across files (`EXT` ×5, `avg` ×4, `r2` ×3, `last`, `isTrue`) | a fix in one copy misses the others | one `tools/lib/coh3.js` |

## 3. Data editing

What is in place:
- All numbers in plain JSON; every file has a schema (`data/schema/index.json`, 19 files checked), closed word lists,
  category profiles; balance values in `data/balance/` (fire rate, indirect fire, ammo).
- Reports explain every guessed, defaulted or dropped value (`reports/import/`).

Gaps:

| # | Finding | Effect | Fix |
| --- | --- | --- | --- |
| D1 | **The importer overwrites `data/units/<faction>/*.json`** | a designer's change is lost on the next import (breaks rule 7 of `docs/unit-data-format.md`) | split generated base from hand edits (§5) |
| D2 | Game scale lives in tool code: 7 m per hex, 3.6 m/s = 4 hexes, 10 s per turn, setup 1 turn, wreck = heavy cover, ammo fallback 20 | changing the scale means editing code | `data/balance/scale.json`, read by every tool |
| D3 | `data/i18n/` is empty; fx records point to keys that do not exist yet | names cannot be edited yet | `data/i18n/ko.json` (+ `en.json` reference from coh3stats names), link check in D8 |
| D4 | No check that ids referenced across files exist (members, weapons, upgrades, veterancy sets) | a typo in an id passes validation | link check (roadmap Phase 8) — bring forward into D2 as part of `services/data` loading |

## 4. Mods

Nothing exists yet. A mod needs:
1. **A place**: `mods/<mod_id>/` with the same layout as `data/` (`units/<faction>/*.json`, `rules/`, `balance/`, `i18n/`, `maps/`, `missions/`).
2. **A manifest**: `mods/<mod_id>/mod.json` (id, name, version, game version range, load order / dependencies).
3. **A merge rule**: records merged **by id**, deep-merged field by field; `null` deletes a field; a record `{ "remove": true }` removes it;
   new ids add units. Same rule as hand overrides (§5), so one loader serves both.
4. **The same checks**: schemas, profiles, word lists and link check run on the merged result, so a broken mod is rejected with a
   clear message instead of breaking the game.
5. **Extensible word lists**: a mod may add tags / traits / categories only through its own `rules/vocab.json` additions, which are
   validated and merged.
6. **No code in mods** (first version): mods change data only. Rules stay in `src/`; new behaviour comes from new traits and
   modules that the rules already understand. Scripted mods can come later through a defined hook list.
7. **Rules that read only data**: the "no unit ids in rule code" check (§1) is what makes data-only mods able to add units.

## 5. Proposed data layering (fixes D1 and enables mods)

```text
data/base/<faction>/*.json        generated by the importer from CoH3; never edited by hand (rewritten on import)
data/units/<faction>/*.json       designer changes: sparse records, only the fields that differ, merged by id
mods/<mod_id>/…                   mods, same layout as data/, merged in load order
            │ services/data (and a Node build step) merges: base → units → mods, then runs schema + profile + link checks
            ▼
data/generated/units.json         final values the game loads (never edited)
```

- The importer writes only `data/base`. A report lists every designer change that now differs from a fresh import
  (so a CoH3 patch never silently replaces a balance decision).
- Hand overrides and mods use one merge function in `services/data`, tested in Node.

## 6. Recommended order (before or at the start of D2)

All seven fixes are done (2026-11-26); the verdict questions above describe the state before them.

| Order | Work | Fixes | Status |
| --- | --- | --- | --- |
| 1 | `data/base` + `data/units` overrides + merge function + build step; importer writes base only | D1, mods §5 | done (4866636) |
| 2 | `data/balance/scale.json`; tools read it | D2 | done (e2ee940) |
| 3 | `tools/coh3/roster.js` (pure) and `tools/lib/coh3.js` (shared helpers) | C1, C2, C3 | done (e620247) |
| 4 | Link check in the merge step | D4 | done (4980f5a) |
| 5 | Mod manifest, `mods/` folder, load order, the same merge; an example mod (e.g. one changed weapon, one new unit) as a test | mods §4 | done (eded8aa) |
| 6 | `check-layers` rules: no unit-id literals in `logic/`; per-system ownership test pattern | §1 | done (6154bcb) |
| 7 | `data/i18n/ko.json` / `en.json` seeds | D3 | done (204a8fd) |
