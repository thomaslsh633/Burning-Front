// Builds the unit data the game loads: data/base (importer output) → data/units (designer overrides) → enabled mods,
// merged by id (src/services/data), then checked (schemas, category profiles, word lists, links) and written to
// data/generated/units.json, and data/i18n + mod text into data/generated/i18n.json. reports/overrides.md lists every override
// next to the base value; reports/data-links.md the link and text warnings.
//
// usage: node tools/build-data.js           build and write
//        node tools/build-data.js --check   build in memory; fail on errors or when data/generated/units.json is stale
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeKind, UNIT_KINDS } from '../src/services/data/index.js';
import { validate, loadContext } from './validate.js';
import { checkGroupedFile } from './profiles.js';
import { checkLinks, checkI18n } from './data-links.js';
import { loadMods, mergeVocab } from './mods.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = f => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null);

const subdirs = dir => (fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory()).sort() : []);

/** Override and mod folders may only hold known factions and kind files; anything else would be silently ignored. */
export function strayFiles(rootDir, factions, mods) {
  const errors = [], kinds = Object.keys(UNIT_KINDS).map(k => `${k}.json`);
  const roots = [{ name: 'data/units', dir: path.join(rootDir, 'data/units') },
    ...mods.map(m => ({ name: `mod:${m.id} units`, dir: path.join(m.dir, 'units') }))];
  for (const { name, dir } of roots) {
    for (const f of subdirs(dir)) {
      if (!factions.includes(f)) { errors.push(`${name}/${f}: no faction "${f}" in data/base`); continue; }
      for (const file of fs.readdirSync(path.join(dir, f))) {
        if (!kinds.includes(file)) errors.push(`${name}/${f}/${file}: unknown file (expected ${kinds.join(', ')})`);
      }
    }
  }
  return errors;
}

/**
 * Text per language: data/i18n/<lang>.json, then each enabled mod's i18n/<lang>.json (later wins; a mod may add a language).
 * → { i18n: { lang: { key: text } }, errors }
 */
export function mergeI18n(rootDir, mods, ctx) {
  const layers = [{ name: 'data/i18n', dir: path.join(rootDir, 'data/i18n') }, ...mods.map(m => ({ name: `mod:${m.id} i18n`, dir: path.join(m.dir, 'i18n') }))];
  const i18n = {}, errors = [];
  for (const { name, dir } of layers) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
      const lang = file.slice(0, -5), data = readJson(path.join(dir, file));
      if (!/^[a-z]{2}(_[a-z]{2})?$/.test(lang)) { errors.push(`${name}/${file}: file name must be a language code (ko.json, en.json)`); continue; }
      const bad = validate(ctx.schemas['i18n.schema.json'], data, ctx).map(e => `${name}/${file} ${e.path}: ${e.message}`);
      errors.push(...bad);
      if (!bad.length) i18n[lang] = { ...i18n[lang], ...data.strings };
    }
  }
  for (const lang of Object.keys(i18n)) i18n[lang] = Object.fromEntries(Object.entries(i18n[lang]).sort(([a], [b]) => a.localeCompare(b)));
  return { i18n, errors };
}

/** Layers in merge order for one faction: base, designer, then each enabled mod. */
export function layersFor(rootDir, faction, mods) {
  return [
    { name: 'base', dir: path.join(rootDir, 'data/base', faction) },
    { name: 'units', dir: path.join(rootDir, 'data/units', faction) },
    ...mods.map(m => ({ name: `mod:${m.id}`, dir: path.join(m.dir, 'units', faction) })),
  ];
}

export function buildData(rootDir = root) {
  const ctx = loadContext(rootDir);
  const errors = [], warnings = [], overrides = [];
  const { mods, errors: modErrors } = loadMods(rootDir, ctx);
  const vocab = mergeVocab(ctx.vocab, mods, ctx);
  ctx.vocab = vocab.vocab;
  errors.push(...modErrors, ...vocab.errors);
  const profiles = readJson(path.join(rootDir, 'data/schema/profiles.json'));
  const factions = subdirs(path.join(rootDir, 'data/base'));
  errors.push(...strayFiles(rootDir, factions, mods));
  const out = { factions: {} };
  for (const faction of factions) {
    const layers = layersFor(rootDir, faction, mods);
    const merged = {};
    for (const [kind, shape] of Object.entries(UNIT_KINDS)) {
      const data = layers.map(l => ({ name: l.name, data: readJson(path.join(l.dir, `${kind}.json`)) }));
      const r = mergeKind(shape, data);
      merged[kind] = r.data;
      for (const e of r.errors) errors.push(`${faction}/${kind}: ${e}`);
      const where = key => `${faction}/${kind} ${key} (from ${(r.origin[key] || ['?']).join(' → ')})`;
      for (const e of validate(ctx.schemas[`${kind}.schema.json`], r.data, ctx)) {
        const key = e.path.split('.').slice(shape === 'flat' ? 1 : 2, shape === 'flat' ? 2 : 3).join('');
        errors.push(`${where(key)} ${e.path}: ${e.message}`);
      }
      if (profiles[kind]) for (const e of checkGroupedFile(profiles, kind, r.data)) errors.push(`${where(e.path.split('.')[2])}: ${e.message}`);
      // overrides report: each non-base layer's fields next to the base value
      const base = data[0].data || {};
      for (const layer of data.slice(1)) {
        for (const [group, recs] of Object.entries(shape === 'flat' ? { _: layer.data || {} } : layer.data || {})) {
          for (const [id, patch] of Object.entries(recs || {})) {
            const baseRec = shape === 'flat' ? base[id] : Object.values(base).map(g => (shape === 'sections' ? base[group] : g)?.[id]).find(Boolean);
            for (const [field, value] of flatten(patch)) {
              const was = baseRec ? getPath(baseRec, field) : undefined;
              overrides.push({ faction, kind, layer: layer.name, id, field, base: was, value, redundant: JSON.stringify(was) === JSON.stringify(value) });
            }
          }
        }
      }
    }
    const links = checkLinks(merged);
    for (const e of links.errors) errors.push(`${faction}: ${e}`);
    for (const w of links.warnings) warnings.push(`${faction}: ${w}`);
    out.factions[faction] = merged;
  }
  out.layers = { mods: mods.map(m => ({ id: m.id, version: m.version })) };
  const text = mergeI18n(rootDir, mods, ctx);
  errors.push(...text.errors);
  warnings.push(...checkI18n(out.factions, text.i18n).warnings);
  return { out, i18n: text.i18n, errors, warnings, overrides };
}

const flatten = (o, pre = '') => Object.entries(o).flatMap(([k, v]) =>
  v !== null && typeof v === 'object' && !Array.isArray(v) && k !== 'remove' ? flatten(v, `${pre}${k}.`) : [[`${pre}${k}`, v]]);
const getPath = (o, p) => p.split('.').reduce((x, k) => x?.[k], o);

function overridesReport(overrides) {
  const L = ['# Overrides', '', 'Generated by `node tools/build-data.js`. Every field a designer override (`data/units`) or a mod changes, next to the base',
    '(CoH3 import, `data/base`) value. **redundant** = the base now has the same value; the override can go.', ''];
  if (!overrides.length) return L.concat(['No overrides.', '']).join('\n');
  L.push('| Faction | kind | layer | id | field | base | value | |', '| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const o of overrides) L.push(`| ${o.faction} | ${o.kind} | ${o.layer} | ${o.id} | ${o.field} | ${JSON.stringify(o.base) ?? '—'} | ${JSON.stringify(o.value)} | ${o.redundant ? 'redundant' : ''} |`);
  return L.join('\n') + '\n';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const { out, i18n, errors, warnings, overrides } = buildData();
  const outputs = { 'data/generated/units.json': JSON.stringify(out, null, 1) + '\n', 'data/generated/i18n.json': JSON.stringify(i18n, null, 1) + '\n' };
  for (const e of errors.slice(0, 40)) console.log(`error: ${e}`);
  if (errors.length > 40) console.log(`… ${errors.length - 40} more errors`);
  if (!check) {
    fs.mkdirSync(path.join(root, 'data/generated'), { recursive: true });
    for (const [rel, json] of Object.entries(outputs)) fs.writeFileSync(path.join(root, rel), json);
    fs.writeFileSync(path.join(root, 'reports/overrides.md'), overridesReport(overrides));
    fs.writeFileSync(path.join(root, 'reports/data-links.md'), ['# Link warnings', '',
      'Generated by `node tools/build-data.js` (rules in `tools/data-links.js`). Links to things not imported yet; errors stop the build instead.', '',
      ...(warnings.length ? warnings.map(w => `- ${w}`) : ['None.']), ''].join('\n'));
  }
  const staleFiles = check ? Object.entries(outputs).filter(([rel, json]) => !fs.existsSync(path.join(root, rel)) || fs.readFileSync(path.join(root, rel), 'utf8') !== json).map(([rel]) => rel) : [];
  for (const rel of staleFiles) console.log(`error: ${rel} is out of date (run npm run build:data)`);
  const stale = staleFiles.length > 0;
  const n = Object.values(out.factions).reduce((a, f) => a + Object.values(f.sbps).reduce((b, g) => b + Object.keys(g).length, 0), 0);
  console.log(`${errors.length || stale ? 'unit data has errors' : 'unit data ok'}: ${Object.keys(out.factions).length} factions, ${n} squads, ` +
    `${overrides.length} overridden fields, ${warnings.length} link warnings${check ? '' : ' → data/generated/units.json, i18n.json'}`);
  process.exit(errors.length || stale ? 1 : 0);
}
