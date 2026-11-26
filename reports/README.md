# reports/

Generated review reports (never edited by hand, never read by a tool as input). Regenerate with the command named at the top of each report.

- `fire-rate.md` / `.json`: CoH3 weapon timings → whole shots per turn and damage per shot (`node tools/import-coh3/fire-rate-report.js`).
- `catalog/README.md` (summary), `catalog/<faction>.md`: the cleaned unit list per faction — squads → members → weapons, equipment (upgrades) with cost and granted weapon, weapons in use with fire-rate values, excluded records (`node tools/coh3/catalog.js`; the roster decisions themselves are `tools/coh3/roster.js`).
- `coh3stats-compare.md` / `.json`: coh3stats.com statistics vs our data — roster, squad price, entity stats, fire rate vs coh3stats DPS (`node tools/coh3stats/compare.js`).
- `barrages.md` / `.json`: barrage and indirect-fire abilities with CoH3 attack power (weapon × shells, recharge, range, radius, cost) (`node tools/coh3/barrages.js`).
- `import/<faction>.md`: what the importer guessed, defaulted or dropped per record, and v214 values for reference (`node tools/import-coh3/import.js <faction> [squad …]`).
