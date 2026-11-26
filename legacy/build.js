#!/usr/bin/env node
// Build the single-file game from the source tree.
// usage: node build.js [out.html]     (default: dist/burning_front_v<VERSION>.html)
// Every %%VERSION%% in the sources is replaced by the number in VERSION (title, in-game version, save tag).
// No dependencies. Files listed in manifest.txt are concatenated in order; the trailing newline of the
// last file is dropped so a re-split of the output reproduces the same files.
const fs = require('fs');
const path = require('path');
const root = __dirname;
const ver = fs.existsSync(path.join(root, 'VERSION')) ? fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim() : 'dev';
const out = process.argv[2] || path.join(root, 'dist', `burning_front_v${ver}.html`);
const files = fs.readFileSync(path.join(root, 'manifest.txt'), 'utf8')
  .split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
const missing = files.filter(f => !fs.existsSync(path.join(root, f)));
if (missing.length) { console.error('missing files:\n  ' + missing.join('\n  ')); process.exit(1); }
let html = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('');
if (html.endsWith('\n')) html = html.slice(0, -1);
html = html.split('%%VERSION%%').join(ver);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`built ${path.relative(process.cwd(), out) || out} (${files.length} files, ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
