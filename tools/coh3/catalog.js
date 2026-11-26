// Clean catalog of the CoH3 units Burning Front can use, per faction: squads → member entities → weapons, and the
// equipment (upgrades) each squad can take. A squad is kept when a building / vehicle produces it (spawner_ext), another
// entity references it (built emplacement, recrewable gun), an upgrade spawns it, or an ability calls it in; everything
// else (campaign, test, map objects, variants nobody spawns) is listed as excluded, with its v214 flag.
//
// usage: node tools/coh3/catalog.js   → reports/catalog/<race>.md, reports/catalog.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RACES } from './fetch.js';
import { records } from './census.js';
import { fireRate } from '../import-coh3/fire-rate.js';

export const FACTIONS = RACES.filter(r => r !== 'common');
const EXT = (rec, name) => (rec.extensions || []).map(x => x.exts || x.squadexts || x)
  .find(x => x.template_reference?.value?.endsWith(name));
const refsIn = (obj, prefix) => [...new Set((JSON.stringify(obj ?? null).match(new RegExp(`${prefix}[a-z0-9_/]+`, 'g')) || []))];
const lastPart = p => p.split('/').pop();

/** Index every record of one kind across all races by its full CoH3 path (e.g. "ebps/races/american/infantry/rifleman_us"). */
export function indexKind(dir, kind, prefixOf) {
  const index = new Map();
  for (const race of RACES) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, kind, `${race}.json`), 'utf8'));
    for (const { path: p, rec } of records(data)) index.set(`${prefixOf(race)}/${p.join('/')}`, { race, path: p, rec });
  }
  return index;
}

/** Weapon paths an entity carries: hardpoints → weapon entity → weapon_ext.weapon (or the entity itself is a weapon item). */
export function weaponsOf(ebpsRec, ebps) {
  const direct = EXT(ebpsRec, 'weapon_ext')?.weapon?.instance_reference;
  if (direct) return [direct];
  const items = refsIn(EXT(ebpsRec, 'combat_ext')?.hardpoints, 'ebps/races/');
  return [...new Set(items.map(i => EXT(ebps.get(i)?.rec ?? {}, 'weapon_ext')?.weapon?.instance_reference).filter(Boolean))];
}

export function buildCatalog(dir) {
  const ebps = indexKind(dir, 'ebps', r => `ebps/races/${r}`);
  const sbps = indexKind(dir, 'sbps', r => `sbps/races/${r}`);
  const weapons = indexKind(dir, 'weapon', r => `weapon/${r}`);
  const upgrades = indexKind(dir, 'upgrade', r => `upgrade/${r}`);
  const fireCfg = JSON.parse(fs.readFileSync(path.join(dir, '../../balance/fire-rate.json'), 'utf8'));
  const roster = JSON.parse(fs.readFileSync(path.join(dir, '../../rules/roster.json'), 'utf8'));
  // coh3stats.com unit statistics (data/source/coh3stats, tools/coh3stats/fetch.js): names, squad price / pop / time
  const statsOf = race => { const f = path.join(dir, '../coh3stats', `${race}.json`); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {}; };
  const csCfg = roster.coh3stats ?? {};
  const legacyRaw = (() => {
    try { const u = JSON.parse(fs.readFileSync(path.join(dir, '../../legacy-snapshot/units.json'), 'utf8')).COH3_RAW;
      return new Set(Object.values(u).flatMap(t => Object.values(t).map(x => x.sbp))); } catch { return new Set(); }
  })();

  const catalog = {};
  for (const race of FACTIONS) {
    const produced = new Map();   // sbps path → producer ids
    const built = new Set();      // referenced by an entity outside spawner_ext (constructed emplacement, recrewable gun)
    // references may sit in any race's files (british_africa squads are produced and called in from british files)
    for (const [p, e] of ebps) {
      for (const s of refsIn(EXT(e.rec, 'spawner_ext'), `sbps/races/${race}/`)) (produced.get(s) ?? produced.set(s, []).get(s)).push(lastPart(p));
      for (const s of refsIn(e.rec, `sbps/races/${race}/`)) built.add(s);
    }
    const allRaw = kind => RACES.map(r => fs.readFileSync(path.join(dir, kind, `${r}.json`), 'utf8')).join('\n');
    const calledIn = new Set(allRaw('abilities').match(new RegExp(`sbps/races/${race}/[a-z0-9_/]+`, 'g')) || []);
    const viaUpgrade = new Set(allRaw('upgrade').match(new RegExp(`sbps/races/${race}/[a-z0-9_/]+`, 'g')) || []);

    const stats = statsOf(race);
    const units = [], excluded = [];
    for (const [p, s] of sbps) {
      if (s.race !== race) continue;
      const id = lastPart(p), category = s.path[0];
      const restored = (roster.restore[race] || []).includes(id);
      const cs = stats[id];
      const onCoh3stats = !!(csCfg.include_named_units && cs?.name && !(csCfg.exclude || []).includes(id));
      const source = produced.has(p) ? 'produced' : built.has(p) ? 'built' : viaUpgrade.has(p) ? 'upgrade' : calledIn.has(p) ? 'called_in'
        : restored ? 'restored' : onCoh3stats ? 'coh3stats' : null;
      const reason = category === 'aircraft' ? 'off-map aircraft' : category === 'squad_size_variants' ? 'size variant'
        : (csCfg.exclude || []).includes(id) ? 'excluded in roster.json'
        : !onCoh3stats && /dummy|tutorial|_test|campaign|map_object|prewrecked|jettisoned|_ai_/.test(id) ? 'dummy / test / map object'
        : !source ? 'not produced or called in' : null;
      if (reason) { excluded.push({ id, category, reason, in_v214: legacyRaw.has(id) }); continue; }

      const req = refsIn(EXT(s.rec, 'squad_requirement_ext'), 'upgrade/');
      const members = (EXT(s.rec, 'squad_loadout_ext')?.unit_list || []).map(u => {
        const e = u.loadout_data.type.instance_reference;
        const rec = ebps.get(e)?.rec;
        return { entity: lastPart(e), count: u.loadout_data.num, category: ebps.get(e)?.path[0] ?? '?',
          hp: EXT(rec ?? {}, 'health_ext')?.hitpoints ?? null, weapons: rec ? weaponsOf(rec, ebps).map(lastPart) : [] };
      });
      const kits = (EXT(s.rec, 'squad_upgrade_ext')?.upgrades || []).map(u => u.upgrade.instance_reference).map(u => {
        const bag = upgrades.get(u)?.rec?.upgrade_bag;
        const item = refsIn(bag?.requirements_to_complete, 'ebps/races/').find(x => x.includes('/weapons/'));
        const weapon = item ? EXT(ebps.get(item)?.rec ?? {}, 'weapon_ext')?.weapon?.instance_reference : null;
        return { id: lastPart(u), cost: bag?.time_cost?.cost ? Object.fromEntries(Object.entries(bag.time_cost.cost).filter(([, v]) => v)) : {},
          weapon: weapon ? lastPart(weapon) : null };
      });
      units.push({ id, category, source, producers: produced.get(p) ?? [], doctrine: req.some(r => r.includes('/battlegroups/')),
        in_v214: legacyRaw.has(id), clone: roster.clone?.[id] ?? null, members, upgrades: kits,
        name: cs?.name || null, hero: (roster.heroes?.units || []).includes(id),
        price: price(cs, members, ebps, csCfg), pop: cs?.cost?.popcap ?? cs?.pop ?? null, build_seconds: cs?.cost?.time_seconds ?? null });
    }

    const used = new Set(units.flatMap(u => [...u.members.flatMap(m => m.weapons), ...u.upgrades.map(k => k.weapon).filter(Boolean)]));
    const weaponList = [];
    const listed = new Set();
    for (const [p, w] of weapons) {   // weapons in use, from whichever race file defines them
      if (!used.has(lastPart(p)) || listed.has(lastPart(p))) continue;
      listed.add(lastPart(p));
      const category = w.path[w.path.length - 2] ?? w.path[0];
      const fr = fireRate(w.rec.weapon_bag, category, fireCfg);
      weaponList.push({ id: lastPart(p), category, class: w.rec.weapon_bag.weapon_class ?? '', rule: fr.rule,
        shots: fr.shots_per_turn, damage: fr.damage_per_shot, reload_turns: fr.reload_turns, accuracy_scale: fr.accuracy_scale });
    }
    catalog[race] = { units: units.sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id)),
      excluded: excluded.sort((a, b) => a.reason.localeCompare(b.reason) || a.id.localeCompare(b.id)),
      weapons: weaponList.sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id)) };
  }
  return catalog;
}

function markdown(race, c, commit) {
  const b3 = o => (o ? ['near', 'mid', 'far'].map(b => o[b]).join(' / ') : '');
  const res = o => Object.entries(o).map(([k, v]) => `${v} ${k.slice(0, 3)}`).join(', ');
  const L = [`# CoH3 catalog: ${theatreLabel(race)}`, '', `coh3-data \`${commit.slice(0, 8)}\`. Generated by \`node tools/coh3/catalog.js\`; do not edit.`, '',
    `${c.units.length} units (squads), ${c.weapons.length} weapons in use, ${c.excluded.length} squad records excluded.`,
    'Source: `produced` = a building or vehicle produces it; `built` = referenced by an entity (constructed emplacement, recrewable gun);',
    '`upgrade` = spawned by an upgrade; `called_in` = an ability calls it in; `restored` = brought back by `data/rules/roster.json`.',
    '`doctrine` = a CoH3 battlegroup unit, unlocked by a Burning Front doctrine. `v214` = in the legacy roster.',
    '`coh3stats` = listed by coh3stats.com (multiplayer). Name, price and pop from coh3stats; price marked * = sum of entity costs (unit not on coh3stats).', ''];
  for (const cat of [...new Set(c.units.map(u => u.category))]) {
    L.push(`## Units: ${cat}`, '', '| Squad | name (coh3stats) | price | pop | source | doctrine | v214 | members (entity × count, HP) | weapons | equipment (upgrades → weapon) |', '| --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |');
    for (const u of c.units.filter(x => x.category === cat)) {
      const mem = u.members.map(m => `${m.entity} ×${m.count}${m.hp ? ` (${m.hp})` : ''}`).join('<br>');
      const wpn = [...new Set(u.members.flatMap(m => m.weapons))].join('<br>');
      const kit = u.upgrades.map(k => `${k.id}${k.weapon ? ` → ${k.weapon}` : ''}${Object.keys(k.cost).length ? ` (${res(k.cost)})` : ''}`).join('<br>');
      const pr = u.price ? `${res(u.price.cost)}${u.price.from === 'coh3stats' ? '' : ' *'}` : '';
      L.push(`| ${u.id}${u.clone ? ` (${u.clone.fields.join(', ')} from ${u.clone.from})` : ''} | ${u.name ?? ''} | ${pr} | ${u.pop ?? ''} | ${u.source} | ${u.doctrine ? 'yes' : ''} | ${u.in_v214 ? 'yes' : ''} | ${mem} | ${wpn} | ${kit} |`);
    }
    L.push('');
  }
  L.push('## Weapons in use', '', '| Weapon | subcategory | class | rule | shots (near / mid / far) | damage per shot | reload turns | accuracy scale |',
    '| --- | --- | --- | --- | --- | --- | ---: | --- |');
  for (const w of c.weapons) L.push(`| ${w.id} | ${w.category} | ${w.class} | ${w.rule} | ${b3(w.shots)} | ${b3(w.damage)} | ${w.reload_turns} | ${b3(w.accuracy_scale)} |`);
  L.push('', '## Excluded squad records', '', 'Squads marked v214 were in the legacy roster; they can be brought back by hand.', '', '| Squad | category | reason | v214 |', '| --- | --- | --- | --- |');
  for (const x of c.excluded) L.push(`| ${x.id} | ${x.category} | ${x.reason} | ${x.in_v214 ? 'yes' : ''} |`);
  return L.join('\n') + '\n';
}

// "british_africa" → "british · north_africa" (data/rules/roster.json)
function theatreLabel(race) {
  if (race === 'british_africa') return 'british · north_africa (CoH3 british_africa)';
  if (race === 'british') return 'british · italy (CoH3 british)';
  return race;
}

/** Squad price: coh3stats total (what the game charges) when present, else the sum of member entity costs. */
function price(cs, members, ebps, csCfg) {
  if (csCfg.squad_price_from_coh3stats && cs?.cost) {
    const c = Object.fromEntries(['manpower', 'munition', 'fuel'].map(k => [k, Math.round(cs.cost[k] || 0)]).filter(([, v]) => v));
    return { cost: c, from: 'coh3stats' };
  }
  const sum = { manpower: 0, munition: 0, fuel: 0 };
  for (const m of members) {
    const rec = [...ebps.values()].find(e => e.path[e.path.length - 1] === m.entity)?.rec;
    const c = EXT(rec ?? {}, 'cost_ext')?.time_cost?.cost || {};
    for (const k of Object.keys(sum)) sum[k] += (c[k] || 0) * m.count;
  }
  return { cost: Object.fromEntries(Object.entries(sum).map(([k, v]) => [k, Math.round(v)]).filter(([, v]) => v)), from: 'entities' };
}

function summary(catalog, commit) {
  const L = ['# CoH3 unit catalog — summary', '', `coh3-data \`${commit.slice(0, 8)}\`. Generated by \`node tools/coh3/catalog.js\`; do not edit.`,
    'Full tables (members, HP, weapons, equipment with cost, fire-rate values): `<faction>.md`.', '',
    '| Faction | units | infantry | team weapons | vehicles | emplacements | weapons in use | equipment (upgrades) | excluded records |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |'];
  for (const race of FACTIONS) {
    const c = catalog[race], n = cat => c.units.filter(u => u.category === cat).length;
    const kits = new Set(c.units.flatMap(u => u.upgrades.map(k => k.id))).size;
    L.push(`| ${theatreLabel(race)} | ${c.units.length} | ${n('infantry')} | ${n('team_weapons')} | ${n('vehicles')} | ${n('emplacements')} | ${c.weapons.length} | ${kits} | ${c.excluded.length} |`);
  }
  for (const race of FACTIONS) {
    const c = catalog[race];
    L.push('', `## ${theatreLabel(race)}`, '');
    for (const cat of [...new Set(c.units.map(u => u.category))]) {
      L.push(`- **${cat}** (${c.units.filter(u => u.category === cat).length}): ` +
        c.units.filter(u => u.category === cat).map(u => `${u.id}${u.hero ? ' (hero)' : ''}${u.doctrine ? ' (doctrine)' : ''}${u.source === 'restored' ? ' (restored)' : ''}`).join(', '));
    }
    const back = c.excluded.filter(x => x.in_v214);   // in v214 but neither referenced nor restored
    if (back.length) L.push(`- **excluded, but in v214** (${back.length}): ${back.map(x => x.id).join(', ')}`);
  }
  return L.join('\n') + '\n';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const dir = path.join(root, 'data/source/coh3');
  const commit = JSON.parse(fs.readFileSync(path.join(dir, 'SOURCE.json'), 'utf8')).commit;
  const catalog = buildCatalog(dir);
  fs.mkdirSync(path.join(root, 'reports/catalog'), { recursive: true });
  fs.writeFileSync(path.join(root, 'reports/catalog.json'), JSON.stringify({ source: commit, catalog }, null, 1) + '\n');
  for (const race of FACTIONS) fs.writeFileSync(path.join(root, `reports/catalog/${race}.md`), markdown(race, catalog[race], commit));
  fs.writeFileSync(path.join(root, 'reports/catalog/README.md'), summary(catalog, commit));
  for (const race of FACTIONS) {
    const c = catalog[race];
    console.log(`${race}: ${c.units.length} units, ${c.weapons.length} weapons, ${c.excluded.length} excluded`);
  }
}
