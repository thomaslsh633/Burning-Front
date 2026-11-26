# data/rules/

Terrain types, cover levels (and the CoH3 tp_* → cover mapping), buildings, fortifications, CP milestones, capture and income rules, and the closed vocabularies (tags, traits, event triggers).

- Format: JSON
- Edited by: You
- Data files hold numbers, ids and keys only — never functions, never display text (that goes in data/i18n).
- `roster.json`: faction → CoH3 data sets per theatre, units restored from v214, clones for units without CoH3 data, how battlegroup units unlock.
- `weapon-flags.json`: weapon operation rules and special action flags from CoH3 `behaviour` (used / ignored).
- `status-flags.json`: unit status flags, stored or derived, owner system, clears, HUD priority.
- `production.json`: squads each production building type offers, per faction (pilot lists).
