// Collapse wrapper chains (`const o = F; F = function () { ... o.apply(this, arguments) ... }`) into named layer
// functions gathered in one place. Exact transform: each layer keeps its body; the alias it called is replaced by the
// name of the layer it captured. The outermost layer keeps the public name F, the original declaration becomes F__base.
//
// usage: node merge.js <in.html> <out.html> [--only a,b] [--skip a,b] [--report report.json]
const fs = require('fs'), acorn = require('acorn'), escope = require('eslint-scope');
const argv = process.argv.slice(2);
const [inp, outp] = argv;
const opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const only = opt('--only') ? new Set(opt('--only').split(',')) : null;
const skip = new Set((opt('--skip') || '').split(',').filter(Boolean));

const html = fs.readFileSync(inp, 'utf8');
const sOpen = html.indexOf('<script>\n') + '<script>\n'.length;
const sClose = html.lastIndexOf('</script>');
const js = html.slice(sOpen, sClose);
const ast = acorn.parse(js, { ecmaVersion: 2022, sourceType: 'script', ranges: true, locations: true });
const sm = escope.analyze(ast, { ecmaVersion: 2022, sourceType: 'script', nodejsScope: true });
const G = sm.globalScope.childScopes[0];   // nodejsScope: top level becomes a resolvable function scope
if (!G || G.block !== ast) throw new Error('scope setup');
const lineOf = pos => js.slice(0, pos).split('\n').length;

// ---- section markers → tags for naming ----
const MARK = /^\s*\/\/\s*\[(v\d+|\d{2}[^\]]*|19|18)\]\s*(.*)$/;
const marks = [];
{ let off = 0; for (const ln of js.split('\n')) { const m = MARK.exec(ln); if (m) marks.push([off, m[1], m[2]]); off += ln.length + 1; } }
const tagAt = pos => { let t = null; for (const m of marks) { if (m[0] <= pos) t = m; else break; } return t; };
const verOf = pos => { const t = tagAt(pos); if (!t) return 'x'; if (/^v\d+$/.test(t[1])) return t[1]; const v = /\bv(\d+)/.exec(t[2]); return v ? 'v' + v[1] : 's' + t[1].replace(/[^0-9a-z]/gi, ''); };

// ---- parent map ----
const parent = new Map();
(function walk(n, p) { if (!n || typeof n.type !== 'string') return; parent.set(n, p);
  for (const k of Object.keys(n)) { const v = n[k]; if (k === 'parent') continue;
    if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && walk(c, n)); else if (v && typeof v.type === 'string') walk(v, n); } })(ast, null);
const chainOk = n => { for (let p = parent.get(n); p; p = parent.get(p)) if (p.type !== 'BlockStatement' && p.type !== 'Program') return false; return true; };
const inRange = (n, r) => n.range[0] >= r[0] && n.range[1] <= r[1];
const scopeIsInside = (sc, fn) => { for (let s = sc; s; s = s.upper) if (s.block === fn) return true; return false; };

const bases = new Map(); ast.body.forEach(n => n.type === 'FunctionDeclaration' && bases.set(n.id.name, n));
const report = { merged: {}, rejected: {} };
const edits = []; // [start, end, text]
const chainsOut = [];
const declRemove = new Map(); // VariableDeclaration -> Set(declarators to drop)

for (const [F, baseNode] of bases) {
  if (only && !only.has(F)) continue;
  if (skip.has(F)) { report.rejected[F] = 'skipped by option'; continue; }
  const v = G.set.get(F); if (!v) continue;
  const writes = v.references.filter(r => r.isWrite());
  if (!writes.length) continue;
  const why = [];
  const layers = [];
  for (const w of writes) {
    const as = parent.get(w.identifier);
    const st = as && parent.get(as);
    if (!as || as.type !== 'AssignmentExpression' || as.operator !== '=' || !/Function/.test(as.right.type) || !st || st.type !== 'ExpressionStatement') { why.push(`non-function write @${lineOf(w.identifier.range[0])}`); continue; }
    if (!chainOk(st)) { why.push(`conditional/runtime install @${lineOf(st.range[0])}`); continue; }
    if (as.right.type === 'ArrowFunctionExpression' && /\barguments\b|\bthis\b/.test(js.slice(...as.right.range))) { why.push(`arrow uses this/arguments @${lineOf(st.range[0])}`); continue; }
    layers.push({ st, fn: as.right, pos: st.range[0] });
  }
  if (why.length) { report.rejected[F] = why.join('; '); continue; }
  layers.sort((a, b) => a.pos - b.pos);
  // aliases: `const X = F` declared at load time → captures the layer installed most recently before it
  const aliases = [];
  for (const r of v.references) {
    if (r.isWrite()) continue;
    const d = parent.get(r.identifier);
    if (d && d.type === 'VariableDeclarator' && d.init === r.identifier && d.id.type === 'Identifier') {
      const decl = parent.get(d);
      if (!chainOk(decl)) { why.push(`alias in conditional code @${lineOf(d.range[0])}`); continue; }
      const captured = layers.filter(l => l.pos < d.range[0]).length; // 0 = base
      // find the alias variable object
      const av = sm.getDeclaredVariables(d)[0];
      aliases.push({ name: d.id.name, d, decl, captured, av });
    }
  }
  // every alias use must sit inside exactly one layer function (that is: be the layer's "next" call)
  for (const a of aliases) {
    for (const ref of a.av.references) {
      if (ref.identifier === a.d.id) continue;
      const home = layers.find(l => inRange(ref.identifier, l.fn.range));
      if (!home) { why.push(`alias ${a.name} used outside a layer @${lineOf(ref.identifier.range[0])}`); break; }
      (home.uses = home.uses || []).push({ ref, a });
    }
  }
  // free variables of each layer must be globals (or the aliases being replaced)
  for (const l of layers) {
    const fsc = sm.acquire(l.fn);
    const stack = [fsc];
    while (stack.length) {
      const sc = stack.pop(); stack.push(...sc.childScopes);
      for (const ref of sc.references) {
        const rv = ref.resolved;
        if (!rv) continue;                                 // implicit global (window, Math, ...)
        if (rv.scope === G) continue;
        if (scopeIsInside(rv.scope, l.fn)) continue;       // declared inside the layer
        if (aliases.some(a => a.av === rv)) continue;
        why.push(`layer @${lineOf(l.pos)} uses block-local '${rv.name}'`);
      }
    }
  }
  // value references of F evaluated at load time (outside any function) other than alias inits
  for (const r of v.references) {
    if (r.isWrite()) continue;
    const id = r.identifier, p = parent.get(id);
    if (p && p.type === 'VariableDeclarator' && p.init === id) continue;
    let inFn = false; for (let q = p; q; q = parent.get(q)) if (/Function/.test(q.type)) { inFn = true; break; }
    if (!inFn) why.push(`load-time reference @${lineOf(id.range[0])}`);
  }
  if (why.length) { report.rejected[F] = [...new Set(why)].join('; '); continue; }

  // ---- names ----
  const n = layers.length;
  const used = new Map();
  const names = layers.map((l, i) => {
    if (i === n - 1) return F;
    const al = (l.uses || [])[0], an = al && /(\d+)$/.exec(al.a.name);
    let nm = `${F}__${an && +an[1] >= 10 ? 'v' + an[1] : verOf(l.pos)}`; const k = (used.get(nm) || 0) + 1; used.set(nm, k); return k > 1 ? `${nm}_${k}` : nm;
  });
  const fixDup = new Set(); names.forEach((x, i) => { if (names.indexOf(x) !== i) fixDup.add(x); });
  const nameOfCaptured = c => c === 0 ? `${F}__base` : names[c - 1];

  // ---- layer source with alias refs replaced ----
  const pieces = layers.map((l, i) => {
    const fn = l.fn; let src = js.slice(...fn.range);
    const reps = (l.uses || []).map(u => [u.ref.identifier.range[0] - fn.range[0], u.ref.identifier.range[1] - fn.range[0], nameOfCaptured(u.a.captured)]).sort((a, b) => b[0] - a[0]);
    for (const [a, b, t] of reps) src = src.slice(0, a) + t + src.slice(b);
    const nm = names[i];
    if (fn.type === 'FunctionExpression') {
      src = src.replace(/^(async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)?\s*\(/, (m, as) => `${as || ''}function ${nm}(`);
    } else { // arrow
      const body = js.slice(...fn.body.range), params = fn.params.map(p => js.slice(...p.range)).join(', ');
      let b2 = body; for (const [a, b, t] of reps) { /* already applied on src; recompute body from src */ }
      const arrowSrc = src, ix = arrowSrc.indexOf('=>');
      let bodyTxt = arrowSrc.slice(ix + 2).trim();
      src = `${fn.async ? 'async ' : ''}function ${nm}(${params}) ` + (fn.body.type === 'BlockStatement' ? bodyTxt : `{ return ${bodyTxt}; }`);
    }
    const tag = tagAt(l.pos);
    return { nm, src, where: tag ? `[${tag[1]}]` : '', line: lineOf(l.pos), calls: [...new Set((l.uses || []).map(u => nameOfCaptured(u.a.captured)))] };
  });

  // ---- reachability: a layer that never calls the one below makes everything under it dead ----
  const reach = new Set([F]), byName = new Map(pieces.map(p => [p.nm, p]));
  for (let changed = true; changed;) { changed = false;
    for (const p of pieces) if (reach.has(p.nm)) for (const c of p.calls) if (!reach.has(c)) { reach.add(c); changed = true; } }
  const live = pieces.filter(p => reach.has(p.nm));
  const baseLive = reach.has(`${F}__base`);
  const pruned = pieces.length - live.length + (baseLive ? 0 : 1);
  pieces.splice(0, pieces.length, ...live);

  // ---- edits in place ----
  if (baseLive) edits.push([baseNode.id.range[0], baseNode.id.range[1], `${F}__base`]);
  else edits.push([baseNode.range[0], baseNode.range[1], `/* ${F}: original body removed — replaced by a later layer (js/chains/${F}.js) */`]);
  for (const l of layers) edits.push([l.st.range[0], l.st.range[1], `/* ${F}: layer moved to js/chains/${F}.js */`]);
  for (const a of aliases) { if (!declRemove.has(a.decl)) declRemove.set(a.decl, new Set()); declRemove.get(a.decl).add(a.d); }
  const order = pieces.slice().reverse();
  const baseTag = tagAt(baseNode.range[0]) ? '[' + tagAt(baseNode.range[0])[1] + ']' : '';
  const chainTxt = [
    baseLive ? `  // [chain:${F}] ${order.length} layer${order.length > 1 ? 's' : ''} over ${F}__base (${baseTag}).`
             : `  // [chain:${F}] ${order.length} layer${order.length > 1 ? 's' : ''}; the original in ${baseTag} and older layers were dead code and are removed.`,
    `  //   Call order, outermost first: ${order.map(p => p.nm).join(' → ')}${baseLive ? ' → ' + F + '__base' : ''}`,
    `  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.`,
    ...order.map(p => `  // ${p.nm}: from ${p.where}${p.calls.length ? ', calls ' + p.calls.join(', ') : ', does NOT call the layer below'}\n  ${p.src}\n`)
  ].join('\n');
  chainsOut.push(chainTxt);
  report.merged[F] = { layers: n, kept: order.length, pruned, names: order.map(p => p.nm) };
}

for (const [decl, drop] of declRemove) {
  const keep = decl.declarations.filter(d => !drop.has(d));
  edits.push([decl.range[0], decl.range[1], keep.length ? `${decl.kind} ${keep.map(d => js.slice(...d.range)).join(', ')};` : '']);
}
// apply edits (non-overlapping, from the end)
edits.sort((a, b) => b[0] - a[0]);
for (let i = 1; i < edits.length; i++) if (edits[i][1] > edits[i - 1][0]) throw new Error('overlapping edits near line ' + lineOf(edits[i][0]));
let out = js; for (const [a, b, t] of edits) out = out.slice(0, a) + t + out.slice(b);
// insert the chains section right before the [18] boot section
const bootIdx = out.search(/\n[ \t]*\/\/[ \t]*\[18\][^\n]*\n[ \t]*\/\/[^\n]*renderCP/);
if (bootIdx < 0) throw new Error('boot marker not found');
const section = `\n  // ══════════════════════════════════════════════════════════════\n  // [20] Wrapper chains — every function that was wrapped by later versions, with all its layers in one place.\n  //      Function declarations are hoisted, so where this section sits does not matter.\n  // ══════════════════════════════════════════════════════════════\n\n` + chainsOut.join('\n\n') + '\n';
out = out.slice(0, bootIdx) + section + out.slice(bootIdx);
fs.writeFileSync(outp, html.slice(0, sOpen) + out + html.slice(sClose));
if (opt('--report')) fs.writeFileSync(opt('--report'), JSON.stringify(report, null, 1));
console.log('merged', Object.keys(report.merged).length, 'functions,', Object.values(report.merged).reduce((a, b) => a + b.layers, 0), 'layers; rejected', Object.keys(report.rejected).length);
