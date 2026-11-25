// Enforces the layer rules of docs/ARCHITECTURE.md on src/.
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

// Blank out comments and string contents, keeping line breaks, so globals in text are ignored.
function codeOnly(text) {
  return text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g,
    m => m.replace(/[^\n]/g, ' '));
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
