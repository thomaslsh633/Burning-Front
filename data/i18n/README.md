# data/i18n/

Every player-visible string: unit, weapon and terrain names, UI labels, log templates. One file per language,
`{ "strings": { key: text } }`; keys are `<kind>.<id>.<field>` for data records (the fx entries name them) and `ui.*` /
`log.*` for the interface.

- `ko.json` — Korean, the game's main language. Written by hand.
- `en.json` — English. Unit, weapon and upgrade names start from CoH3's English names: `node tools/i18n/seed.js` adds the
  keys in use that `en.json` lacks (from coh3stats) and never overwrites. CoH3 leaves crew members and many vehicle
  weapons unnamed; those are written by hand.
- `npm run build:data` merges these files with each enabled mod's `i18n/<lang>.json` into `data/generated/i18n.json`
  and lists, per language, the keys in use that have no text (`reports/data-links.md`). The game falls back to English,
  then to the key itself.
- Edited by: You. Data files hold numbers, ids and keys only — never display text (that goes here).
