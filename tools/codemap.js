#!/usr/bin/env node
// Refreshes the AUTO file table in CODEMAP.md: every file under src/, data/ and tests/ with its line count
// and the text of its first comment line.  usage: node tools/codemap.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SECTIONS = [['src', 'Game (src/)'], ['data', 'Data (data/)'], ['tests', 'Tests (tests/)']];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap(d => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]))
  .sort();

function purpose(file, text) {
  if (file.endsWith('.json')) return 'data';
  const first = text.split('\n').find(l => l.trim());
  const m = first && /^\s*(?:\/\/|\/\*|<!--)\s*(.*?)\s*(?:\*\/|-->)?\s*$/.exec(first);
  return m ? m[1] : '';
}

const rows = [];
for (const [dir, title] of SECTIONS) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) continue;
  rows.push('', `### ${title}`, '', '| file | lines | owns |', '|---|---:|---|');
  for (const f of walk(full)) {
    const text = fs.readFileSync(f, 'utf8');
    const rel = path.relative(root, f).split(path.sep).join('/');
    rows.push(`| \`${rel}\` | ${text.split('\n').length} | ${purpose(f, text).replace(/\|/g, '\\|')} |`);
  }
}

const file = path.join(root, 'CODEMAP.md');
const doc = fs.readFileSync(file, 'utf8');
const begin = '<!-- AUTO:FILES -->';
const end = '<!-- /AUTO:FILES -->';
const i = doc.indexOf(begin);
const j = doc.indexOf(end);
if (i < 0 || j < 0) { console.error('CODEMAP.md has no AUTO:FILES markers'); process.exit(1); }
fs.writeFileSync(file, doc.slice(0, i + begin.length) + rows.join('\n') + '\n' + doc.slice(j));
console.log('CODEMAP.md file table refreshed');
