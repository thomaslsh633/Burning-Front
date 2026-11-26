# data/units/

**Designer overrides** of the generated base data (`data/base/<faction>/`). Same layout — `<faction>/<squad id>/<kind>.json`
or `<faction>/shared/<kind>.json` (a file directly in `<faction>/` also works) — but a record holds only the fields you change; everything else comes from the base. `npm run build:data` merges base → these overrides → mods
into `data/generated/units.json`, and `reports/overrides.md` lists every override next to the base value.
The merged result is checked like the base: schema, category profile, and links (`tools/data-links.js`): an override that
names a missing weapon, entity, upgrade or veterancy set, or removes a record others still use, fails the build.

Merge rules (by id): objects merge field by field; arrays are replaced; `null` deletes a field; `{ "remove": true }` deletes
the record; a new id adds a complete record; a record written under a different category moves there.

A record id may appear in only one file of this layer; which folder you use does not change the result (merge is by id).

Example — `data/units/american/riflemen_us/weapon.json`:

```json
{ "rifle": { "garand_rifleman_us": { "attack": { "accuracy": { "far": 0.4 } } } } }
```
