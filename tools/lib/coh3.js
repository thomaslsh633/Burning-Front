// Shared readers for the CoH3 source JSON (data/source/coh3) and the coh3stats statistics (data/source/coh3stats).
// The helpers are pure; loadSource() is the one function here that reads files.
import fs from 'node:fs';
import path from 'node:path';
import { RACES } from '../coh3/fetch.js';

/** Extension block of an ebps / sbps record whose template name ends with `name` (e.g. "health_ext"). */
export const EXT = (rec, name) => (rec?.extensions || []).map(x => x.exts || x.squadexts || x)
  .find(x => x.template_reference?.value?.endsWith(name));
/** Mean of a CoH3 { min, max } range. */
export const avg = r => ((r?.min ?? 0) + (r?.max ?? 0)) / 2;
/** Round to two decimals (ratios only; stats are whole numbers). */
export const r2 = x => Math.round(x * 100) / 100;
/** Last part of a CoH3 path ("sbps/races/american/infantry/riflemen_us" → "riflemen_us"). */
export const last = p => String(p ?? '').split('/').pop();
/** CoH3 booleans are the strings "True" / "False". */
export const isTrue = v => v === 'True' || v === true;
/** Every distinct CoH3 path starting with `prefix` anywhere inside `obj`. */
export const refsIn = (obj, prefix) => [...new Set(JSON.stringify(obj ?? null).match(new RegExp(`${prefix}[a-z0-9_/]+`, 'g')) || [])];

/** Leaf records: a weapon has weapon_bag, an upgrade upgrade_bag; an ebps / sbps record has extensions. */
export function* records(node, pathParts = []) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return;
  if ('weapon_bag' in node || 'upgrade_bag' in node || 'extensions' in node) { yield { path: pathParts, rec: node }; return; }
  for (const [k, v] of Object.entries(node)) yield* records(v, [...pathParts, k]);
}

/** Index every record of one kind across all races by its full CoH3 path (e.g. "ebps/races/american/infantry/rifleman_us"). */
export function indexKind(dir, kind, prefixOf) {
  const index = new Map();
  for (const race of RACES) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, kind, `${race}.json`), 'utf8'));
    for (const { path: p, rec } of records(data)) index.set(`${prefixOf(race)}/${p.join('/')}`, { race, path: p, rec });
  }
  return index;
}

/** Same index keyed by the last path part, each entry carrying its full path as `ref`. */
export const byId = index => new Map([...index].map(([p, v]) => [last(p), { ...v, ref: p }]));

/**
 * Everything the roster and the importer read from the source folders, loaded once.
 * { ebps, sbps, weapons, upgrades }: indexKind maps; text: { abilities, upgrade } raw JSON of every race (for references);
 * coh3stats: { race: { squad id: stats } } (empty when not downloaded).
 */
export function loadSource(root) {
  const dir = path.join(root, 'data/source/coh3');
  const raw = kind => RACES.map(r => fs.readFileSync(path.join(dir, kind, `${r}.json`), 'utf8')).join('\n');
  const statsFile = race => path.join(root, 'data/source/coh3stats', `${race}.json`);
  return {
    dir,
    ebps: indexKind(dir, 'ebps', r => `ebps/races/${r}`),
    sbps: indexKind(dir, 'sbps', r => `sbps/races/${r}`),
    weapons: indexKind(dir, 'weapon', r => `weapon/${r}`),
    upgrades: indexKind(dir, 'upgrade', r => `upgrade/${r}`),
    text: { abilities: raw('abilities'), upgrade: raw('upgrade') },
    coh3stats: Object.fromEntries(RACES.map(r => [r, fs.existsSync(statsFile(r)) ? JSON.parse(fs.readFileSync(statsFile(r), 'utf8')) : {}])),
  };
}
