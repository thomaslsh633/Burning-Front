// Bundles the src/ ES modules into one classic script with a small module registry.
// Supported: static import / export (named, default, namespace, re-export) and JSON modules.
// Refused: bare specifiers (no npm), dynamic import(), import.meta, import cycles.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const acorn = require('../vendor/acorn.js');

export class BuildError extends Error {
  constructor(message) { super(message); this.name = 'BuildError'; }
}

const toId = (root, file) => path.relative(root, file).split(path.sep).join('/');

export function parseModule(code, id) {
  try {
    return acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
  } catch (e) {
    throw new BuildError(`${id}: ${e.message}`);
  }
}

function resolveSpec(root, fromFile, spec, id) {
  if (!spec.startsWith('./') && !spec.startsWith('../')) {
    throw new BuildError(`${id}: import '${spec}' is not a relative path (no packages in the game bundle)`);
  }
  if (!spec.endsWith('.js') && !spec.endsWith('.json')) {
    throw new BuildError(`${id}: import '${spec}' must name the file with its .js or .json extension`);
  }
  const file = path.resolve(path.dirname(fromFile), spec);
  if (!fs.existsSync(file)) throw new BuildError(`${id}: import '${spec}' not found`);
  return file;
}

// Generic walk over every AST node; visit(node, parent) is called for each one.
export function walk(node, visit, parent = null) {
  visit(node, parent);
  for (const key of Object.keys(node)) {
    if (key === 'loc') continue;
    const v = node[key];
    if (Array.isArray(v)) { for (const c of v) if (c && typeof c.type === 'string') walk(c, visit, node); }
    else if (v && typeof v.type === 'string') walk(v, visit, node);
  }
}

// Reads every module reachable from the entry, in dependency order (dependencies first).
export function collect(root, entryFile) {
  const modules = new Map();
  const order = [];
  const stack = [];
  const visit = (file) => {
    const id = toId(root, file);
    if (modules.has(id)) {
      const i = stack.indexOf(id);
      if (i >= 0) throw new BuildError(`import cycle: ${[...stack.slice(i), id].join(' -> ')}`);
      return id;
    }
    const code = fs.readFileSync(file, 'utf8');
    const mod = { id, file, code, json: file.endsWith('.json'), ast: null, deps: [] };
    modules.set(id, mod);
    stack.push(id);
    if (!mod.json) {
      mod.ast = parseModule(code, id);
      walk(mod.ast, (n) => {
        if (n.type === 'ImportExpression') throw new BuildError(`${id}:${n.loc.start.line}: dynamic import() is not supported`);
        if (n.type === 'MetaProperty' && n.meta.name === 'import') throw new BuildError(`${id}:${n.loc.start.line}: import.meta is not supported`);
      });
      for (const node of mod.ast.body) {
        if (node.source && /^(Import|ExportNamed|ExportAll)Declaration$/.test(node.type)) {
          const depId = visit(resolveSpec(root, file, node.source.value, id));
          node.source.depId = depId;
          mod.deps.push(depId);
        }
      }
    } else {
      try { JSON.parse(code); } catch (e) { throw new BuildError(`${id}: invalid JSON (${e.message})`); }
    }
    stack.pop();
    order.push(id);
    return id;
  };
  visit(entryFile);
  return order.map(id => modules.get(id));
}

const patternNames = (p, out = []) => {
  if (!p) return out;
  if (p.type === 'Identifier') out.push(p.name);
  else if (p.type === 'ObjectPattern') p.properties.forEach(q => patternNames(q.type === 'RestElement' ? q.argument : q.value, out));
  else if (p.type === 'ArrayPattern') p.elements.forEach(e => patternNames(e, out));
  else if (p.type === 'RestElement') patternNames(p.argument, out);
  else if (p.type === 'AssignmentPattern') patternNames(p.left, out);
  return out;
};
const nameOf = (n) => (n.type === 'Literal' ? String(n.value) : n.name);
const req = (depId) => `__req(${JSON.stringify(depId)})`;

// Turns one ES module into a registry entry: imports become __req() lookups, exports become __exports fields.
export function transform(mod) {
  if (mod.json) return `__def(${JSON.stringify(mod.id)}, function (__exports) { __exports.default = ${mod.code.trim()}; });`;
  const edits = [];
  const tail = [];
  let n = 0;
  for (const node of mod.ast.body) {
    const dep = node.source && node.source.depId;
    if (node.type === 'ImportDeclaration') {
      const lines = [];
      const named = [];
      for (const s of node.specifiers) {
        if (s.type === 'ImportDefaultSpecifier') lines.push(`const ${s.local.name} = ${req(dep)}.default;`);
        else if (s.type === 'ImportNamespaceSpecifier') lines.push(`const ${s.local.name} = ${req(dep)};`);
        else named.push(`${nameOf(s.imported) === s.local.name ? s.local.name : `${JSON.stringify(nameOf(s.imported))}: ${s.local.name}`}`);
      }
      if (named.length) lines.push(`const { ${named.join(', ')} } = ${req(dep)};`);
      if (!node.specifiers.length) lines.push(`${req(dep)};`);
      edits.push({ start: node.start, end: node.end, text: lines.join(' ') });
    } else if (node.type === 'ExportNamedDeclaration' && node.source) {
      const r = `__r${n++}`;
      const sets = node.specifiers.map(s => `__exports[${JSON.stringify(nameOf(s.exported))}] = ${r}[${JSON.stringify(nameOf(s.local))}];`);
      edits.push({ start: node.start, end: node.end, text: `{ const ${r} = ${req(dep)}; ${sets.join(' ')} }` });
    } else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
      const d = node.declaration;
      edits.push({ start: node.start, end: d.start, text: '' });
      const names = d.type === 'VariableDeclaration' ? d.declarations.flatMap(x => patternNames(x.id)) : [d.id.name];
      names.forEach(nm => tail.push(`__exports.${nm} = ${nm};`));
    } else if (node.type === 'ExportNamedDeclaration') {
      edits.push({ start: node.start, end: node.end, text: '' });
      node.specifiers.forEach(s => tail.push(`__exports[${JSON.stringify(nameOf(s.exported))}] = ${s.local.name};`));
    } else if (node.type === 'ExportDefaultDeclaration') {
      const d = node.declaration;
      const isDecl = d.type === 'FunctionDeclaration' || d.type === 'ClassDeclaration';
      if (isDecl && d.id) {
        edits.push({ start: node.start, end: d.start, text: '' });
        tail.push(`__exports.default = ${d.id.name};`);
      } else {
        edits.push({ start: node.start, end: d.start, text: 'const __default = ' });
        if (isDecl) edits.push({ start: node.end, end: node.end, text: ';' });
        tail.push('__exports.default = __default;');
      }
    } else if (node.type === 'ExportAllDeclaration') {
      const r = `__r${n++}`;
      const text = node.exported
        ? `__exports[${JSON.stringify(nameOf(node.exported))}] = ${req(dep)};`
        : `{ const ${r} = ${req(dep)}; for (const k in ${r}) if (k !== 'default') __exports[k] = ${r}[k]; }`;
      edits.push({ start: node.start, end: node.end, text });
    }
  }
  let code = mod.code;
  for (const e of edits.sort((a, b) => b.start - a.start)) code = code.slice(0, e.start) + e.text + code.slice(e.end);
  return `__def(${JSON.stringify(mod.id)}, function (__exports, __req) {\n'use strict';\n${code.trimEnd()}\n${tail.join('\n')}\n});`;
}

const RUNTIME = `const __mods = Object.create(null), __done = Object.create(null);
function __def(id, fn) { __mods[id] = fn; }
function __req(id) { let e = __done[id]; if (e) return e; e = __done[id] = {}; __mods[id](e, __req); return e; }`;

// Whole bundle as one classic script: the registry, every module, then the entry is run.
export function bundle(modules, entryId) {
  const body = modules.map(transform).join('\n\n');
  return `(function () {\n'use strict';\n${RUNTIME}\n\n${body}\n\n__req(${JSON.stringify(entryId)});\n})();`;
}
