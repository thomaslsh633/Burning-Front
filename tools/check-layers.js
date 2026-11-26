// Enforces the layer rules of docs/ARCHITECTURE.md on src/, and keeps unit ids out of rule code (logic/ decides by tags,
// traits, classes and flags from data, never by `id === 'sherman_us'`).
// usage: node tools/check-layers.js [root]   (exit 1 on any violation)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Which layers each layer may import.
const ALLOWED = {
  app: ['app', 'presentation', 'logic', 'services'],
  presentation: ['presentation', 'logic', 'services'],
  logic: ['logic'],
  services: ['services'],
};

// Pure code: no browser, storage, clock or unseeded randomness.
const PURE = rel => rel.startsWith('src/logic/') || rel.startsWith('src/services/rng/');
const FORBIDDEN = ['document', 'window', 'globalThis', 'localStorage', 'sessionStorage', 'navigator', 'fetch',
  'Math.random', 'Date', 'performance', 'setTimeout', 'setInterval', 'requestAnimationFrame'];
const FORBIDDEN_RE = new RegExp(`(?<![\\w$.])(${FORBIDDEN.map(s => s.replace('.', '\\.')).join('|')})(?![\\w$])`, 'g');

const IMPORT_RE = /\b(?:import|export)\b[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(?\s*['"]([^'"]+)['"]/g;

// "src/<layer>/<system>/..." → { layer, system }; app is one system.
function where(rel) {
  const p = rel.split('/');
  if (p[0] !== 'src' || !ALLOWED[p[1]]) return null;
  return { layer: p[1], system: p[1] === 'app' ? 'app' : p[2] };
}

// Comments and string literals; a comment is matched first, so quotes inside comments are not strings.
const TOKEN_RE = /\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g;

// Blank out comments and string contents, keeping line breaks, so globals in text are ignored.
function codeOnly(text) {
  return text.replace(TOKEN_RE, m => m.replace(/[^\n]/g, ' '));
}

/** String literals in code (not in comments), without template literals that interpolate. */
function* stringLiterals(text) {
  for (const m of text.matchAll(TOKEN_RE)) {
    if (m[0][0] === '/' || m[0].includes('${')) continue;
    yield { value: m[0].slice(1, -1), index: m.index };
  }
}

/** Weapon, entity, squad and upgrade ids of the built unit data (data/generated/units.json). */
export function unitIds(root) {
  const file = path.join(root, 'data/generated/units.json');
  const ids = new Set();
  if (!fs.existsSync(file)) return ids;
  for (const faction of Object.values(JSON.parse(fs.readFileSync(file, 'utf8')).factions || {})) {
    for (const kind of ['weapon', 'ebps', 'sbps', 'upgrade']) for (const group of Object.values(faction[kind] || {})) for (const id of Object.keys(group)) ids.add(id);
  }
  return ids;
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.m?js$/.test(e.name)) out.push(p);
  }
  return out;
}

export function checkLayers(root) {
  const violations = [];
  const add = (file, line, rule, message) => violations.push({ file, line, rule, message });
  const ids = unitIds(root);

  for (const abs of walk(path.join(root, 'src')).sort()) {
    const rel = path.relative(root, abs).split(path.sep).join('/');
    const from = where(rel);
    if (!from) continue;
    const text = fs.readFileSync(abs, 'utf8');

    for (const m of text.matchAll(IMPORT_RE)) {
      const spec = m[1] ?? m[2];
      const line = lineOf(text, m.index);
      if (!spec.startsWith('.')) { add(rel, line, 'external', `package import '${spec}' (no dependencies allowed)`); continue; }
      const targetRel = path.posix.normalize(path.posix.join(path.posix.dirname(rel), spec));
      const to = where(targetRel);
      if (!to) { add(rel, line, 'layer', `imports '${spec}' outside src/<layer>/`); continue; }
      if (!ALLOWED[from.layer].includes(to.layer)) {
        add(rel, line, 'layer', `${from.layer} may not import ${to.layer} ('${spec}')`); continue;
      }
      const sameSystem = from.layer === to.layer && from.system === to.system;
      const entry = to.layer === 'app' ? 'src/app/index.js' : `src/${to.layer}/${to.system}/index.js`;
      if (!sameSystem && targetRel !== entry) add(rel, line, 'internal', `reach ${to.layer}/${to.system} through ${entry}, not '${spec}'`);
    }

    if (PURE(rel)) {
      const code = codeOnly(text);
      for (const m of code.matchAll(FORBIDDEN_RE)) add(rel, lineOf(code, m.index), 'global', `${m[1]} is not allowed in pure code`);
    }
    if (from.layer === 'logic') {
      for (const s of stringLiterals(text)) {
        if (ids.has(s.value)) add(rel, lineOf(text, s.index), 'unit-id', `'${s.value}' is a unit id; decide by tags, traits, classes or flags from data`);
      }
    }
  }
  return violations;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
  const v = checkLayers(root);
  for (const x of v) console.log(`${x.file}:${x.line}  [${x.rule}] ${x.message}`);
  console.log(v.length ? `${v.length} layer violation(s)` : 'layers ok');
  process.exit(v.length ? 1 : 0);
}
