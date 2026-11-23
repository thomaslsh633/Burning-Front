"""Split coh1944 single-file HTML into a source tree that build.js re-joins byte-identically.

usage: python3 -I split.py <game.html> <out_dir>
"""
import json, os, re, subprocess, sys

src, out = sys.argv[1], sys.argv[2]
L = open(src, encoding='utf-8').read().split('\n')
N = len(L)

def find(pred, start=1, end=None):
    for i in range(start, (end or N) + 1):
        if pred(L[i - 1]):
            return i
    raise SystemExit('pattern not found')

# ---- fixed HTML / CSS regions (1-based, inclusive) ----
style_open = find(lambda s: s.strip() == '<style>')
style_close = find(lambda s: s.strip() == '</style>', style_open)
script_open = find(lambda s: s.strip() == '<script>', style_close)
script_close = max(i for i in range(1, N + 1) if L[i - 1].strip() == '</script>')
font_lines = [i for i in range(style_open + 1, style_close) if L[i - 1].lstrip().startswith('@font-face')]

parts = []  # (relpath, first_line, last_line)
parts.append(('html/00_head.html', 1, style_open))
# css: alternate between normal css and font blocks
cur = style_open + 1
css_idx = 0
groups = []
for f in font_lines:
    if groups and groups[-1][1] == f - 1:
        groups[-1][1] = f
    else:
        groups.append([f, f])
for gi, (a, b) in enumerate(groups):
    if cur < a:
        css_idx += 1
        parts.append((f'css/{css_idx:02d}_styles.css', cur, a - 1))
    parts.append((f'assets/fonts_{gi + 1}.css', a, b))
    cur = b + 1
if cur < style_close:
    css_idx += 1
    parts.append((f'css/{css_idx:02d}_styles.css', cur, style_close - 1))
parts.append(('html/10_body.html', style_close, script_open))

# ---- JS ----
js_s, js_e = script_open + 1, script_close - 1
subprocess.run(['node', os.path.join(os.path.dirname(__file__), 'analyze.js'), src, str(js_s), str(js_e)], check=True, capture_output=True)
top = json.load(open(os.path.join(os.path.dirname(__file__), 'toplevel.json')))
inside = lambda x: any(a < x <= b for a, b, _ in top)

MARK = re.compile(r'\s*//\s*\[(v\d+|\d{2}[^\]]*|19|18|chain:[A-Za-z_$][\w$]*)\]')
toc_end = find(lambda s: MARK.match(s) and '[01]' in s, js_s + 130) if False else None
toc_last = max(i for i in range(js_s, min(js_e, js_s + 400)) if L[i - 1].lstrip().startswith('//') and 'grep' not in L[i-1]) if False else None
first_code = next(i for i in range(js_s, js_e) if L[i - 1].strip() and not L[i - 1].lstrip().startswith('//'))
marks = [i for i in range(js_s + 1, js_e + 1) if MARK.match(L[i - 1]) and i > first_code - 30]
# a marker usually sits right below a "═══" bar; start the file at the bar
BAR = re.compile(r'\s*//\s*[═=\-]{10,}\s*$')
def back(i):
    while i - 1 > js_s and BAR.match(L[i - 2]) and not inside(i - 1):
        i -= 1
    return i
starts = sorted(set([js_s] + [back(m) for m in marks]))
assert not any(inside(x) for x in starts[1:])

NAMES = {'01': 'dom-refs', '02': 'ui-utils', '03': 'viewport-camera', '04': 'rules-data', '05': 'game-state',
         '06': 'map-gen-terrain', '07': 'units-squads', '08': 'hex-math-helpers', '09': 'movement-vision-arcs',
         '10': 'render', '11': 'combat', '12': 'economy-build-research-cp', '13': 'doctrine-skills-barrage',
         '14': 'special-actions-supply-repair', '15': 'input-action-tiles', '16': 'ui-panels-hud',
         '17': 'turn-flow', '18': 'boot', '19': 'game-shell', '20': 'wrapper-chains'}
SAFE = str.maketrans({c: '-' for c in " /\\·—–,.:;()'\"&%#*+=_<>|?!×→"})

def slug_for(line_no):
    s = L[line_no - 1]
    m = MARK.match(s)
    if not m:
        return 'toc' if line_no == js_s else 'part'
    tag = m.group(1)
    if tag.startswith('chain:'):
        return 'chain:' + tag[6:]
    rest = s[m.end():].strip(' —-')
    if tag[:2] in NAMES and len(tag) == 2:
        return f'{tag}_{NAMES[tag]}'
    words = re.findall(r'[A-Za-z][A-Za-z0-9]*', rest.split('·')[0])
    words = [w.lower() for w in words if w.lower() not in ('v' + tag,)][:4]
    t = re.sub(r'[^0-9A-Za-z]+', 'x', tag)
    return f'{t}_' + ('-'.join(words) if words else 'section')

def header_line(a):
    for i in range(a, a + 4):
        if MARK.match(L[i - 1]):
            return i
    return a

segments = []
for k, a in enumerate(starts):
    b = (starts[k + 1] - 1) if k + 1 < len(starts) else js_e
    segments.append([a, b, slug_for(header_line(a))])

# ---- split oversized segments ----
def inner_bounds(a, b):
    """inner statement starts of an IIFE `const X = (() => { ... })();` spanning [a,b]"""
    code = '\n'.join(L[a - 1:b])
    r = subprocess.run(['node', '-e', '''
const acorn=require(process.argv[1]);const fs=require('fs');
const code=fs.readFileSync(0,'utf8');const ast=acorn.parse(code,{ecmaVersion:'latest',locations:true});
const out=[];for(const st of ast.body){const d=st.declarations&&st.declarations[0];
 const body=d&&d.init&&d.init.callee&&d.init.callee.body&&d.init.callee.body.body;
 if(body&&body.length>20){out.push([st.loc.start.line,st.loc.end.line,body.map(n=>[n.loc.start.line,n.loc.end.line,n.id?n.id.name:(n.declarations?n.declarations[0].id.name:n.type)])]);}}
console.log(JSON.stringify(out));''', os.path.join('/home/claude/tools/node_modules/acorn')], input=code, capture_output=True, text=True, check=True)
    return json.loads(r.stdout)

LIMIT_BYTES = 90_000
LIMIT_LINES = 900
final = []
for a, b, name in segments:
    size = sum(len(x) + 1 for x in L[a - 1:b])
    if size <= LIMIT_BYTES and b - a + 1 <= LIMIT_LINES:
        final.append((a, b, name, None))
        continue
    # candidate cut points: top-level statement starts within (a,b] that sit under a comment line,
    # or inner statement starts of a big IIFE
    cands = []
    for s0, e0, _ in top:
        if a < s0 <= b:
            c = s0
            while c - 1 > a and L[c - 2].strip().startswith('//'):
                c -= 1
            if not inside(c):
                cands.append((c, None))
    for (sa, sb, body) in inner_bounds(a, b):
        sa += a - 1; sb += a - 1
        for s1, e1, nm in body:
            s1 += a - 1
            c = s1
            while c - 1 > sa and L[c - 2].strip().startswith('//'):
                c -= 1
            if c > sa + 1:
                cands.append((c, nm))
    cands = sorted(set(cands))
    pos, piece = a, 1
    names = {c: nm for c, nm in cands}
    cut_list = [c for c, _ in cands]
    while True:
        # greedy: extend until limit, then cut at the last candidate before the limit
        acc, last_ok = 0, None
        for i in range(pos, b + 1):
            acc += len(L[i - 1]) + 1
            if i + 1 in names and i + 1 > pos:
                if acc <= LIMIT_BYTES and (i + 1 - pos) <= LIMIT_LINES:
                    last_ok = i + 1
                else:
                    break
        else:
            final.append((pos, b, f'{name}', piece)); break
        if last_ok is None:
            # no candidate under the limit: cut at the first candidate after pos
            later = [c for c in cut_list if c > pos]
            if not later:
                final.append((pos, b, name, piece)); break
            last_ok = later[0]
        final.append((pos, last_ok - 1, name, piece))
        pos, piece = last_ok, piece + 1

js_parts = []
for idx, (a, b, name, piece) in enumerate(final):
    nm = name if piece is None else f'{name}-{piece}'
    if nm.startswith('chain:'):
        js_parts.append((f'js/chains/{nm[6:]}.js', a, b))
    else:
        js_parts.append((f'js/{(idx + 1) * 10:04d}_{nm}.js', a, b))
parts += js_parts
parts.append(('html/90_tail.html', script_close, N))

# ---- sanity: contiguous coverage ----
prev = 0
for p, a, b in parts:
    assert a == prev + 1, (p, a, prev)
    prev = b
assert prev == N

for p, a, b in parts:
    fp = os.path.join(out, p)
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    with open(fp, 'w', encoding='utf-8', newline='') as f:
        f.write('\n'.join(L[a - 1:b]) + '\n')
with open(os.path.join(out, 'manifest.txt'), 'w', encoding='utf-8') as f:
    f.write('# Build order. build.js concatenates these files top to bottom.\n')
    f.write('# JS files are one classic <script>: they share one global scope and run in this order.\n')
    for p, a, b in parts:
        f.write(p + '\n')
print(len(parts), 'files;', len(js_parts), 'js')
