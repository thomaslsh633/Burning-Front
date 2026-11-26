// Category profiles (data/schema/profiles.json): which modules a record of a given category must, may or must not have.
// A record's modules are the keys listed in profiles.<kind>.modules; everything else in the record is core.

/** Errors (strings) for one record of `kind` in `category`. */
export function checkProfile(profiles, kind, category, record) {
  const p = profiles[kind];
  const prof = p?.categories?.[category];
  if (!prof) return [`no profile for category "${category}"`];
  const present = Object.keys(record).filter(k => p.modules.includes(k));
  const errors = [];
  for (const m of prof.must) if (!present.includes(m)) errors.push(`missing module "${m}" (must for ${category})`);
  for (const m of present) {
    if (prof.must_not.includes(m)) errors.push(`module "${m}" not allowed for ${category}`);
    else if (!prof.must.includes(m) && !prof.may.includes(m)) errors.push(`module "${m}" not listed for ${category}`);
  }
  return errors;
}

/** Errors [{ path, message }] for a file grouped one level by category: { "<category>": { "<id>": record } }. */
export function checkGroupedFile(profiles, kind, file) {
  const out = [];
  for (const [category, records] of Object.entries(file)) {
    if (category === 'about') continue;
    for (const [id, rec] of Object.entries(records)) {
      for (const message of checkProfile(profiles, kind, category, rec)) out.push({ path: `$.${category}.${id}`, message });
    }
  }
  return out;
}
