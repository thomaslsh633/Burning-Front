"""Regression harness: plays the built game with seeded random taps and compares two builds step by step.

usage:
  python3 -I tools/harness.py record <game.html> <trace.json> [--steps N] [--seeds 1,2,3]
  python3 -I tools/harness.py compare <trace_a.json> <trace_b.json>

Determinism: Math.random is seeded, and time (performance.now, Date, rAF, setTimeout/setInterval) runs on a
virtual clock that only moves when the harness advances it. Each step records a hash of the game state,
the DOM, and the canvas pixels, plus any console errors.
Needs: pip playwright + a Chrome/Chromium (uses /usr/bin/google-chrome if present).
"""
import hashlib, json, os, random, sys
from playwright.sync_api import sync_playwright

INIT = r"""
(() => {
  let seed = %SEED% >>> 0;
  Math.random = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let now = 0; const T0 = 1767225600000;
  performance.now = () => now;
  const RD = Date;
  class VD extends RD { constructor(...a) { if (a.length) super(...a); else super(T0 + now); } static now() { return T0 + now; } }
  window.Date = VD;
  let raf = [], rid = 1, timers = new Map(), tid = 1;
  window.requestAnimationFrame = f => { const id = rid++; raf.push([id, f]); return id; };
  window.cancelAnimationFrame = id => { raf = raf.filter(x => x[0] !== id); };
  window.setTimeout = (f, ms = 0, ...a) => { const id = tid++; timers.set(id, { at: now + Math.max(0, +ms || 0), f, a, every: 0 }); return id; };
  window.setInterval = (f, ms = 0, ...a) => { const id = tid++; const ev = Math.max(1, +ms || 0); timers.set(id, { at: now + ev, f, a, every: ev }); return id; };
  window.clearTimeout = window.clearInterval = id => { timers.delete(id); };
  window.__errors = [];
  window.addEventListener('error', e => window.__errors.push(String(e.message)));
  window.__advance = (ms, step = 16) => {
    const end = now + ms;
    while (now < end) {
      now = Math.min(end, now + step);
      for (;;) {
        let due = null;
        for (const [id, t] of timers) if (t.at <= now && (!due || t.at < due[1].at || (t.at === due[1].at && id < due[0]))) due = [id, t];
        if (!due) break;
        const [id, t] = due;
        if (t.every) t.at += t.every; else timers.delete(id);
        try { typeof t.f === 'function' ? t.f(...t.a) : 0; } catch (e) { window.__errors.push('timer: ' + e.message); }
      }
      const q = raf; raf = [];
      for (const [, f] of q) { try { f(now); } catch (e) { window.__errors.push('raf: ' + e.message); } }
    }
  };
  // sprite pre-bake queue: MessageChannel -> virtual zero-delay timer
  window.MessageChannel = function () {
    const p1 = { onmessage: null }, p2 = { onmessage: null };
    p1.postMessage = d => window.setTimeout(() => p2.onmessage && p2.onmessage({ data: d }), 0);
    p2.postMessage = d => window.setTimeout(() => p1.onmessage && p1.onmessage({ data: d }), 0);
    this.port1 = p1; this.port2 = p2;
  };
  // no persistent sprite cache: every run bakes from scratch
  try { Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }); } catch (e) { }
  try { localStorage.clear(); } catch (e) { }
  // CSS animations run on real time (animationend handlers), so switch them off
  document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style');
    st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}'; document.head.appendChild(st); });
})();
"""

SNAP = r"""
(() => {
  const seen = new WeakSet();
  const clean = (k, v) => {
    if (typeof v === 'function') return undefined;
    if (v instanceof HTMLElement || v instanceof CanvasRenderingContext2D || v instanceof HTMLCanvasElement || v instanceof ImageData) return undefined;
    if (typeof OffscreenCanvas !== 'undefined' && v instanceof OffscreenCanvas) return undefined;
    if (v instanceof Set) return [...v].sort();
    if (v instanceof Map) return [...v.entries()];
    if (typeof v === 'number' && !isFinite(v)) return String(v);
    if (v && typeof v === 'object') { if (seen.has(v)) return '[ref]'; seen.add(v); }
    return v;
  };
  let st = {};
  try {
    st = { turn: currentTurn, round: roundCount, turnNo, gold, fuel, mun, teamXp, doctrine,
      units, buildings, capturePoints, smokes, pendingStrikes, mines, bunkers,
      vis: visibleHexes, sel: selectedUnit && selectedUnit.id, actionMode, validMoves, validAttacks,
      camX, camY, zoom };
  } catch (e) { st = { err: e.message }; }
  const state = JSON.stringify(st, clean);
  const body = document.body.cloneNode(true);
  body.querySelectorAll('canvas, script').forEach(c => c.remove());
  let px = '';
  try { px = document.getElementById('gameCanvas').toDataURL(); } catch (e) { px = 'ERR ' + e.message; }
  return { state, dom: body.innerHTML, px, errors: window.__errors.splice(0), log: (document.getElementById('log') || {}).innerText || '' };
})()
"""

H = lambda s: hashlib.sha1(s.encode('utf-8', 'surrogatepass')).hexdigest()[:16]


def chrome():
    for p in ('/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'):
        if os.path.exists(p):
            return p
    return None


def play(page, rng, steps, trace):
    adv = lambda ms=600: page.evaluate(f'__advance({ms})')

    def snap(label):
        s = page.evaluate(SNAP)
        trace.append({'step': len(trace), 'action': label, 'state': H(s['state']), 'dom': H(s['dom']),
                      'px': H(s['px']), 'errors': s['errors'], 'state_raw': s['state'][:20000], 'log_tail': s['log'][-400:],
                      **({'dom_raw': s['dom']} if os.environ.get('HARNESS_RAW') else {})})

    def tap_hex(c, r):
        # centre the camera on the hex, then click its screen position
        xy = page.evaluate(f"""(() => {{ const p = getHexCenter({c},{r}); const w = canvas.clientWidth, h = canvas.clientHeight;
            camX = p.x - w / 2 / zoom; camY = p.y - h / 2 / zoom; try {{ clampCam(); }} catch (e) {{ }} render();
            const rc = canvas.getBoundingClientRect(); return [rc.left + (p.x - camX) * zoom, rc.top + (p.y - camY) * zoom]; }})()""")
        adv(50)
        page.mouse.click(xy[0], xy[1])
        adv(700)

    for i in range(steps):
        info = page.evaluate("""(() => ({
            team: currentTurn,
            own: units.filter(u => u.team === currentTurn && u.hp > 0 && !u.isLoaded).map(u => [u.c, u.r]),
            moves: (validMoves || []).map(h => [h.c, h.r]), atks: (validAttacks || []).map(h => [h.c ?? (h.u && h.u.c), h.r ?? (h.u && h.u.r)]),
            btns: [...document.querySelectorAll('#special-actions button, #special-actions [data-act], #unit-hud button, #build-buttons button')]
              .filter(b => b.offsetParent && !b.disabled).length,
            curtain: document.getElementById('turn-curtain') && document.getElementById('turn-curtain').classList.contains('open'),
            sheet: !!document.querySelector('.sheet-back.open'),
            over: !!(document.getElementById('aar-sheet') && document.getElementById('aar-sheet').classList.contains('open')) }))()""")
        if info['over']:
            snap('game-over'); return
        if info['curtain']:
            page.evaluate("document.getElementById('tc-go').click()"); adv(); snap('curtain'); continue
        if info['sheet']:
            page.evaluate("document.querySelector('.sheet-back.open').dispatchEvent(new MouseEvent('click', {bubbles: true}))"); adv(); snap('close-sheet'); continue
        roll = rng.random()
        if info['atks'] and roll < 0.6:
            h = rng.choice(info['atks'])
            if h[0] is not None:
                tap_hex(*h); tap_hex(*h); snap(f'attack {h}'); continue
        if info['moves'] and roll < 0.55:
            # bias moves toward the enemy side so the armies meet
            far = sorted(info['moves'], key=lambda h: -h[0] if info['team'] == 'blue' else h[0])
            h = rng.choice(far[:max(1, len(far) // 3)]) if rng.random() < 0.7 else rng.choice(info['moves'])
            tap_hex(*h); tap_hex(*h); snap(f'move {h}'); continue
        roll = rng.random()
        if info['btns'] and roll < 0.15:
            k = rng.randrange(info['btns'])
            page.evaluate(f"""[...document.querySelectorAll('#special-actions button, #special-actions [data-act], #unit-hud button, #build-buttons button')]
              .filter(b => b.offsetParent && !b.disabled)[{k}].click()""")
            adv(); snap(f'button {k}'); continue
        if info['own'] and roll < 0.85:
            h = rng.choice(info['own']); tap_hex(*h); snap(f'select {h}'); continue
        for _ in range(2):
            page.evaluate("document.getElementById('end-turn-btn').click()"); adv(400)
        adv(1500); snap('end-turn')


def record(html, out, steps, seeds, maps):
    trace = {}
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=chrome(), args=['--disable-gpu', '--use-gl=swiftshader', '--disable-lcd-text', '--force-color-profile=srgb'])
        for mp in maps:
            for sd in seeds:
                ctx = b.new_context(viewport={'width': 900, 'height': 420}, device_scale_factor=1, has_touch=False)
                ctx.add_init_script(INIT.replace('%SEED%', str(sd)))
                page = ctx.new_page()
                page.goto('file://' + os.path.abspath(html), timeout=180000)
                page.evaluate('document.fonts.ready.then(() => 1)')
                page.evaluate('__advance(1500)')
                page.evaluate('document.fonts.ready.then(() => 1)')
                t = []
                page.evaluate(f"""(() => {{ shSetupOpen('skirmish'); SHELL.cfg.map = {json.dumps(mp)}; V100.autoBrief = false; shDeploy();
                    try {{ v100BriefClose(); }} catch (e) {{ }} }})()""")
                page.evaluate('__advance(2000)')
                s = page.evaluate(SNAP)
                t.append({'step': 0, 'action': 'deploy', 'state': H(s['state']), 'dom': H(s['dom']), 'px': H(s['px']), 'errors': s['errors'], 'state_raw': s['state'][:20000], 'log_tail': ''})
                play(page, random.Random(sd * 7919), steps, t)
                trace[f'{mp}#{sd}'] = t
                print(f'{mp} seed {sd}: {len(t)} steps, errors {sum(len(x["errors"]) for x in t)}', flush=True)
                ctx.close()
        b.close()
    json.dump(trace, open(out, 'w'))


def compare(a, b):
    A, B = json.load(open(a)), json.load(open(b))
    bad = 0
    for k in A:
        ta, tb = A[k], B.get(k, [])
        for x, y in zip(ta, tb):
            diff = [f for f in ('state', 'dom', 'px') if x[f] != y[f]]
            if diff or x['errors'] != y['errors']:
                print(f'DIVERGE {k} step {x["step"]} ({x["action"]} / {y["action"]}): {diff} errors {x["errors"]} vs {y["errors"]}')
                bad += 1
                break
        if len(ta) != len(tb):
            print(f'LENGTH {k}: {len(ta)} vs {len(tb)}'); bad += 1
    print('MATCH' if not bad else f'{bad} run(s) diverged')
    return bad


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'record':
        args = sys.argv[2:]
        steps = int(args[args.index('--steps') + 1]) if '--steps' in args else 120
        seeds = [int(x) for x in args[args.index('--seeds') + 1].split(',')] if '--seeds' in args else [1, 2]
        maps = args[args.index('--maps') + 1].split(',') if '--maps' in args else ['skirmish']
        record(args[0], args[1], steps, seeds, maps)
    else:
        sys.exit(1 if compare(sys.argv[2], sys.argv[3]) else 0)
