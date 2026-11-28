// Imports CoH3 squads into the Burning Front data forms: sbps → member ebps → weapons, plus weapon-kit upgrades,
// veterancy and fx stubs. Writes data/base/<faction>/<squad id or shared>/{weapon,ebps,sbps,veterancy,upgrade,fx}.json (generated base, never
// edited by hand: designer changes go in data/units/<faction>/ as overrides) and
// reports/import/<faction>.md (every guessed / defaulted / dropped value, and v214 differences for reference).
//
// usage: node tools/import-coh3/import.js <faction> [--all | squad id …]   (no ids: the D1-5 pilot set; --all: every roster squad)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSource, byId, EXT, last } from '../lib/coh3.js';
import { checkProfile } from '../profiles.js';
import { buildRoster } from '../coh3/roster.js';
import { classOf } from './indirect.js';
import { loadConfig } from '../lib/config.js';
import { splitByUnit } from './layout.js';
import { FLAG_TESTS, convertWeapon, convertEntity, convertSquad, convertVeterancy, convertUpgrade, convertAbility } from './convert.js';
import { abilityRecords, numericProps } from '../coh3/barrages.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));

export const PILOT = {
  american: ['riflemen_us', 'sherman_us', 'at_gun_57mm_us', 'mortar_81mm_us', 'hmg_30cal_us', 'hmg_fighting_position_us'],
  german: ['grenadier_ger', 'panzer_iv_ger', 'at_gun_75mm_ger', 'mortar_81mm_ger', 'hmg_mg42_ger', 'hmg_mg42_bunker_ger'],
};

export function importFaction(faction, squadIds) {
  const src = loadSource(root), dir = src.dir;
  const conf = loadConfig(root);
  const { vocab, profiles, roster, ammo, scale } = conf, cfg = conf.fire;
  const races = Object.values(roster.factions[faction].sources);
  const ebps = byId(src.ebps), sbps = byId(src.sbps), weapons = byId(src.weapons), upgrades = byId(src.upgrades);
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
  // squads a CoH3 paradrop call-in drops: the call-in's icon names the squad; roster.paradrop lists those whose icon does not
  const paradrops = new Set(roster.paradrop || []);
  for (const race of races) {
    const walk = o => { if (!o || typeof o !== 'object') return; if (o.ability_bag) { if (o.ability_bag.global_tree === 'flight_system_paradrop') paradrops.add(last(o.ability_bag.ui_info?.icon_name ?? '')); return; } Object.values(o).forEach(walk); };
    walk(JSON.parse(fs.readFileSync(path.join(dir, 'abilities', `${race}.json`), 'utf8')));
  }
  const rosterUnits = buildRoster(src, roster, races);
  const catUnits = Object.fromEntries(races.flatMap(r => rosterUnits[r].units.map(u => [u.id, u])));

  const files = { weapon: {}, ebps: {}, sbps: {}, veterancy: {}, upgrade: {}, ability: {}, fx: { weapon: {}, ebps: {}, sbps: {}, upgrade: {} } };
  const report = [];
  const put = (file, category, id, rec) => { (files[file][category] ??= {})[id] = rec; };
  const addWeapon = id => {
    if (Object.values(files.weapon).some(c => id in c)) return;
    const w = weapons.get(id);
    if (!w) { report.push({ id, kind: 'weapon', notes: ['weapon not found'] }); return; }
    if (/dummy/.test(id)) { report.push({ id, kind: 'weapon', notes: ['CoH3 placeholder weapon; skipped'] }); return; }
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
    const { record, notes } = convertEntity(e.rec, { ref: e.ref, category, vocab, profiles, weaponIdsOf, scale });
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
      memberCategory, carriedWeapon: eid => weaponOfItem(ebps.get(eid)?.ref), ammo, profiles, scale,
      entityTags: members.flatMap(m => (EXT(ebpsByRef.get(m)?.rec, 'type_ext')?.unit_type_list || []).map(t => t.unit_type)),
      indirectClass: mainWeapon ? classOf(mainWeapon, cfg.indirect)?.id : null });
    // weapons CoH3 hands `num` models at spawn (not on the entity record): coh3stats lists them with the carrier count
    const onEntities = new Set(members.flatMap(m => weaponIdsOf(ebpsByRef.get(m)?.rec).map(w => w.id)));
    const listed = src.coh3stats[s.race]?.[id]?.weapons ?? (roster.loadout?.[id] || []).map(w => ({ id: w.weapon, num: w.num }));   // hand loadout when coh3stats has none
    const loadout = listed.filter(w => !onEntities.has(w.id) && w.id !== mainWeapon && !/dummy/.test(w.id) && weapons.get(w.id));
    for (const w of loadout) addWeapon(w.id);
    const granted = loadout.filter(w => Object.values(files.weapon).some(c => w.id in c)).map(w => ({ weapon: w.id, num: w.num ?? 1 }));
    if (paradrops.has(id)) record.traits = [...new Set([...(record.traits || []), 'paradrop'])];
    if (granted.length) { record.loadout_weapons = granted; notes.push(`loadout weapons from coh3stats: ${granted.map(w => `${w.weapon} ×${w.num}`).join(', ')}`); }
    put('sbps', category, id, record);
    files.fx.sbps[id] = { name: `unit.${id}.name`, short_name: `unit.${id}.short`, desc: `unit.${id}.desc`, icon: id, menu: { tab: category, order: 0 } };
    report.push({ id, kind: `squad · ${category}`, notes });
    if (record.veterancy) {
      const v = convertVeterancy(s.rec, { vetIndex, vocab });
      files.veterancy[id] = v.record;
      report.push({ id, kind: 'veterancy', notes: v.notes });
    }
    // squad upgrades: `list` keeps the ones imported (weapon kits so far), `pending` the ones not imported yet
    const imported = [], pending = [];
    for (const u of record.upgrades?.list || []) {
      const up = upgrades.get(u);
      if (!up) { report.push({ id: u, kind: 'upgrade', notes: ['upgrade not found'] }); pending.push(u); continue; }
      const { record: ur, notes: un } = convertUpgrade(up.rec.upgrade_bag, { ref: up.ref, weaponOfItem, scale });
      report.push({ id: u, kind: 'upgrade', notes: un });
      if (!ur) { pending.push(u); continue; }
      imported.push(u);
      const ucat = vocab.lists.upgrade_category.includes(up.path[0]) ? up.path[0] : 'infantry';
      put('upgrade', ucat, u, ur);
      files.fx.upgrade[u] = { name: `upgrade.${u}.name`, icon: u };
      for (const e of ur.effects) if (e.weapon) addWeapon(e.weapon);
    }
    if (record.upgrades) {
      record.upgrades.list = imported;
      if (pending.length) record.upgrades.pending = pending;
    }
  }
  // abilities that fire a weapon (grenades, satchels, special shots, barrages): the squad keeps every id, only these get a record
  const abilities = new Map();
  for (const race of [...new Set([...races, 'common'])]) {
    for (const { path: p, rec } of abilityRecords(JSON.parse(fs.readFileSync(path.join(dir, 'abilities', `${race}.json`), 'utf8')))) abilities.set(p[p.length - 1], { rec, ref: `abilities/${race}/${p.join('/')}` });
  }
  for (const id of new Set(Object.values(files.sbps).flatMap(c => Object.values(c).flatMap(sq => sq.abilities || [])))) {
    const a = abilities.get(id);
    if (!a) continue;
    const item = (JSON.stringify(a.rec).match(/ebps\/races\/[a-z_]+\/weapons\/[a-z0-9_/]+/g) || []).map(weaponOfItem).find(w => (weapons.get(w)?.rec.weapon_bag.damage?.max ?? 0) > 0);
    const wr = item && weapons.get(item);
    const { record, notes } = convertAbility(a.rec.ability_bag, { id, ref: a.ref, props: numericProps(a.rec), indirect: cfg.indirect, scale,
      weapon: wr ? { id: item, bag: wr.rec.weapon_bag, category: wr.path[wr.path.length - 2] ?? wr.path[0] } : null });
    if (!record) continue;   // not an attack ability (yet): the id stays on the squad
    addWeapon(item);
    put('ability', 'weapon', id, record);
    report.push({ id, kind: 'ability', notes });
  }
  // fortified positions the squads build that CoH3 has no squad for (fighting positions, bunkers): a one-entity structure
  const isMember = id => Object.values(files.sbps).some(c => Object.values(c).some(sq => sq.members.some(m => m.entity === id)));
  for (const id of new Set(Object.values(files.sbps).flatMap(c => Object.values(c).flatMap(sq => sq.build?.menu || [])))) {
    const hold = EXT(ebps.get(id)?.rec, 'hold_ext');
    if (!((hold?.num_slots ?? 0) >= 1000 && hold.num_squad_slots > 0) || isMember(id)) continue;
    addEntity(id);
    const ent = Object.values(files.ebps).map(c => c[id]).find(Boolean);
    if (!ent) continue;
    put('sbps', 'emplacements', id, { coh3_ref: ebps.get(id).ref, kind: 'structure', role: 'all_round', members: [{ entity: id, count: 1 }],
      price: { cost: ent.cost ?? {}, from: 'entities' }, pop: 0, build_turns: ent.construction?.build_turns ?? 1, ...(ent.tags ? { tags: ent.tags } : {}), source: 'built' });
    files.fx.sbps[id] = { name: `unit.${id}.name`, short_name: `unit.${id}.short`, desc: `unit.${id}.desc`, icon: id, menu: { tab: 'emplacements', order: 0 } };
    report.push({ id, kind: 'squad · emplacements', notes: ['fortified position: no CoH3 squad; made from its entity (cost, build time, hold)'] });
  }
  dropBroken(files, profiles, report);
  // defensive structures the faction builds (sandbags, wire, tank traps): HP and armour for map lines and objects
  const terrainRules = read('data/rules/terrain.json');
  for (const def of [...Object.values(terrainRules.lines), ...Object.values(terrainRules.objects)]) {
    const id = def.faction_ebps?.[faction];
    if (id) addEntity(id);
  }
  return { files, report };
}

/**
 * Clean-up after a full import: weapons that fail their category profile are left out; entity weapon links to weapons that
 * were not imported (placeholders, recovery cranes) are dropped; a squad whose own records fail their category profile, or that names a member entity that was not imported,
 * is left out (reported), so one odd CoH3 record never breaks the build.
 */
function dropBroken(files, profiles, report) {
  for (const [cat, recs] of Object.entries(files.weapon)) {
    for (const [id, w] of Object.entries(recs)) {
      const why = checkProfile(profiles, 'weapon', cat, w);
      if (why.length) { delete recs[id]; delete files.fx.weapon[id]; report.push({ id, kind: 'weapon left out', notes: why }); }
    }
  }
  const has = (kind, id) => Object.values(files[kind]).some(c => id in c);
  for (const recs of Object.values(files.ability || {})) {
    for (const [id, a] of Object.entries(recs)) if (!has('weapon', a.weapon)) { delete recs[id]; report.push({ id, kind: 'ability left out', notes: [`weapon ${a.weapon} not imported`] }); }
  }
  for (const c of Object.values(files.ebps)) {
    for (const e of Object.values(c)) {
      if (!e.weapons) continue;
      e.weapons = e.weapons.filter(w => has('weapon', w.weapon));
      if (!e.weapons.length) delete e.weapons;   // e.g. artillery whose CoH3 weapon is a placeholder: fired by abilities (not built)
    }
  }
  const bad = [];
  for (const [cat, recs] of Object.entries(files.sbps)) {
    for (const [id, sq] of Object.entries(recs)) {
      const why = [...checkProfile(profiles, 'sbps', cat, sq), ...sq.members.flatMap(m => {
        const ecat = Object.keys(files.ebps).find(k => m.entity in files.ebps[k]);
        return ecat ? checkProfile(profiles, 'ebps', ecat, files.ebps[ecat][m.entity]).map(x => `${m.entity}: ${x}`) : [`member ${m.entity} not imported`];
      })];
      const w = sq.team_weapon?.weapon;
      if (w) { const wcat = Object.keys(files.weapon).find(k => w in files.weapon[k]); why.push(...(wcat ? checkProfile(profiles, 'weapon', wcat, files.weapon[wcat][w]).map(x => `${w}: ${x}`) : [`weapon ${w} not imported`])); }
      if (why.length) { bad.push({ cat, id }); report.push({ id, kind: 'squad left out', notes: why }); }
    }
  }
  for (const { cat, id } of bad) { delete files.sbps[cat][id]; delete files.veterancy[id]; delete files.fx.sbps[id]; }
  // entities only a left-out squad used go too (defensive structures are added after this)
  const used = new Set(Object.values(files.sbps).flatMap(c => Object.values(c).flatMap(sq => sq.members.map(m => m.entity))));
  for (const c of Object.values(files.ebps)) for (const id of Object.keys(c)) if (!used.has(id)) { delete c[id]; delete files.fx.ebps[id]; }
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
  if (!faction) { console.log('usage: node tools/import-coh3/import.js <faction> [--all | squad id …]'); process.exit(1); }
  const all = process.argv[3] === '--all';
  const races = Object.values(loadConfig(root).roster.factions[faction].sources);
  const ids = all ? [...new Set(Object.values(buildRoster(loadSource(root), loadConfig(root).roster, races)).flatMap(r => r.units.map(u => u.id)))]
    : process.argv.slice(3).length ? process.argv.slice(3) : PILOT[faction];
  const { files, report } = importFaction(faction, ids);
  // data/base/<faction>/ is generated: rewritten whole, one folder per squad plus shared/ (tools/import-coh3/layout.js)
  const outDir = path.join(root, 'data/base', faction);
  fs.rmSync(outDir, { recursive: true, force: true });
  for (const [folder, kinds] of Object.entries(splitByUnit(files))) {
    fs.mkdirSync(path.join(outDir, folder), { recursive: true });
    for (const [k, v] of Object.entries(kinds)) fs.writeFileSync(path.join(outDir, folder, `${k}.json`), JSON.stringify(v, null, 1) + '\n');
  }
  const L = [`# Import report: ${faction}`, '', `Generated by \`node tools/import-coh3/import.js ${faction}${all ? ' --all' : process.argv.slice(3).length ? ' …' : ''}\`. Squads (${ids.length}): ${ids.join(', ')}.`, '',
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
  console.log(`${faction}: ${count('sbps')} squads, ${count('ebps')} entities, ${count('weapon')} weapons, ${count('upgrade')} upgrades, ${Object.keys(files.veterancy).length} veterancy sets → data/base/${faction}/ (run npm run build:data)`);
}
