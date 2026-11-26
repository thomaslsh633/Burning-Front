"""Scenario checks for v212 (blind indirect fire, large emplacements, 2-hex build range, CP / cover / price / rocket).

python3 -I tools/test_v212.py dist/burning_front_v212.html
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import INIT, chrome
from playwright.sync_api import sync_playwright

JS = r"""(() => {
  const R = {}, ok = (k, v) => { R[k] = v; };
  const free = (c, r) => !getUnitAt(c, r) && !getBuildingAt(c, r) && v151FreeFor(c, r, null) && !getCapturePointAt(c, r);
  // find an open 7-hex patch with a free 2nd-ring hex for the engineer
  let spot = null;
  for (let r = 2; r < ROWS - 2 && !spot; r++) for (let c = 2; c < COLS - 2 && !spot; c++) {
    const cells = v151Ring7(c, r); if (cells.length < 7 || !cells.every(([x, y]) => free(x, y) && !placeReason(x, y, false))) continue;
    const e = ring(c, r, 2).find(h => getDistance(h.c, h.r, c, r) === 2 && free(h.c, h.r)); if (e) spot = { c, r, e };
  }
  ok('spot', !!spot); if (!spot) return R;
  // price / CP / counter
  ok('price150', [UNIT_ROSTER.red.howitzer.cost, UNIT_ROSTER.red.howitzer.fcost]);
  ok('price105', [UNIT_ROSTER.blue.howitzer.cost, UNIT_ROSTER.blue.howitzer.fcost]);
  ok('fort', ['howitzer_pit', 'obice_empl', 'flak36_empl'].map(k => [k, FORT[k].g, FORT[k].f, FORT[k].big]));
  ok('techCounter', 'counter' in TECH); ok('counterMax', counterMax('blue'));
  // engineer on the blue side
  const tm = currentTurn; gold[tm] = 5000; fuel[tm] = 500;
  const eng = createUnitFromKey(nextUnitId++, tm, 'engineer', spot.e.c, spot.e.r, 0); units.push(eng);
  const bt = tm === 'blue' ? 'howitzer_pit' : 'obice_empl';
  ok('checkBig@2', v151PlaceCheck(bt, spot, eng));
  const n1 = getHexNeighbors(eng.c, eng.r).find(h => getDistance(h.c, h.r, spot.c, spot.r) === 1);
  ok('checkBig@1', n1 ? v151PlaceCheck(bt, n1, eng) : 'n/a');
  ok('check3', v151PlaceCheck('trench', { c: eng.c + 3, r: eng.r }, eng));
  const t2 = ring(eng.c, eng.r, 2).find(h => getDistance(h.c, h.r, eng.c, eng.r) === 2 && free(h.c, h.r));
  ok('checkTrench@2', t2 ? v151PlaceCheck('trench', t2, eng) : 'n/a');
  actionMode = 'build_' + bt; activeActor = eng;
  const tiles = validActionTiles(); ok('tilesBig', tiles.some(h => h.c === spot.c && h.r === spot.r));
  actionMode = 'build_trench'; ok('tilesTrenchMaxDist', Math.max(...validActionTiles().map(h => getDistance(eng.c, eng.r, h.c, h.r))));
  actionMode = null; activeActor = null;
  const em = v134PlaceEmpl(bt, tm, spot, { g: 0, f: 0 });
  ok('cells', em.cells.length);
  const nb = em.cells[3]; ok('getUnitAtFoot', getUnitAt(nb[0], nb[1]) === em);
  { const far = ring(nb[0], nb[1], 2).find(h => getDistance(h.c, h.r, nb[0], nb[1]) === 2 && !getUnitAt(h.c, h.r));
    const e2 = { c: far.c, r: far.r }; ok('overlap', v151PlaceCheck(bt, { c: nb[0], r: nb[1] }, e2) || '(allowed!)');
    const o2 = ring(spot.c, spot.r, 2).find(h => getDistance(h.c, h.r, spot.c, spot.r) === 2);
    ok('overlapRing2', v151PlaceCheck(bt, o2, { c: -9, r: -9 }) === '' ? '(allowed!)' : 'rejected'); }
  // movement into the footprint
  const inf = createUnitFromKey(nextUnitId++, tm, 'infantry', eng.c, eng.r, 0); units.splice(units.indexOf(eng), 1); units.push(inf);
  ok('moveIntoFoot', calculateReachableHexes(inf).some(h => em.cells.some(q => q[0] === h.c && q[1] === h.r)));
  // yellow cover suppression
  const foe = units.find(u => u.team !== tm && u.armorType === 'soft' && u.hp > 0);
  ok('suppYellow', (() => { const o = coverVs; try { coverVs = () => 'yellow'; return suppTerrainMul(foe, { isHmg: true }); } finally { coverVs = o; } })());
  // blind fire
  const arty = units.find(u => u.team === tm && (u.isMortar || u.isArtillery || u.isNebel) && u.hp > 0) || em;
  arty.hasAttacked = false; arty.ammo = 5; arty.hasMoved = true; if (typeof v159SetEmpl === 'function' && v159Crew(arty)) { v159SetEmpl(arty, true); arty.emplT = -99; }
  updateVision(); selectedUnit = arty; updateActionTiles(arty);
  const blind = validAttacks.filter(a => a.blind);
  ok('blindTiles', blind.length); ok('arty', arty.key + (arty.empl ? '/empl' : ''));
  if (blind.length) {
    const tgt = blind[0], victim = createUnitFromKey(nextUnitId++, tm === 'blue' ? 'red' : 'blue', 'infantry', tgt.c, tgt.r, 0); units.push(victim);
    const hp0 = victim.hp, logN = document.querySelectorAll('#log *').length;
    ok('tap1', v212BlindTap(tgt)); ok('afterTap1', arty.hasAttacked);
    ok('tap2', v212BlindTap(tgt)); ok('afterTap2', arty.hasAttacked);
    let hits = 0; for (let i = 0; i < 30 && victim.hp > 0; i++) { const h = victim.hp; arty.hasAttacked = false; arty.ammo = 5; v212BlindFire(arty, tgt.c, tgt.r); if (victim.hp < h) hits++; }
    ok('victimHit', hp0 + ' -> ' + victim.hp + ' (' + hits + ' hits in up to 30 volleys)');
    ok('logLeak', [...document.querySelectorAll('#log *')].slice(0, 6).map(e => e.textContent).join(' | ').includes(victim.className) ? 'name in log' : 'no name');
  }
  // rocket volley lands now
  const roc = USK && USK.rocket || null; ok('rocketDesc', roc ? roc.d : 'missing');
  return R;
})()"""

html = os.path.abspath(sys.argv[1])
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=chrome(), args=['--disable-gpu'])
    ctx = b.new_context(viewport={'width': 900, 'height': 420})
    ctx.add_init_script(INIT.replace('%SEED%', '3'))
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + html, timeout=180000)
    pg.evaluate('__advance(1500)')
    pg.evaluate("(() => { shSetupOpen('skirmish'); SHELL.cfg.map = 'skirmish'; V100.autoBrief = false; shDeploy(); try { v100BriefClose(); } catch (e) {} })()")
    pg.evaluate('__advance(2000)')
    try:
        print(json.dumps(pg.evaluate(JS), ensure_ascii=False, indent=1))
    except Exception as e:
        print('EVAL ERROR', e)
    for _ in range(4):
        pg.evaluate("document.getElementById('end-turn-btn').click()"); pg.evaluate('__advance(3000)')
        pg.evaluate("(() => { const g = document.getElementById('tc-go'); if (g) g.click(); })()"); pg.evaluate('__advance(1500)')
    print('page errors:', errs[:5])
    b.close()
