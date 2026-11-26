# data/balance/

Turn-based tuning, read by the tools through `tools/lib/config.js` (`loadConfig`):

- `scale.json` — game scale: metres per hex, seconds per turn, fire window, infantry speed → hexes, range and sight bonuses,
  emplace turns, wreck cover, engine HP / penetration scale. No tool may hard-code these.
- `fire-rate.json` — fire-rate rules (volley, single shot, artillery). The fire window comes from `scale.json`.
- `indirect.json` — indirect-fire classes, barrages, blind fire.
- `ammo.json` — ammunition per weapon class.

- Format: JSON
- Edited by: You, when balancing
- Data files hold numbers, ids and keys only — never functions, never display text (that goes in data/i18n).
