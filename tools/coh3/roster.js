// Roster selection: which CoH3 squads Burning Front uses per faction, with their members, weapons, equipment and price.
// Pure: the source comes in loaded (tools/lib/coh3.js loadSource) and the decisions come from data/rules/roster.json.
// The importer, the vocab check and the coh3stats compare call this; tools/coh3/catalog.js only renders it.
//
// A squad is kept when a building / vehicle produces it (spawner_ext), another entity references it (built emplacement,
// recrewable gun), an upgrade spawns it, an ability calls it in, roster.json restores it, or coh3stats lists it by name.
// Everything else (campaign, test, map objects, variants nobody spawns) is excluded with a reason.
import { RACES } from './fetch.js';
import { EXT, last, refsIn } from '../lib/coh3.js';

export const FACTIONS = RACES.filter(r => r !== 'common');
const EXCLUDED_CATEGORIES = { aircraft: 'off-map aircraft', squad_size_variants: 'size variant' };
const NOT_A_UNIT = /dummy|tutorial|_test|campaign|map_object|prewrecked|jettisoned|_ai_/;

/** Weapon paths an entity carries: hardpoints → weapon entity → weapon_ext.weapon (or the entity itself is a weapon item). */
export function weaponsOf(ebpsRec, ebps) {
  const direct = EXT(ebpsRec, 'weapon_ext')?.weapon?.instance_reference;
  if (direct) return [direct];
  const items = refsIn(EXT(ebpsRec, 'combat_ext')?.hardpoints, 'ebps/races/');
  return [...new Set(items.map(i => EXT(ebps.get(i)?.rec, 'weapon_ext')?.weapon?.instance_reference).filter(Boolean))];
}

/** Squad price: coh3stats total (what the game charges) when roster.json says so and coh3stats has it, else the sum of member entity costs. */
export function squadPrice(stats, members, ebpsById, csCfg) {
  if (csCfg.squad_price_from_coh3stats && stats?.cost) {
    const c = Object.fromEntries(['manpower', 'munition', 'fuel'].map(k => [k, Math.round(stats.cost[k] || 0)]).filter(([, v]) => v));
    return { cost: c, from: 'coh3stats' };
  }
  const sum = { manpower: 0, munition: 0, fuel: 0 };
  for (const m of members) {
    const c = EXT(ebpsById.get(m.entity)?.rec, 'cost_ext')?.time_cost?.cost || {};
    for (const k of Object.keys(sum)) sum[k] += (c[k] || 0) * m.count;
  }
  return { cost: Object.fromEntries(Object.entries(sum).map(([k, v]) => [k, Math.round(v)]).filter(([, v]) => v)), from: 'entities' };
}

/** How a squad enters the game, or null when nothing spawns it. */
function sourceOf(p, refs, restored, onCoh3stats) {
  if (refs.produced.has(p)) return 'produced';
  if (refs.built.has(p)) return 'built';
  if (refs.viaUpgrade.has(p)) return 'upgrade';
  if (refs.calledIn.has(p)) return 'called_in';
  if (restored) return 'restored';
  if (onCoh3stats) return 'coh3stats';
  return null;
}

/** References to one race's squads; they may sit in any race's files (british_africa squads are produced from british files). */
function squadRefs(src, race) {
  const prefix = `sbps/races/${race}/`;
  const produced = new Map(), built = new Set();
  for (const [p, e] of src.ebps) {
    for (const s of refsIn(EXT(e.rec, 'spawner_ext'), prefix)) (produced.get(s) ?? produced.set(s, []).get(s)).push(last(p));
    for (const s of refsIn(e.rec, prefix)) built.add(s);
  }
  const inText = text => new Set(text.match(new RegExp(`${prefix}[a-z0-9_/]+`, 'g')) || []);
  return { produced, built, calledIn: inText(src.text.abilities), viaUpgrade: inText(src.text.upgrade) };
}

/**
 * src: loadSource() result; roster: data/rules/roster.json; races: CoH3 races to build (default: every faction race).
 * → { race: { units: [...], excluded: [{ id, category, reason }], weapons: [{ id, category, class }] } }
 */
export function buildRoster(src, roster, races = FACTIONS) {
  const ebpsById = new Map();   // first record of each id wins (ids repeat across race files)
  for (const [p, v] of src.ebps) if (!ebpsById.has(last(p))) ebpsById.set(last(p), v);
  const csCfg = roster.coh3stats ?? {};
  const out = {};
  for (const race of races) {
    const refs = squadRefs(src, race), stats = src.coh3stats[race] ?? {};
    const units = [], excluded = [];
    for (const [p, s] of src.sbps) {
      if (s.race !== race) continue;
      const id = last(p), category = s.path[0], cs = stats[id];
      const onCoh3stats = !!(csCfg.include_named_units && cs?.name && !(csCfg.exclude || []).includes(id));
      const source = sourceOf(p, refs, (roster.restore?.[race] || []).includes(id), onCoh3stats);
      const reason = EXCLUDED_CATEGORIES[category]
        ?? ((csCfg.exclude || []).includes(id) ? 'excluded in roster.json' : null)
        ?? (!onCoh3stats && NOT_A_UNIT.test(id) ? 'dummy / test / map object' : null)
        ?? (!source ? 'not produced or called in' : null);
      if (reason) { excluded.push({ id, category, reason }); continue; }

      const members = (EXT(s.rec, 'squad_loadout_ext')?.unit_list || []).map(u => {
        const e = u.loadout_data.type.instance_reference, rec = src.ebps.get(e)?.rec;
        return { entity: last(e), count: u.loadout_data.num, category: src.ebps.get(e)?.path[0] ?? '?',
          hp: EXT(rec, 'health_ext')?.hitpoints ?? null, weapons: rec ? weaponsOf(rec, src.ebps).map(last) : [] };
      });
      const kits = (EXT(s.rec, 'squad_upgrade_ext')?.upgrades || []).map(u => u.upgrade.instance_reference).map(u => {
        const bag = src.upgrades.get(u)?.rec?.upgrade_bag;
        const item = refsIn(bag?.requirements_to_complete, 'ebps/races/').find(x => x.includes('/weapons/'));
        const weapon = item ? EXT(src.ebps.get(item)?.rec, 'weapon_ext')?.weapon?.instance_reference : null;
        return { id: last(u), cost: bag?.time_cost?.cost ? Object.fromEntries(Object.entries(bag.time_cost.cost).filter(([, v]) => v)) : {},
          weapon: weapon ? last(weapon) : null };
      });
      units.push({ id, category, source, producers: refs.produced.get(p) ?? [],
        doctrine: refsIn(EXT(s.rec, 'squad_requirement_ext'), 'upgrade/').some(r => r.includes('/battlegroups/')),
        clone: roster.clone?.[id] ?? null, members, upgrades: kits,
        name: cs?.name || null, hero: (roster.heroes?.units || []).includes(id),
        price: squadPrice(cs, members, ebpsById, csCfg), pop: cs?.cost?.popcap ?? cs?.pop ?? null, build_seconds: cs?.cost?.time_seconds ?? null });
    }

    // weapons in use, from whichever race file defines them
    const used = new Set(units.flatMap(u => [...u.members.flatMap(m => m.weapons), ...u.upgrades.map(k => k.weapon).filter(Boolean)]));
    const weapons = [], listed = new Set();
    for (const [p, w] of src.weapons) {
      const id = last(p);
      if (!used.has(id) || listed.has(id)) continue;
      listed.add(id);
      weapons.push({ id, category: w.path[w.path.length - 2] ?? w.path[0], class: w.rec.weapon_bag.weapon_class ?? '' });
    }
    const byCat = (a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id);
    out[race] = { units: units.sort(byCat), excluded: excluded.sort((a, b) => a.reason.localeCompare(b.reason) || a.id.localeCompare(b.id)),
      weapons: weapons.sort(byCat) };
  }
  return out;
}
