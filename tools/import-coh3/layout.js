// Unit folders for imported data: each squad gets data/base/<faction>/<squad id>/ with the records only it uses
// (its sbps, member entities, weapons, upgrades, veterancy set, fx entries); records two or more squads use go to
// shared/. Pure: the importer's files by kind in, { folder: files by kind } out. The merge is by id, so the folder a
// record sits in never changes the game data.

export const SHARED = 'shared';
const ids = obj => Object.values(obj || {}).flatMap(g => Object.keys(g || {}));
const find = (files, kind, id) => Object.values(files[kind] || {}).map(g => g[id]).find(Boolean);

/** Record ids one squad reaches, per kind. */
export function reachOf(files, squadId) {
  const squad = find(files, 'sbps', squadId);
  const ebps = [...new Set([...(squad.members || []).map(m => m.entity),
    squad.team_weapon?.weapon_entity, squad.team_weapon?.crew_entity].filter(Boolean))];
  const upgrade = (squad.upgrades?.list || []).filter(u => find(files, 'upgrade', u));
  const weapon = new Set([squad.team_weapon?.weapon].filter(Boolean));
  for (const e of ebps) for (const w of find(files, 'ebps', e)?.weapons || []) weapon.add(w.weapon);
  for (const u of upgrade) for (const fx of find(files, 'upgrade', u)?.effects || []) if (fx.weapon) weapon.add(fx.weapon);
  const ability = (squad.abilities || []).filter(a => find(files, 'ability', a));
  for (const a of ability) if (find(files, 'ability', a).weapon) weapon.add(find(files, 'ability', a).weapon);
  return { sbps: [squadId], ebps, weapon: [...weapon], upgrade, ability, veterancy: squad.veterancy?.set ? [squad.veterancy.set] : [] };
}

/** files: { weapon, ebps, sbps, upgrade, veterancy, fx } → { folder: same shape, empty kinds left out } */
export function splitByUnit(files) {
  const users = {};   // "kind/id" → Set of squads
  for (const squadId of ids(files.sbps)) {
    for (const [kind, list] of Object.entries(reachOf(files, squadId))) for (const id of list) (users[`${kind}/${id}`] ??= new Set()).add(squadId);
  }
  const folderOf = (kind, id) => { const u = users[`${kind}/${id}`]; return u?.size === 1 ? [...u][0] : SHARED; };
  const out = {};
  const put = (folder, kind, group, id, rec) => {
    const f = (out[folder] ??= {});
    if (kind === 'veterancy') (f.veterancy ??= {})[id] = rec;
    else ((f[kind] ??= {})[group] ??= {})[id] = rec;
  };
  for (const kind of ['weapon', 'ebps', 'sbps', 'upgrade', 'ability']) {
    for (const [group, recs] of Object.entries(files[kind] || {})) for (const [id, rec] of Object.entries(recs)) put(folderOf(kind, id), kind, group, id, rec);
  }
  for (const [id, rec] of Object.entries(files.veterancy || {})) put(folderOf('veterancy', id), 'veterancy', null, id, rec);
  // an fx entry sits with the record it describes
  for (const [section, recs] of Object.entries(files.fx || {})) for (const [id, rec] of Object.entries(recs)) put(folderOf(section, id), 'fx', section, id, rec);
  return out;
}
