// Print top-level statement line ranges of the game script, plus marker lines and whether they are safe cut points.
const fs = require('fs');
const acorn = require('acorn');
const [, , htmlPath, jsStart, jsEnd] = process.argv;
const lines = fs.readFileSync(htmlPath, 'utf8').split('\n');
const s = +jsStart, e = +jsEnd; // 1-based inclusive
const js = lines.slice(s - 1, e).join('\n');
const ast = acorn.parse(js, { ecmaVersion: 'latest', sourceType: 'script', locations: true });
const ranges = ast.body.map(n => [n.loc.start.line + s - 1, n.loc.end.line + s - 1, n.type]);
fs.writeFileSync('/home/claude/tools/toplevel.json', JSON.stringify(ranges));
// a line L is a safe cut (start of new file) if no top-level statement spans across it: start < L <= end
const inside = L => ranges.some(([a, b]) => a < L && L <= b);
const markers = [];
for (let i = s; i <= e; i++) {
  if (/^\s*\/\/\s*\[(v\d+|\d{2}[^\]]*|19|18)\]/.test(lines[i - 1]) && i > +(process.env.TOC_END||0)) markers.push(i);
}
console.log('statements', ranges.length);
for (const m of markers) if (inside(m)) console.log('UNSAFE', m, lines[m - 1].slice(0, 80));
console.log('markers', markers.length);
