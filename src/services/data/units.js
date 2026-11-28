// Unit data for the rules: data/generated/units.json ({ factions: { faction: { kind: { group: { id: record } } } } })
// → flat maps by id per kind, the shape src/logic reads (data.units.sbps[id] …). Pure.

const KINDS = ['weapon', 'ebps', 'sbps', 'upgrade', 'ability'];

/** → { units: { weapon, ebps, sbps, upgrade, ability, veterancy, fx: { section: { id } } , faction: { squad id: faction } }, errors } */
export function indexUnits(generated) {
  const units = { weapon: {}, ebps: {}, sbps: {}, upgrade: {}, ability: {}, veterancy: {}, fx: {}, faction: {} };
  const errors = [];
  for (const [faction, data] of Object.entries(generated.factions || {})) {
    for (const kind of KINDS) {
      for (const [category, recs] of Object.entries(data[kind] || {})) {
        for (const [id, rec] of Object.entries(recs)) {
          if (units[kind][id]) {   // the same CoH3 record shared by two factions (a weapon both use) is fine; a different one is not
            const { id: _i, category: _c, ...prev } = units[kind][id];
            if (JSON.stringify(prev) !== JSON.stringify(rec)) errors.push(`${kind} id "${id}" is defined differently by two factions`);
            continue;
          }
          units[kind][id] = { ...rec, id, category };
          if (kind === 'sbps') units.faction[id] = faction;
        }
      }
    }
    Object.assign(units.veterancy, data.veterancy || {});
    for (const [section, recs] of Object.entries(data.fx || {})) Object.assign((units.fx[section] ??= {}), recs);
  }
  return { units, errors };
}
