// Remove unreferenced top-level function declarations (and `const f = () => ...` / function-expression consts).
// A name counts as referenced if it appears as a whole word anywhere in the file outside its own declaration —
// including HTML, strings and comments — so string-based lookups are never broken. Repeats until stable.
// usage: node deadcode.js <in.html> <out.html> [--report r.json]
const fs = require('fs'), acorn = require('acorn');
const [inp, outp] = process.argv.slice(2);
const ri = process.argv.indexOf('--report');
let html = fs.readFileSync(inp, 'utf8');
const removed = [];
for (let pass = 0; pass < 20; pass++) {
  const sOpen = html.indexOf('<script>\n') + 9, sClose = html.lastIndexOf('</script>');
  const js = html.slice(sOpen, sClose);
  const ast = acorn.parse(js, { ecmaVersion: 'latest', ranges: true });
  const cands = [];
  const visit = (body) => {
    for (const n of body) {
      if (n.type === 'FunctionDeclaration') cands.push({ name: n.id.name, range: n.range });
      else if (n.type === 'VariableDeclaration' && n.declarations.length === 1) {
        const d = n.declarations[0];
        if (d.id.type === 'Identifier' && d.init && /^(ArrowFunctionExpression|FunctionExpression)$/.test(d.init.type)) cands.push({ name: d.id.name, range: n.range });
      } else if (n.type === 'BlockStatement') visit(n.body);
    }
  };
  visit(ast.body);
  const outside = (name, range) => {
    const re = new RegExp(`(^|[^\\w$])${name.replace(/\$/g, '\\$')}(?![\\w$])`, 'g');
    const own = js.slice(...range);
    const total = (html.match(re) || []).length, inOwn = (own.match(re) || []).length;
    return total - inOwn;
  };
  const dead = cands.filter(c => outside(c.name, c.range) === 0);
  if (!dead.length) break;
  dead.sort((a, b) => b.range[0] - a.range[0]);
  let out = js;
  for (const d of dead) {
    // take the comment lines directly above too, if they are only about this function (no blank line between)
    let a = d.range[0];
    out = out.slice(0, a) + out.slice(d.range[1]).replace(/^;?[ \t]*/, '');
    removed.push({ name: d.name, pass, bytes: d.range[1] - d.range[0] });
  }
  html = html.slice(0, sOpen) + out + html.slice(sClose);
}
fs.writeFileSync(outp, html);
if (ri > 0) fs.writeFileSync(process.argv[ri + 1], JSON.stringify(removed, null, 1));
console.log('removed', removed.length, 'functions,', (removed.reduce((a, b) => a + b.bytes, 0) / 1024).toFixed(0), 'KB');
