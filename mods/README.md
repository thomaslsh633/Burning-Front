# mods/

A mod is a folder here. It can change unit values, add new units, weapons or upgrades, remove records, and add words
to the closed word lists. It uses the same files and merge rules as designer overrides (`data/units/README.md`).

```text
mods/
  load-order.json                 { "enabled": ["mod_a", "mod_b"] }   first loaded first; later mods win
  <id>/
    mod.json                      id (= folder name), name, version (1.2.3), data_format, load_after (optional)
    units/<faction>/<kind>.json   weapon, ebps, sbps, upgrade, veterancy, fx — only the fields you change, or whole new records
    rules/vocab.json              { "lists": { "<existing list>": ["new_word"] } }
    i18n/<lang>.json              { "strings": { "unit.<id>.name": "…" } }  text for new records, changed text, or a new language
    README.md                     optional
```

`npm run build:data` merges `data/base` → `data/units` → each enabled mod, then checks the result exactly like the
base data: schema, category profile, word lists, links. Any error stops the build and names the mod. The build
also rejects:

- a mod whose `data_format` differs from `data/schema/index.json` (the data forms changed since it was written);
- a mod listed before a mod named in its `load_after`;
- an unknown faction folder or file name (`weapons.json` instead of `weapon.json`), which would otherwise be ignored;
- a word list a mod invents (mods can add words, not lists).

`reports/overrides.md` lists every field a mod changes next to the base value.
`example_veteran_riflemen/` shows one of each change; it is not enabled.
