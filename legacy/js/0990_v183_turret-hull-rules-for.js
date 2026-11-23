  // ══════════════════════════════════════════════════════════════
  // [v183] Turret / hull rules for the Sherman and the Panzer IV (other vehicles unchanged):
  //   · attacking or counter-firing turns the TURRET only (u._tur = { a: aim angle, c, r, fa } — valid while the unit stays on the same hex with
  //     the same hull facing); the hull keeps its facing, so hit zones stay hull based
  //   · moving or turning the hull drops the aim: the turret goes back to the hull direction (350 ms blend at the start of a path move)
  //   · turning the hull in place: 1 move flat, at most ±60° per turn action
  //   · antenna rod and pennant are no longer drawn on vehicles
  // ══════════════════════════════════════════════════════════════
  var V183 = { rotMax: Math.PI,   // v197: the ±60° turn cap is gone (up to 180°); turns over 120° cost 2 moves (V197.free)
     re: new Map(), keys: { blue: { sherman: 1, grant: 1, chaffee: 1, stuart: 1, easyeight: 1, pershing: 1, bulldozer: 1, tank_dest: 1, vehicle: 1, m16: 1 }, red: { panzer4: 1, pz4cmd: 1, pz3l: 1, panther: 1, tiger: 1, puma: 1, wirbelwind: 1, vehicle: 1 } } };   // v192: per team (turreted vehicles with a split turret part)   // v191: Grant (upper 37 mm turret only)
  function v183On(u) { return !!u && u.armorType === 'hard' && !!(V183.keys[u.team] || {})[u.key] && !(u.type && BLD[u.type]); }
  function v183Valid(u) { return !!u._tur; }   // v194: the turret aim is an absolute angle that survives moving and turning the hull (see v194)
  function v183Ang(u) { return u && u._tur && v183On(u) && v183Valid(u) ? u._tur.a : u.facingAngle; }   // gun direction (muzzle, recoil, flash)
  function v183Aim(u, c, r) {
    if (!v183On(u)) return faceToward(u, c, r);   // v186: fixed guns turn the whole hull to the target (free of move points), other units as before
    const A = getHexCenter(u.c, u.r), B = getHexCenter(c, r), v = unproj(B.x - A.x, B.y - A.y); if (!v.x && !v.y) return;
    const ang = Math.atan2(v.y, v.x), old = v183Valid(u) ? u._tur.a : u.facingAngle;
    u._tur = { a: ang, c: u.c, r: u.r, fa: u.facingAngle };
    if (V180.collect) { const d = v173Ang(ang - old); if (Math.abs(d) * 180 / Math.PI >= V180.minDeg && !V180.collect.some(x => x.u === u)) V180.collect.push({ u, a: old, d, tur: true }); }
  }
  // drawn turret angle, or null when the turret simply follows the hull
  function v183Pose(u) {
    if (!v183On(u) || V185.ghost) return null;
    const now = v174Now(), sm = k => k * k * (3 - 2 * k), T = V180.turn.get(u);
    if (T && T.tur && !(V173.anim && V173.anim.u === u)) {
      if (now < T.t0) return T.a;
      if (now < T.t0 + T.dur) return T.a + T.d * sm((now - T.t0) / T.dur);
    }
    if (u._tur) return u._tur.a;   // v194: stays on the aimed direction while the hull moves / turns
    const R = V183.re.get(u);
    if (R) { const k = (now - R.t0) / R.dur; if (k < 1) return R.from + v173Ang(u.facingAngle - R.from) * sm(Math.max(0, k)); V183.re.delete(u); }
    return null;
  }
  {  /* v173Begin: layer moved to js/chains/v173Begin.js */ }
  try { if (localStorage.getItem('coh1944.split') === 'off') V182.on = false; } catch (e) { }
  (function () {
    const a = document.getElementById('v179-arc'); if (!a) return;
    const g = document.createElement('div'); g.className = 'set-group';
    g.innerHTML = '<h3>포탑 분리 표시 (v183)</h3><div class="set-row"><select id="v182-split"><option value="on">켜기 — 셔먼·4호전차 포탑이 차체와 따로 회전</option><option value="off">끄기 — 포탑 회전 표시 없음 (규칙은 동일)</option></select></div>';
    a.closest('.set-group').after(g); const sel = g.querySelector('select'); sel.value = V182.on ? 'on' : 'off';
    sel.addEventListener('change', e => { V182.on = e.target.value === 'on'; if (V182.on) TANK_SPR.warmed = {}; try { localStorage.setItem('coh1944.split', V182.on ? 'on' : 'off'); } catch (x) { } render(); });
  })();

