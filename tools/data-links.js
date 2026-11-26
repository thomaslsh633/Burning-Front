// Link check of one faction's merged unit data: every id a record names must exist.
// Runs in tools/build-data.js after base → units → mods are merged, so a broken override or mod is caught the same way.
//
// error    a link the game follows: a squad's members, an entity's weapons, a veterancy set, a team weapon's parts,
//          a squad's imported upgrades, an upgrade's added weapon, an fx entry with no record.
// warning  a link to something not imported yet (requirements, abilities, build menu, pending upgrades) or a record with
//          no fx entry. Grouped per rule, so the report stays short. The target kinds that do not exist yet
//          (abilities) are named in the message.

/** One rule per link: records of `kind`, the ids at `path` (`[]` walks an array), must exist in `to`. */
export const LINKS = [
  { kind: 'sbps', path: 'members[].entity', to: 'ebps', level: 'error' },
  { kind: 'sbps', path: 'team_weapon.weapon_entity', to: 'ebps', level: 'error' },
  { kind: 'sbps', path: 'team_weapon.crew_entity', to: 'ebps', level: 'error' },
  { kind: 'sbps', path: 'team_weapon.weapon', to: 'weapon', level: 'error' },
  { kind: 'sbps', path: 'veterancy.set', to: 'veterancy', level: 'error' },
  { kind: 'sbps', path: 'upgrades.list[]', to: 'upgrade', level: 'error' },
  { kind: 'ebps', path: 'weapons[].weapon', to: 'weapon', level: 'error' },
  { kind: 'upgrade', path: 'effects[].weapon', to: 'weapon', level: 'error' },
  { kind: 'sbps', path: 'upgrades.pending[]', to: 'upgrade', level: 'warning' },
  { kind: 'sbps', path: 'requires.upgrades[]', to: 'upgrade', level: 'warning' },
  { kind: 'sbps', path: 'requires.any_upgrades[]', to: 'upgrade', level: 'warning' },
  { kind: 'upgrade', path: 'requires.upgrades[]', to: 'upgrade', level: 'warning' },
  { kind: 'upgrade', path: 'requires.any_upgrades[]', to: 'upgrade', level: 'warning' },
  { kind: 'sbps', path: 'abilities[]', to: 'abilities', level: 'warning' },
  { kind: 'sbps', path: 'build.menu[]', to: 'ebps', level: 'warning' },
];

/** fx sections and the kind whose records they describe. */
export const FX_SECTIONS = { weapon: 'weapon', ebps: 'ebps', sbps: 'sbps', upgrade: 'upgrade' };

/** Values at a dotted path; a segment ending in [] walks every item of that array. */
export function valuesAt(obj, path) {
  let cur = [obj];
  for (const seg of path.split('.')) {
    const arr = seg.endsWith('[]'), key = arr ? seg.slice(0, -2) : seg;
    cur = cur.flatMap(o => {
      const v = o?.[key];
      if (v == null) return [];
      return arr ? (Array.isArray(v) ? v : []) : [v];
    });
  }
  return cur;
}

/** Records of a kind as [id, record]: grouped kinds are { group: { id: record } }, veterancy is { id: record }. */
function recordsOf(data, kind) {
  const d = data[kind] || {};
  return kind === 'veterancy' ? Object.entries(d) : Object.values(d).flatMap(g => Object.entries(g || {}));
}

const sample = (ids, n = 6) => ids.slice(0, n).join(', ') + (ids.length > n ? `, … (${ids.length - n} more)` : '');

/** merged: { weapon, ebps, sbps, veterancy, upgrade, fx } of one faction → { errors: [string], warnings: [string] } */
export function checkLinks(merged, links = LINKS) {
  const ids = Object.fromEntries(['weapon', 'ebps', 'sbps', 'upgrade', 'veterancy'].map(k => [k, new Set(recordsOf(merged, k).map(([id]) => id))]));
  const errors = [], warnings = [];
  for (const rule of links) {
    const known = ids[rule.to];   // undefined: the target kind does not exist yet
    const missing = new Set();
    for (const [id, rec] of recordsOf(merged, rule.kind)) {
      for (const ref of valuesAt(rec, rule.path)) {
        if (known?.has(ref)) continue;
        if (rule.level === 'error') errors.push(`${rule.kind} ${id} ${rule.path}: no ${rule.to} record "${ref}"`);
        else missing.add(ref);
      }
    }
    if (missing.size) {
      const why = known ? `not defined in ${rule.to}` : `no ${rule.to} data yet`;
      warnings.push(`${rule.kind} ${rule.path}: ${missing.size} ids ${why}: ${sample([...missing].sort())}`);
    }
  }
  for (const [section, kind] of Object.entries(FX_SECTIONS)) {
    const fx = merged.fx?.[section] || {};
    for (const id of Object.keys(fx)) if (!ids[kind].has(id)) errors.push(`fx ${section}/${id}: no ${kind} record "${id}"`);
    const bare = [...ids[kind]].filter(id => !(id in fx));
    if (bare.length) warnings.push(`fx ${section}: ${bare.length} ${kind} records have no fx entry: ${sample(bare.sort())}`);
  }
  return { errors, warnings };
}
