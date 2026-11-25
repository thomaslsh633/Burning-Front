# data/source/coh3/

Raw CoH3 game data from [cohstats/coh3-data](https://github.com/cohstats/coh3-data) `data/chunked`, untouched,
pinned to one commit (see `SOURCE.json`: commit, date, every file's size and sha256).

| Folder | From `data/chunked/` | Contents |
| --- | --- | --- |
| `weapon/` | `weapon/<race>.json` | weapon blueprints (weapon_bag) |
| `ebps/` | `ebps/races/<race>.json` | entity blueprints (one soldier, vehicle, gun, building) |
| `sbps/` | `sbps/races/<race>.json` | squad blueprints (the unit you buy) |
| `upgrade/` | `upgrade/<race>.json` | upgrades (weapon kits, etc.) |
| `veterancy/` | `veterancy/<race>.json` | veterancy rank modifiers |
| `abilities/` | `abilities/races/<race>.json` | abilities (grenades, barrages, …) |

Races: `german` (Wehrmacht), `american` (US Forces), `afrika_korps` (Afrikakorps), `british` (British Forces), `common` (shared).

- Download / re-download the pinned commit: `node tools/coh3/fetch.js` (needs git and network)
- Move to the newest data: `node tools/coh3/fetch.js --latest` (then review what changed)
- Check the files offline: `node tools/coh3/fetch.js --verify`

Never edit these files. Burning Front's own values live in `data/units/` and are derived from these by the importer.
