// Mods: folders under mods/ that change or add unit data and add words to the closed word lists.
// mods/load-order.json lists the enabled ones, first loaded first; tools/build-data.js merges each after data/base and
// data/units with the same merge and the same checks (schema, profile, links), so a broken mod fails the build.
//
//   mods/<id>/mod.json                   manifest: id (= folder), name, version, data_format, load_after
//   mods/<id>/units/<faction>/<kind>.json same layout and merge rules as data/units (overrides, new records, remove)
//   mods/<id>/rules/vocab.json            { "lists": { <existing list>: [new words] } }
import fs from 'node:fs';
import path from 'node:path';
import { validate } from './validate.js';

const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const issues = (where, errs) => errs.map(e => `${where} ${e.path}: ${e.message}`);

/**
 * Enabled mods in load order. ctx: { schemas, vocab } (tools/validate.js loadContext).
 * → { mods: [{ id, name, version, dir, manifest }], errors: [string] }
 */
export function loadMods(rootDir, ctx) {
  const orderFile = path.join(rootDir, 'mods/load-order.json');
  if (!fs.existsSync(orderFile)) return { mods: [], errors: [] };
  const order = readJson(orderFile);
  const errors = issues('mods/load-order.json', validate(ctx.schemas['load-order.schema.json'], order, ctx));
  if (errors.length) return { mods: [], errors };
  const format = readJson(path.join(rootDir, 'data/schema/index.json')).data_format;
  const enabled = order.enabled, mods = [];
  enabled.forEach((id, i) => {
    if (enabled.indexOf(id) !== i) { errors.push(`mods/load-order.json: "${id}" is listed twice`); return; }
    const dir = path.join(rootDir, 'mods', id), file = path.join(dir, 'mod.json');
    if (!fs.existsSync(file)) { errors.push(`mod:${id}: no mods/${id}/mod.json`); return; }
    const manifest = readJson(file);
    const bad = issues(`mod:${id} mod.json`, validate(ctx.schemas['mod.schema.json'], manifest, ctx));
    if (manifest.id !== id) bad.push(`mod:${id} mod.json: id "${manifest.id}" must match its folder name`);
    if (manifest.data_format !== format) bad.push(`mod:${id}: written for data format ${manifest.data_format}, the game uses ${format}`);
    for (const after of manifest.load_after || []) {
      const j = enabled.indexOf(after);
      if (j > i) bad.push(`mod:${id}: must load after "${after}"; move "${after}" above it in mods/load-order.json`);
    }
    errors.push(...bad);
    if (!bad.length) mods.push({ id, name: manifest.name, version: manifest.version, dir, manifest });
  });
  return { mods, errors };
}

/** The word lists with each mod's additions. A mod may add words to an existing list, not create a list. → { vocab, errors } */
export function mergeVocab(vocab, mods, ctx) {
  const out = structuredClone(vocab), errors = [];
  for (const mod of mods) {
    const file = path.join(mod.dir, 'rules/vocab.json');
    if (!fs.existsSync(file)) continue;
    const add = readJson(file), where = `mod:${mod.id} rules/vocab.json`;
    const bad = issues(where, validate(ctx.schemas['mod-vocab.schema.json'], add, ctx));
    for (const list of Object.keys(add.lists || {})) if (!out.lists[list]) bad.push(`${where}: no word list "${list}" (a mod can only add words to an existing list)`);
    errors.push(...bad);
    if (bad.length) continue;
    for (const [list, words] of Object.entries(add.lists)) out.lists[list] = [...new Set([...out.lists[list], ...words])];
  }
  return { vocab: out, errors };
}
