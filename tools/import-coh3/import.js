// Imports CoH3 squads into the Burning Front data forms: sbps → member ebps → weapons, plus weapon-kit upgrades,
// veterancy and fx stubs. Writes data/units/<faction>/{weapon,ebps,sbps,veterancy,upgrade,fx}.json and
// reports/import/<faction>.md (every guessed / defaulted / dropped value, and v214 differences for reference).
//
// usage: node tools/import-coh3/import.js <faction> [squad id …]   (no ids: the D1-5 pilot set for that faction)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { indexKind } from '../coh3/catalog.js';
import { records } from '../coh3/census.js';
import { classOf } from './indirect.js';
import { EXT, FLAG_TESTS, convertWeapon, convertEntity, convertSquad, convertVeterancy, convertUpgrade } from './convert.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const last = p => String(p ?? '').split('/').pop();

export const PILOT = {
  american: ['riflemen_us', 'sherman_us', 'at_gun_57mm_us', 'mortar_81mm_us', 'hmg_30cal_us', 'hmg_fighting_position_us'],
  german: ['grenadier_ger', 'panzer_iv_ger', 'at_gun_75mm_ger', 'mortar_81mm_ger', 'hmg_mg42_ger', 'hmg_mg42_bunker_ger'],
};

export function importFaction(faction, squadIds) {
  const dir = path.join(root, 'data/source/coh3');
  const vocab = read('data/rules/vocab.json'), profiles = read('data/schema/profiles.json'), roster = read('data/rules/roster.json');
  const cfg = { ...read('data/balance/fire-rate.json'), indirect: read('data/balance/indirect.json') };
  const ammo = read('data/balance/ammo.json');
  const catalog = read('reports/catalog.json').catalog;
  const races = Object.values(roster.factions[faction].sources);
  const byId = (kind, prefix) => {
    const m = new Map();
    for (const [p, v] of indexKind(dir, kind, prefix)) m.set(last(p), { ...v, ref: p });
    return m;
  };
  const ebps = byId('ebps', r => `ebps/races/${r}`), sbps = byId('sbps', r => `sbps/races/${r}`);
  const weapons = byId('weapon', r => `weapon/${r}`), upgrades = byId('upgrade', r => `upgrade/${r}`);
  const ebpsByRef = new Map([...ebps.values()].map(v => [v.ref, v]));
  const vetIndex = new Map();
  for (const race of [...new Set([...races, 'british', 'common'])]) {
    if (!fs.existsSync(path.join(dir, 'veterancy', `${race}.json`))) continue;
    const walk = (o, p) => { if (o && typeof o === 'object' && !Array.isArray(o)) { if (o.custom_property_bag) vetIndex.set(p.join('/'), o); else for (const [k, x] of Object.entries(o)) walk(x, [...p, k]); } };
    walk(JSON.parse(fs.readFileSync(path.join(dir, 'veterancy', `${race}.json`), 'utf8')), [race]);
  }
  const flags = Object.entries(FLAG_TESTS).map(([id, test]) => ({ id, test }));
  const weaponOfItem = ref => last(EXT(ebpsByRef.get(ref)?.rec, 'weapon_ext')?.weapon?.instance_reference) || null;
  const weaponIdsOf = rec => {
    const out = [];
    // one weapon per hardpoint: later entries of the same hardpoint are alternatives swapped in by upgrades
    for (const hp of EXT(rec, 'combat_ext')?.hardpoints || []) for (const t of (hp.hardpoint?.weapon_table || []).slice(0, 1)) {
      const item = (JSON.stringify(t).match(/ebps\/races\/[a-z_]+\/weapons\/[a-z0-9_/]+/) || [])[0];
      const w = item && weaponOfItem(item);
      if (w && !out.some(x => x.id === w)) out.push({ id: w, type: t.weapon?.type ?? 'default' });
    }
    const direct = last(EXT(rec, 'weapon_ext')?.weapon?.instance_reference);
    if (direct && !out.some(x => x.id === direct)) out.push({ id: direct, type: 'default' });
    return out;
  };
  const catUnits = Object.fromEntries(races.flatMap(r => (catalog[r]?.units || []).map(u => [u.id, u])));

  const files = { weapon: {}, ebps: {}, sbps: {}, veterancy: {}, upgrade: {}, fx: { weapon: {}, ebps: {}, sbps: {}, upgrade: {} } };
  const report = [];
  const put = (file, category, id, rec) => { (files[file][category] ??= {})[id] = rec; };
  const addWeapon = id => {
    if (Object.values(files.weapon).some(c => id in c)) return;
    const w = weapons.get(id);
    if (!w) { report.push({ id, kind: 'weapon', notes: ['weapon not found'] }); return; }
    let category = w.path[w.path.length - 2] ?? w.path[0];
    if (!((w.rec.weapon_bag.damage?.max ?? 0) > 0) && !['mine'].includes(category)) category = 'smoke';   // smoke launchers: no damage, fired by abilities
    if (!profiles.weapon.categories[category]) { report.push({ id, kind: 'weapon', notes: [`category ${category} has no profile; skipped`] }); return; }
    const { record, notes } = convertWeapon(w.rec.weapon_bag, { id, category, ref: w.ref, cfg, vocab, profiles, flags });
    put('weapon', category, id, record);
    files.fx.weapon[id] = { name: `weapon.${id}.name`, sound: { fire: record.class } };
    report.push({ id, kind: `weapon · ${category}`, notes });
  };
  const addEntity = id => {
    if (Object.values(files.ebps).some(c => id in c)) return;
    const e = ebps.get(id);
    if (!e) { report.push({ id, kind: 'entity', notes: ['entity not found'] }); return; }
    let category = e.path[0];
    if (category === 'weapons') { report.push({ id, kind: 'entity', notes: ['weapon item (carried weapon), not an entity record'] }); return; }
    if (!profiles.ebps.categories[category]) category = 'vehicles';
    const { record, notes } = convertEntity(e.rec, { ref: e.ref, category, vocab, profiles, weaponIdsOf });
    put('ebps', category, id, record);
    for (const w of record.weapons || []) addWeapon(w.weapon);
    files.fx.ebps[id] = { name: `entity.${id}.name`, model: { id, anim_class: category === 'infantry' ? 'infantry' : category === 'team_weapons' ? 'crew' : category === 'vehicles' ? 'tank_medium' : 'static' } };
    report.push({ id, kind: `entity · ${category}`, notes });
  };

  for (const id of squadIds) {
    const s = sbps.get(id);
    if (!s || !races.includes(s.race)) { report.push({ id, kind: 'squad', notes: [`squad not found in ${races.join(' / ')}`] }); continue; }
    const category = s.path[0];
    const members = (EXT(s.rec, 'squad_loadout_ext')?.unit_list || []).map(u => u.loadout_data.type.instance_reference);
    const memberCategory = entityId => ebps.get(entityId)?.path[0];
    // carried team weapon (HMG / mortar): the "member" is a weapon item; the crew entity carries the weapon
    for (const m of members) {
      const e = ebpsByRef.get(m);
      if (e?.path[0] === 'weapons') { const w = weaponOfItem(m); if (w) addWeapon(w); } else addEntity(last(m));
    }
    const mainWeapon = members.map(m => ebpsByRef.get(m)).map(e => (e?.path[0] === 'weapons' ? weaponOfItem(e.ref) : weaponIdsOf(e?.rec)[0]?.id)).find(Boolean);
    const mainBag = weapons.get(mainWeapon)?.rec?.weapon_bag;
    const { record, notes } = convertSquad(s.rec, { ref: s.ref, id, category, catalogUnit: catUnits[id], mainWeaponClass: mainBag?.weapon_class,
      memberCategory: eid => (ebps.get(eid)?.path[0] === 'weapons' ? 'weapons' : memberCategory(eid)), ammo, profiles,
      entityTags: members.flatMap(m => (EXT(ebpsByRef.get(m)?.rec, 'type_ext')?.unit_type_list || []).map(t => t.unit_type)),
      indirectClass: mainWeapon ? classOf(mainWeapon, cfg.indirect)?.id : null });
    // carried team weapon: weapon item member → record the weapon item as the team weapon entity
    if (record.team_weapon === undefined && category === 'team_weapons') {
      const item = members.find(m => ebpsByRef.get(m)?.path[0] === 'weapons'), crew = members.find(m => ebpsByRef.get(m)?.path[0] === 'infantry');
      if (item && crew) { record.team_weapon = { weapon_entity: last(item), crew_entity: last(crew) }; notes.push('carried team weapon: weapon item + crew'); }
    }
    record.members = record.members.filter(m => ebpsByRef.get([...ebpsByRef.keys()].find(k => k.endsWith('/' + m.entity)))?.path[0] !== 'weapons' || category !== 'team_weapons');
    put('sbps', category, id, record);
    files.fx.sbps[id] = { name: `unit.${id}.name`, short_name: `unit.${id}.short`, desc: `unit.${id}.desc`, icon: id, menu: { tab: category, order: 0 } };
    report.push({ id, kind: `squad · ${category}`, notes });
    if (record.veterancy) {
      const v = convertVeterancy(s.rec, { vetIndex, vocab });
      files.veterancy[id] = v.record;
      report.push({ id, kind: 'veterancy', notes: v.notes });
    }
    for (const u of record.upgrades?.list || []) {
      const up = upgrades.get(u);
      if (!up) { report.push({ id: u, kind: 'upgrade', notes: ['upgrade not found'] }); continue; }
      const { record: ur, notes: un } = convertUpgrade(up.rec.upgrade_bag, { ref: up.ref, weaponOfItem });
      report.push({ id: u, kind: 'upgrade', notes: un });
      if (!ur) continue;
      const ucat = vocab.lists.upgrade_category.includes(up.path[0]) ? up.path[0] : 'infantry';
      put('upgrade', ucat, u, ur);
      files.fx.upgrade[u] = { name: `upgrade.${u}.name`, icon: u };
      for (const e of ur.effects) if (e.weapon) addWeapon(e.weapon);
    }
  }
  return { files, report };
}

function legacyDiff(faction, files) {
  const snap = read('data/legacy-snapshot/units.json');
  const team = { american: 'blue', german: 'red' }[faction];
  if (!team) return [];
  const rows = [];
  for (const [key, raw] of Object.entries(snap.COH3_RAW[team] || {})) {
    const sq = Object.values(files.sbps).map(c => c[raw.sbp]).find(Boolean);
    if (!sq) continue;
    const roster = snap.UNIT_ROSTER[team][key] || {};
    const ent = Object.values(files.ebps).map(c => c[sq.members[0]?.entity]).find(Boolean) || {};
    rows.push({ unit: raw.sbp, legacy_key: key,
      cost: [roster.cost, sq.price.cost.manpower], hp: [raw.hp || raw.vhp, ent.hp], move: [roster.move, ent.move?.hex], sight: [roster.sight, ent.sight?.hex] });
  }
  return rows;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const faction = process.argv[2];
  if (!faction) { console.log('usage: node tools/import-coh3/import.js <faction> [squad id …]'); process.exit(1); }
  const ids = process.argv.slice(3).length ? process.argv.slice(3) : PILOT[faction];
  const { files, report } = importFaction(faction, ids);
  const outDir = path.join(root, 'data/units', faction);
  fs.mkdirSync(outDir, { recursive: true });
  for (const [k, v] of Object.entries(files)) fs.writeFileSync(path.join(outDir, `${k}.json`), JSON.stringify(v, null, 1) + '\n');
  const L = [`# Import report: ${faction}`, '', `Generated by \`node tools/import-coh3/import.js ${faction}${process.argv.slice(3).length ? ' …' : ''}\`. Squads: ${ids.join(', ')}.`, '',
    'Every value that was guessed, defaulted or dropped. Conversion rules: docs/data-labels.md.', '', '| Record | kind | notes |', '| --- | --- | --- |'];
  for (const r of report) L.push(`| ${r.id} | ${r.kind} | ${r.notes.join('; ') || '—'} |`);
  const diff = legacyDiff(faction, files);
  if (diff.length) {
    L.push('', '## v214 for reference (legacy value → imported value; differences are expected, CoH3 is the authority)', '',
      '| Unit | v214 key | squad cost (MP) | HP per member | move hex | sight hex |', '| --- | --- | --- | --- | --- | --- |');
    for (const d of diff) L.push(`| ${d.unit} | ${d.legacy_key} | ${d.cost.join(' → ')} | ${d.hp.join(' → ')} | ${d.move.join(' → ')} | ${d.sight.join(' → ')} |`);
  }
  fs.mkdirSync(path.join(root, 'reports/import'), { recursive: true });
  fs.writeFileSync(path.join(root, `reports/import/${faction}.md`), L.join('\n') + '\n');
  const count = k => Object.values(files[k]).reduce((a, c) => a + Object.keys(c).length, 0);
  console.log(`${faction}: ${count('sbps')} squads, ${count('ebps')} entities, ${count('weapon')} weapons, ${count('upgrade')} upgrades, ${Object.keys(files.veterancy).length} veterancy sets → data/units/${faction}/`);
}
