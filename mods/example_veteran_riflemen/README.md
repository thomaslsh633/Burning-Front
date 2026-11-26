# Example mod: veteran riflemen

Not enabled. To try it, add its id to `mods/load-order.json` and run `npm run build:data`:

```json
{ "enabled": ["example_veteran_riflemen"] }
```

| File | What it shows |
| --- | --- |
| `mod.json` | the manifest: `id` = folder name, `version`, `data_format` (must match `data/schema/index.json`), optional `load_after` |
| `units/american/weapon.json` | an **override**: only the changed field (Garand far accuracy 0.35 → 0.4) |
| `units/american/sbps.json` | a **new record**: a complete squad (`riflemen_veteran_us`), reusing the base entities and veterancy set |
| `units/american/fx.json` | the new squad's presentation entry (every record needs one) |
| `rules/vocab.json` | a **new word** in an existing list (`unit_trait`: `desert_veteran`), used by the new squad |
| `i18n/ko.json`, `i18n/en.json` | the new squad's **text** (a mod can also change existing text or add a language) |

The merged result is checked like the base data (schema, category profile, links). `reports/overrides.md` lists the
mod's changes next to the base values.
