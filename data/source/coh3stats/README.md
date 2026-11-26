# data/source/coh3stats/

Unit statistics calculated by [coh3stats.com](https://coh3stats.com) (explorer pages), trimmed. coh3stats builds them from
the same `cohstats/coh3-data` files as `data/source/coh3`; we use them for English names and descriptions, squad price /
population / build time, and as a cross-check of our conversions (`reports/coh3stats-compare.md`).

| File | coh3stats race | Contents |
| --- | --- | --- |
| `german.json` | german | multiplayer units (no `hoff_` records) |
| `american.json` | american | 〃 |
| `afrika_korps.json` | dak | 〃 |
| `british_africa.json` | british | 〃 (coh3stats has no data for our Italy set `british`) |
| `SOURCE.json` | — | site build id, fetch date, counts |

Per unit: `name`, `help`, `brief`, `loadout`, `cost` (squad total incl. `popcap`, `time_seconds`), `upkeep`, `pop`,
`reinforce`, `capture_rate`, `veterancy` (xp, text, modifiers), `entities` (HP, target size, armour, speed, sight, detect),
`weapons` (name, class, count, DPS curve `[metres, dps]`), `upgrades` (name, brief, cost), `abilities`.

Refresh: `NODE_USE_ENV_PROXY=1 node tools/coh3stats/fetch.js` (behind the HTTPS proxy). Never edit by hand.
