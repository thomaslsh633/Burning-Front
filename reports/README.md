# reports/

Generated review reports (never edited by hand). Regenerate with the command named at the top of each report.

- `fire-rate.md` / `.json`: CoH3 weapon timings → whole shots per turn and damage per shot (`node tools/import-coh3/fire-rate-report.js`).
- `catalog/README.md` (summary), `catalog/<faction>.md`, `catalog.json`: the cleaned unit list per faction — squads → members → weapons, equipment (upgrades) with cost and granted weapon, weapons in use with fire-rate values, excluded records (`node tools/coh3/catalog.js`).
