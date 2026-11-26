#!/usr/bin/env node
// Find where a symbol is declared / assigned / used, as file:line in the source tree.
// usage: node tools/where.js <name> [--uses]        (run from the project root)
//        node tools/where.js --list [filter]        list every top-level declaration (name  file:line)
// Needs acorn (tools/node_modules) — only for this helper, the build itself has no dependencies.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const acorn = require('./vendor/acorn.js');
const files = fs.readFileSync(path.join(root, 'manifest.txt'), 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
const jsFiles = files.filter(f => f.endsWith('.js'));
const map = []; let code = '', line = 1;
for (const f of jsFiles) { const t = fs.readFileSync(path.join(root, f), 'utf8'); map.push([line, f]); code += t; line += t.split('\n').length - 1; }
const loc = ln => { let k = 0; for (let i = 0; i < map.length; i++) if (map[i][0] <= ln) k = i; return `${map[k][1]}:${ln - map[k][0] + 1}`; };
const ast = acorn.parse(code, { ecmaVersion: 'latest', locations: true });
const arg = process.argv[2];
if (!arg) { console.log('usage: node tools/where.js <name> [--uses] | --list [filter]'); process.exit(1); }
if (arg === '--list') {
  const flt = process.argv[3] || '';
  const out = [];
  const add = (n, k) => { if (n.includes(flt)) out.push(`${n.padEnd(32)} ${k.padEnd(5)} ${loc(arguments[2])}`); };
  const scan = body => body.forEach(n => {
    if (n.type === 'FunctionDeclaration') out.push([n.id.name, 'fn', n.loc.start.line]);
    else if (n.type === 'VariableDeclaration') n.declarations.forEach(d => d.id.type === 'Identifier' && out.push([d.id.name, n.kind, d.loc.start.line]));
    else if (n.type === 'ClassDeclaration') out.push([n.id.name, 'class', n.loc.start.line]);
    else if (n.type === 'BlockStatement') scan(n.body);
  });
  scan(ast.body);
  out.filter(x => x[0].includes(flt)).forEach(x => console.log(`${x[0].padEnd(32)} ${x[1].padEnd(5)} ${loc(x[2])}`));
  process.exit(0);
}
const name = arg, uses = process.argv.includes('--uses');
const decl = [], assign = [], used = [];
(function walk(n, p) {
  if (!n || typeof n.type !== 'string') return;
  if ((n.type === 'FunctionDeclaration' || n.type === 'ClassDeclaration') && n.id && n.id.name === name) decl.push(n.loc.start.line);
  if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.id.name === name) decl.push(n.loc.start.line);
  if (n.type === 'AssignmentExpression' && n.left.type === 'Identifier' && n.left.name === name) assign.push(n.loc.start.line);
  if (n.type === 'AssignmentExpression' && n.left.type === 'MemberExpression' && !n.left.computed && n.left.property.name === name) assign.push(n.loc.start.line);
  if (n.type === 'Identifier' && n.name === name) used.push(n.loc.start.line);
  for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(c => walk(c, n)); else if (v && typeof v.type === 'string') walk(v, n); }
})(ast, null);
const chain = path.join(root, 'js', 'chains', name + '.js');
console.log(`declared: ${[...new Set(decl)].map(loc).join(', ') || '-'}`);
if (assign.length) console.log(`assigned: ${[...new Set(assign)].map(loc).join(', ')}`);
if (fs.existsSync(chain)) {
  const baseDecl = []; (function w(n) { if (!n || typeof n.type !== 'string') return; if (n.type === 'FunctionDeclaration' && n.id.name === name + '__base') baseDecl.push(n.loc.start.line);
    for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(w); else if (v && typeof v.type === 'string') w(v); } })(ast);
  console.log(`wrapper chain: js/chains/${name}.js — read it for the full behaviour` + (baseDecl.length ? `; original body ${name}__base at ${loc(baseDecl[0])}` : '; original body was replaced'));
}
const u = [...new Set(used)].filter(l => !decl.includes(l));
console.log(`used on ${u.length} line(s)${uses ? '\n  ' + u.map(loc).join('\n  ') : ' (add --uses to list)'}`);
