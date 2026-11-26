# data/schema/

Field definitions for every data form (JSON Schema). The build checks every data file against them.

- Format: JSON Schema
- Edited by: You, when a form changes
- Data files hold numbers, ids and keys only — never functions, never display text (that goes in data/i18n).

Files: `types.schema.json` (shared types Band3, IntBand3, Resources, Mods, Armor3, Id, I18nKey, HexInt, Turns) and one
schema per data file; `index.json` maps each data file to its schema. Checked by `tools/validate.js` (JSON-Schema subset
plus `vocab`: a string must be in a list of `data/rules/vocab.json`), run by `npm run check`.
