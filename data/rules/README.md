# data/rules/

Terrain types, cover levels (and the CoH3 tp_* → cover mapping), buildings, fortifications, CP milestones, capture and income rules, and the closed vocabularies (tags, traits, event triggers).

- Format: JSON
- Edited by: You
- Data files hold numbers, ids and keys only — never functions, never display text (that goes in data/i18n).
- `roster.json`: faction → CoH3 data sets per theatre, units restored from v214, clones for units without CoH3 data, how battlegroup units unlock (doctrine lists in production.json).
- `weapon-flags.json`: weapon operation rules and special action flags from CoH3 `behaviour` (used / ignored).
- `status-flags.json`: unit status flags, stored or derived, owner system, clears, HUD priority.
- `conversions.json`: unit conversions (blueprint changes bought in the field), cost, unlock (base / doctrine / research) and the CoH3 battlegroup.
- `doctrines.json`: per faction, the CoH3 battlegroups with their units and upgrades (written by `node tools/coh3/doctrines.js`); hand `aliases` (conversion battlegroup names) and `assign` (units CoH3 places in no battlegroup).
- `research.json`: per faction and CoH3 building, what it researches (CoH3 upgrades that abilities / kits need, research units), cost, turns; written by `node tools/coh3/research.js` after `npm run build:data`.
- `production.json`: per faction, map tier slot (`hq`, `t1`–`t3`, branches `t2a` …) → its CoH3 production building (`slots`, hand-edited) and its Tier 2 building (`tier2`); each building's base / doctrine / research units (written by the tool); hand overrides `place`, `unlock`.
