# data/units/

**Designer overrides** of the generated base data (`data/base/<faction>/`). Same file names and layout, but a record holds
only the fields you change; everything else comes from the base. `npm run build:data` merges base → these overrides → mods
into `data/generated/units.json`, and `reports/overrides.md` lists every override next to the base value.

Merge rules (by id): objects merge field by field; arrays are replaced; `null` deletes a field; `{ "remove": true }` deletes
the record; a new id adds a complete record; a record written under a different category moves there.

Example — `data/units/american/weapon.json`:

```json
{ "rifle": { "garand_rifleman_us": { "attack": { "accuracy": { "far": 0.4 } } } } }
```
