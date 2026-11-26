// Data layers: generated base → designer overrides → mods, merged by id (docs/reviews/d2-readiness.md §5).
// Inside a layer a kind may be split over files (one folder per unit, plus shared/); combineFiles joins them first.
// Pure: plain objects in, new objects out; the same function serves the build step (Node) and the game.
//
// Shapes of a data kind:
//   grouped   { <category>: { <id>: record } }, ids unique across categories (weapon, ebps, sbps, upgrade)
//   sections  { <section>: { <id>: record } }, ids unique per section (fx)
//   flat      { <id>: record } (veterancy)
// Rules: objects merge field by field, arrays are replaced, null deletes a field, { "remove": true } deletes a record,
// a new id adds a record, a grouped record placed under another category moves there.

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);

/** New object: patch applied over base. */
export function deepMerge(base, patch) {
  if (!isObject(base) || !isObject(patch)) return structuredClone(patch);
  const out = structuredClone(base);
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete out[k];
    else if (isObject(v) && isObject(out[k])) out[k] = deepMerge(out[k], v);
    else out[k] = structuredClone(v);
  }
  return out;
}

const groupsOf = (shape, data) => (shape === 'flat' ? { _: data || {} } : data || {});

/**
 * Merge layers [{ name, data }] of one kind. Returns { data, origin: { key: [layer names] }, errors: [string] }.
 * key = id (grouped, flat) or "section/id" (sections).
 */
export function mergeKind(shape, layers) {
  const errors = [];
  const where = new Map();     // key → group
  const records = new Map();   // key → record
  const origin = {};
  const keyOf = (group, id) => (shape === 'sections' ? `${group}/${id}` : id);
  for (const { name, data } of layers) {
    const seen = new Map();
    for (const [group, recs] of Object.entries(groupsOf(shape, data))) {
      if (!isObject(recs)) { errors.push(`${name}: group "${group}" is not an object`); continue; }
      for (const [id, rec] of Object.entries(recs)) {
        const key = keyOf(group, id);
        if (seen.has(key)) { errors.push(`${name}: id "${id}" appears in ${seen.get(key)} and ${group}`); continue; }
        seen.set(key, group);
        if (rec?.remove === true) {
          if (!records.has(key)) errors.push(`${name}: cannot remove "${id}" (not defined)`);
          records.delete(key); where.delete(key); (origin[key] ??= []).push(name);
          continue;
        }
        records.set(key, records.has(key) ? deepMerge(records.get(key), rec) : structuredClone(rec));
        where.set(key, group);
        (origin[key] ??= []).push(name);
      }
    }
  }
  const out = {};
  for (const [key, rec] of records) {
    const group = where.get(key), id = shape === 'sections' ? key.slice(group.length + 1) : key;
    (out[group] ??= {})[id] = rec;
  }
  return { data: shape === 'flat' ? out._ ?? {} : out, origin, errors };
}

/**
 * One layer's files of one kind, combined into one object: a layer may split a kind over several files (one folder per
 * unit plus shared/). files: [{ name, data }] → { data, errors }. A record id may appear in only one file of a layer.
 */
export function combineFiles(shape, files) {
  const errors = [], out = {}, from = new Map();   // key → file name
  for (const { name, data } of files) {
    for (const [group, recs] of Object.entries(groupsOf(shape, data))) {
      if (!isObject(recs)) { errors.push(`${name}: group "${group}" is not an object`); continue; }
      for (const [id, rec] of Object.entries(recs)) {
        const key = shape === 'sections' ? `${group}/${id}` : id;
        if (from.has(key) && from.get(key) !== name) { errors.push(`id "${id}" is in ${from.get(key)} and ${name}`); continue; }
        from.set(key, name);
        (out[group] ??= {})[id] = rec;
      }
    }
  }
  return { data: shape === 'flat' ? out._ ?? {} : out, errors };
}

/** The six unit data kinds and their shapes. */
export const UNIT_KINDS = { weapon: 'grouped', ebps: 'grouped', sbps: 'grouped', upgrade: 'grouped', veterancy: 'flat', fx: 'sections' };
