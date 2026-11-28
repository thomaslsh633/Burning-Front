# reports/

Generated review reports (never edited by hand, never read by a tool as input). Regenerate with the command named at the top of each report.

- `fire-rate.md` / `.json`: CoH3 weapon timings → whole shots per turn and damage per shot (`node tools/import-coh3/fire-rate-report.js`).
- `catalog/README.md` (summary), `catalog/<faction>.md`: the cleaned unit list per faction — squads → members → weapons, equipment (upgrades) with cost and granted weapon, weapons in use with fire-rate values, excluded records (`node tools/coh3/catalog.js`; the roster decisions themselves are `tools/coh3/roster.js`).
- `coh3stats-compare.md` / `.json`: coh3stats.com statistics vs our data — roster, squad price, entity stats, fire rate vs coh3stats DPS (`node tools/coh3stats/compare.js`).
- `barrages.md` / `.json`: barrage and indirect-fire abilities with CoH3 attack power (weapon × shells, recharge, range, radius, cost) (`node tools/coh3/barrages.js`).
- `overrides.md`: every designer or mod override next to the base value; `data-links.md`: links to things not imported yet and text keys with no text per language (`node tools/build-data.js`).
- `greybox/ttk.md` / `.json`: time to kill — every armed squad vs the reference targets of `data/balance/greybox.json` in duels with the real rules engine, flags outside the criteria (`node tools/greybox/report.js [seeds]`).
- `production.md`: every unit and the building that produces it (start or research), plus field conversions (`node tools/coh3/production.js`).
- `maps/legacy-import.md`: what the v214 map conversion left out (`node tools/maps/import-legacy.js`).
- `import/<faction>.md`: what the importer guessed, defaulted or dropped per record, and v214 values for reference (`node tools/import-coh3/import.js <faction> [squad …]`).
