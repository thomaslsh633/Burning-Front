"""Print one unit's final stats as the game computes them (after every data patch), without reading the data files.

usage: python3 -I tools/unit.py <key|search text> [--team blue|red] [--spawn]
  --spawn  also create the unit on the map and print the live unit object (weapons, squad, kits)
  e.g.     python3 -I tools/unit.py sherman
           python3 -I tools/unit.py 셔먼          (searches names too)
Needs: pip playwright + Chrome. Builds dist/ first.
"""
import json, os, subprocess, sys
from playwright.sync_api import sync_playwright

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[1:]
if not args:
    print(__doc__); sys.exit(1)
q = args[0]
team = args[args.index('--team') + 1] if '--team' in args else None
spawn = '--spawn' in args
out = os.path.join(root, 'dist', 'unit_query.html')
subprocess.run(['node', os.path.join(root, 'build.js'), out], check=True, capture_output=True)
chrome = next((p for p in ('/usr/bin/google-chrome', '/usr/bin/chromium') if os.path.exists(p)), None)
JS = r"""([q, team, spawn]) => {
  const res = [];
  for (const tm of team ? [team] : ['blue', 'red']) for (const [k, t] of Object.entries(UNIT_ROSTER[tm] || {})) {
    const hay = [k, t.uniqueName, t.className, t.name].filter(Boolean).join(' ').toLowerCase();
    if (k === q || hay.includes(q.toLowerCase())) {
      const row = { team: tm, key: k, roster: t };
      if (spawn) { try { const u = createUnitFromKey(999, tm, k, 0, 0); row.unit = u; units = units.filter(x => x !== u); } catch (e) { row.unit = 'spawn failed: ' + e.message; } }
      res.push(row);
    }
  }
  const seen = new WeakSet();
  return JSON.stringify(res, (k, v) => { if (typeof v === 'function') return undefined; if (v && typeof v === 'object') { if (seen.has(v)) return '[ref]'; seen.add(v); } return v; }, 1);
}"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=chrome)
    pg = b.new_page(viewport={'width': 900, 'height': 420})
    pg.goto('file://' + out, timeout=180000)
    print(pg.evaluate(JS, [q, team, spawn]))
    b.close()
