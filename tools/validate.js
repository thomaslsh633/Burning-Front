// Dependency-free validator for the data files: a small JSON-Schema subset plus the keyword "vocab".
// Supported: type (incl. integer, arrays of types), properties, required, additionalProperties (bool or schema),
// items, minItems, maxItems, enum, const, minimum, maximum, pattern, minLength, propertyNames, anyOf,
// $ref ("file#/$defs/Name" or "#/$defs/Name"),
// vocab ("<list>": the string must be in data/rules/vocab.json lists.<list>), propertyVocab (every object key must be).
// Index entries may be { schema, profile }: the file is grouped by category and each record is checked against
// data/schema/profiles.json (tools/profiles.js).
//
// usage: node tools/validate.js            validate every file listed in data/schema/index.json (exit 1 on errors)
//        node tools/validate.js <schema> <file …>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkGroupedFile } from './profiles.js';

const typeOf = v => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
const matches = (t, v) => t === typeOf(v) || (t === 'number' && typeOf(v) === 'integer');

function resolve(ref, current, opts) {
  const [file, pointer = ''] = ref.split('#');
  const doc = file ? opts.schemas[file] : current.root;
  if (!doc) throw new Error(`schema not loaded: ${file}`);
  const target = pointer.split('/').filter(Boolean).reduce((o, k) => o?.[k], doc);
  if (!target) throw new Error(`bad $ref ${ref}`);
  return { schema: target, root: doc };
}

function check(schema, value, at, ctx, opts, errors) {
  const err = message => errors.push({ path: at, message });
  if (schema.$ref) { const r = resolve(schema.$ref, ctx, opts); return check(r.schema, value, at, { root: r.root }, opts, errors); }
  if (schema.anyOf) {
    if (!schema.anyOf.some(s => { const e = []; check(s, value, at, ctx, opts, e); return e.length === 0; })) err('matches none of anyOf');
    return;
  }
  if (schema.type) {
    const types = [].concat(schema.type);
    if (!types.some(t => matches(t, value))) return err(`expected ${types.join(' or ')}`);
  }
  if ('const' in schema && value !== schema.const) err(`must be ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) err(`not one of ${schema.enum.join(', ')}`);
  if (typeof value === 'number') {
    if (schema.minimum != null && value < schema.minimum) err(`below minimum ${schema.minimum}`);
    if (schema.maximum != null && value > schema.maximum) err(`above maximum ${schema.maximum}`);
  }
  if (typeof value === 'string') {
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) err(`does not match ${schema.pattern}`);
    if (schema.minLength != null && value.length < schema.minLength) err(`shorter than ${schema.minLength}`);
    if (schema.vocab) {
      const list = opts.vocab?.lists?.[schema.vocab];
      if (!list) err(`unknown vocab list ${schema.vocab}`);
      else if (!list.includes(value)) err(`"${value}" not in vocab list ${schema.vocab}`);
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems != null && value.length < schema.minItems) err(`fewer than ${schema.minItems} items`);
    if (schema.maxItems != null && value.length > schema.maxItems) err(`more than ${schema.maxItems} items`);
    if (schema.items) value.forEach((v, i) => check(schema.items, v, `${at}[${i}]`, ctx, opts, errors));
  }
  if (typeOf(value) === 'object') {
    for (const k of schema.required || []) if (!(k in value)) err(`missing required "${k}"`);
    if (schema.propertyVocab) {
      const list = opts.vocab?.lists?.[schema.propertyVocab];
      for (const k of Object.keys(value)) if (!list?.includes(k)) err(`key "${k}" not in vocab list ${schema.propertyVocab}`);
    }
    if (schema.propertyNames) {
      for (const k of Object.keys(value)) {
        const e = [];
        check(schema.propertyNames, k, `${at}.${k}`, ctx, opts, e);
        for (const x of e) errors.push({ path: x.path, message: `key: ${x.message}` });
      }
    }
    for (const [k, v] of Object.entries(value)) {
      const sub = schema.properties?.[k];
      if (sub) check(sub, v, `${at}.${k}`, ctx, opts, errors);
      else if (schema.additionalProperties === false) errors.push({ path: `${at}.${k}`, message: 'unknown property' });
      else if (typeof schema.additionalProperties === 'object') check(schema.additionalProperties, v, `${at}.${k}`, ctx, opts, errors);
    }
  }
}

/** Errors as [{ path, message }]; empty when valid. opts: { vocab, schemas: { "file.schema.json": schema } }. */
export function validate(schema, value, opts = {}) {
  const errors = [];
  check(schema, value, '$', { root: schema }, opts, errors);
  return errors;
}

export function loadContext(root) {
  const dir = path.join(root, 'data/schema');
  const schemas = Object.fromEntries(fs.readdirSync(dir).filter(f => f.endsWith('.schema.json'))
    .map(f => [f, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))]));
  const vocab = JSON.parse(fs.readFileSync(path.join(root, 'data/rules/vocab.json'), 'utf8'));
  return { schemas, vocab };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const opts = loadContext(root);
  const pairs = process.argv.length > 3
    ? process.argv.slice(3).map(f => [f, path.basename(process.argv[2])])
    : Object.entries(JSON.parse(fs.readFileSync(path.join(root, 'data/schema/index.json'), 'utf8')).files);
  const profiles = JSON.parse(fs.readFileSync(path.join(root, 'data/schema/profiles.json'), 'utf8'));
  let bad = 0;
  for (const [file, entry] of pairs) {
    const { schema: schemaName, profile } = typeof entry === 'string' ? { schema: entry } : entry;
    const data = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
    const errors = [...validate(opts.schemas[schemaName], data, opts), ...(profile ? checkGroupedFile(profiles, profile, data) : [])];
    for (const e of errors.slice(0, 20)) console.log(`${file} ${e.path}: ${e.message}`);
    if (errors.length > 20) console.log(`${file}: … ${errors.length - 20} more`);
    bad += errors.length;
  }
  console.log(bad ? `${bad} data error(s)` : `data ok (${pairs.length} files)`);
  process.exit(bad ? 1 : 0);
}
