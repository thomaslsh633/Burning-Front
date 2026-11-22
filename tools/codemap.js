#!/usr/bin/env node
// Regenerate the AUTO sections of CODEMAP.md from the source tree (file table, wrapper chains, shared listeners).
// usage: node tools/codemap.js        (run from the project root; build.js also calls it when tools/ has acorn)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const files = fs.readFileSync(path.join(root, 'manifest.txt'), 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
const MARK = /^\s*\/\/\s*\[([^\]]+)\]\s*(.*)$/;
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s).replace(/\|/g, '/');

// ---- file table ----
const rows = [];
let jsAll = '';
for (const f of files) {
  const t = fs.readFileSync(path.join(root, f), 'utf8');
  const lines = t.split('\n').length - 1, kb = Buffer.byteLength(t) / 1024;
  let head = '';
  if (f.endsWith('.js')) {
    jsAll += t;
    const m = t.split('\n').slice(0, 12).map(l => MARK.exec(l)).find(Boolean);
    head = m ? `[${m[1]}] ${m[2]}` : (t.split('\n').find(l => /\S/.test(l)) || '').trim();
    if (f.startsWith('js/chains/')) continue;   // listed in the chain table
  } else head = f.startsWith('assets/') ? 'embedded web fonts (base64) — never needs reading' : f.startsWith('css/') ? 'styles' : 'markup';
  rows.push(`| ${f.replace(/^js\//, '')} | ${lines} | ${kb.toFixed(0)} | ${clip(head.trim().replace(/^\[[^\]]+\]\s*/, ''), 72)} |`);
}
const fileTable = ['(paths under js/ unless shown)\n\n| file | lines | KB | header |', '|---|---:|---:|---|', ...rows].join('\n');

// ---- chains ----
const chainDir = path.join(root, 'js', 'chains');
const chains = fs.existsSync(chainDir) ? fs.readdirSync(chainDir).filter(f => f.endsWith('.js')).sort() : [];
const chainRows = chains.map(f => {
  const t = fs.readFileSync(path.join(chainDir, f), 'utf8');
  const order = (/Call order, outermost first: (.*)/.exec(t) || [, ''])[1];
  const n = order ? order.split(' → ').length : 0;
  return { f, n, order };
}).sort((a, b) => b.n - a.n);
const chainTable = 'Function (layer count) — file is `js/chains/<function>.js`:\n' +
  chainRows.map(c => `${c.f.replace(/\.js$/, '')} (${c.n})`).join(' · ');

// ---- shared DOM listeners (several handlers on one element+event run in registration = file order) ----
const lis = {};
const re = /([A-Za-z_$][\w$.]*(?:\([^)]*\))?)\.addEventListener\(\s*['"]([a-z]+)['"]/g;
let off = 0;
const fileStarts = [];
for (const f of files.filter(x => x.endsWith('.js'))) { const t = fs.readFileSync(path.join(root, f), 'utf8'); fileStarts.push([off, f, t]); off += t.length; }
for (const [, f, t] of fileStarts) {
  let m; re.lastIndex = 0;
  while ((m = re.exec(t))) { const k = `${m[1]} · ${m[2]}`; const ln = t.slice(0, m.index).split('\n').length; (lis[k] = lis[k] || []).push(`${f}:${ln}`); }
}
const multi = Object.entries(lis).filter(([k, v]) => v.length > 1 && /^[A-Za-z_$][\w$]{2,}(\.[\w$]+)* · /.test(k) && !/^(el|btn|b|g|x|e|it|row|box) · /.test(k)).sort((a, b) => b[1].length - a[1].length);
const lisTable = ['| element · event | handlers | where (in run order) |', '|---|---:|---|',
  ...multi.map(([k, v]) => `| ${k.replace(/\|/g, '/')} | ${v.length} | ${v.join(', ')} |`)].join('\n');

// ---- write ----
const cm = path.join(root, 'CODEMAP.md');
let doc = fs.readFileSync(cm, 'utf8');
const put = (tag, body) => { doc = doc.replace(new RegExp(`(<!-- AUTO:${tag} -->)[\\s\\S]*?(<!-- /AUTO:${tag} -->)`), `$1\n${body}\n$2`); };
put('CHAINS', chainTable); put('LISTENERS', lisTable);
put('STATS', `${files.length} files · ${files.filter(f => f.endsWith('.js')).length} JS files · ${chains.length} wrapper chains · ` +
  `${(fs.readFileSync(path.join(root, 'manifest.txt'), 'utf8'), files.reduce((a, f) => a + fs.statSync(path.join(root, f)).size, 0) / 1024).toFixed(0)} KB total`);
fs.writeFileSync(cm, doc);
const fm = path.join(root, 'FILES.md');
if (fs.existsSync(fm)) fs.writeFileSync(fm, fs.readFileSync(fm, 'utf8').replace(/(<!-- AUTO:FILES -->)[\s\S]*?(<!-- \/AUTO:FILES -->)/, `$1\n${fileTable}\n$2`));
console.log('CODEMAP.md and FILES.md updated');
