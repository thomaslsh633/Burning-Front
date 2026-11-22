  // ══════════════════════════════════════════════════════════════
  // [v174] Move animation tuning (Burning Bridges pace, camera follow, squad bob, red marks on enemies spotted on the way)
  //        and attack animation: muzzle flash, tracers, shells (straight / arcing), impacts, ricochet sparks, flame jets,
  //        counter fire after the attack. Results are computed at once as before; the screen holds the victims' HP,
  //        squad size and floating numbers until the shot lands. Tap skips.
  // ══════════════════════════════════════════════════════════════
  Object.assign(V173, { msHex: { inf: 220, crew: 220, wheel: 150, track: 180 }, maxMs: 1600 });
  var V174 = { fx: [], hold: new Map(), recoil: new Map(), raf: 0, busyUntil: 0 };
  const v174Now = () => performance.now();
  const v174Proj = (dx, dy) => ({ x: dx * COSA - dy * SINA, y: (dx * SINA + dy * COSA) * TILT });
  const v174Rand = (a, b) => a + Math.random() * (b - a);
  const v174Vis = u => !!u && (u.team === currentTurn || visibleHexes.has(u.c + ',' + u.r) || (V174.pv && V174.pv.has(u)));   // pv: seen before the shot
  function v174Kick() { if (!V174.raf) V174.raf = requestAnimationFrame(v174Tick); }
  function v174Tick() {
    V174.raf = 0; const now = v174Now();
    V174.fx = V174.fx.filter(f => now < f.t1);
    V174.hold.forEach((h, u) => { if (now >= h.until + V176.blend) V174.hold.delete(u); });
    V174.recoil.forEach((t, u) => { if (now - t > 300) V174.recoil.delete(u); });
    render();
    V180.turn.forEach((T, u) => { if (now > T.t0 + T.dur + 60) V180.turn.delete(u); });
    V183.re.forEach((R, u) => { if (now > R.t0 + R.dur + 60) V183.re.delete(u); });
    if (V174.fx.length || V174.hold.size || V174.recoil.size || V180.turn.size || V181.plant.size || V183.re.size) V174.raf = requestAnimationFrame(v174Tick);
    else if (typeof v129Kick === 'function') v129Kick();
  }
  function v174Skip() {
    const now = v174Now(); V174.fx = []; V174.hold.clear(); V174.recoil.clear(); V180.turn.clear(); V183.re.clear();
    fxList.forEach(f => { if (f.t0 > now) f.t0 = now; }); render();
  }
  // ---- geometry ----
  function v174Muzzle(u, kind) {
    const p = v173Pos(u) || getHexCenter(u.c, u.r), fa = v183Ang(u) || 0;
    if (kind === 'cannon' || u.armorType === 'hard') { const d = v174Proj(Math.cos(fa) * 16, Math.sin(fa) * 16); return { x: p.x + d.x, y: p.y + d.y - 9 }; }
    if (u.isHeavy) { const d = v174Proj(Math.cos(fa) * 8, Math.sin(fa) * 8); return { x: p.x + d.x, y: p.y + d.y - 5 }; }
    return { x: p.x + v174Rand(-9, 9), y: p.y + v174Rand(-5, 3) - 6 };
  }
  function v174HitPt(u, spread) { const p = getHexCenter(u.c, u.r); return { x: p.x + v174Rand(-spread, spread), y: p.y + v174Rand(-spread * .5, spread * .5) - (u.armorType === 'hard' ? 6 : 4) }; }
  function v174Kind(u) {
    if (u.isFlamer) return 'flame'; if (u.isMortar || u.isArtillery || u.isNebel) return 'arc'; if (u.isSniper) return 'sniper';
    const k = u.key || '';
    if (u.isHmg || /hmg|flak38|m16|wirbelwind|m3gmc|^flak$/.test(k)) return 'mg';
    if (/at_gun|m5gun|lg40|pack75|flak36|howitzer|obice/.test(k)) return 'cannon';
    if (u.armorType === 'hard') return /truck|transport|weasel|kettenkrad|supply|ambulance|amb251|bergepanzer|recovery/.test(k) ? 'mg' : 'cannon';
    return 'rifle';
  }
  // ---- primitives (world coordinates; drawn above the units) ----
  const v174Add = (t0, dur, draw) => { if (V174.fx.length >= v178Cap()) return; V174.fx.push({ t0, t1: t0 + dur, draw }); };   // v178: effect cap follows the quality setting
  /* v174Flash: original body removed — replaced by a later layer (js/chains/v174Flash.js) */
  
  function v174Tracer(t, a, b, dur, col, w, len) {
    v174Add(t, dur, (k) => { const L = Math.hypot(b.x - a.x, b.y - a.y) || 1, l = Math.min(len || 14, L) / L, k0 = Math.max(0, k - l);
      ctx.strokeStyle = col || 'rgba(255,215,130,.95)'; ctx.lineWidth = (w || 1.1) / zoom * Math.max(1, zoom * .8); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a.x + (b.x - a.x) * k0, a.y + (b.y - a.y) * k0); ctx.lineTo(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k); ctx.stroke(); });
  }
  /* v174Puff: original body removed — replaced by a later layer (js/chains/v174Puff.js) */
  function v174Spark(t, pt) { const rays = Array.from({ length: 7 }, () => [v174Rand(0, 6.28), v174Rand(6, 13)]); v174Add(t, 220, (k) => { ctx.strokeStyle = `rgba(255,230,140,${1 - k})`; ctx.lineWidth = 1 / zoom * Math.max(1, zoom * .8); ctx.beginPath(); rays.forEach(([a, l]) => { ctx.moveTo(pt.x + Math.cos(a) * l * k * .4, pt.y + Math.sin(a) * l * k * .4 * .6); ctx.lineTo(pt.x + Math.cos(a) * l * k, pt.y + Math.sin(a) * l * k * .6); }); ctx.stroke(); }); }
  /* v174Boom: original body removed — replaced by a later layer (js/chains/v174Boom.js) */
  function v174Shell(t, a, b, dur, arcH) {
    v174Add(t, dur, (k) => { const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k - arcH * 4 * k * (1 - k);
      ctx.fillStyle = 'rgba(255,240,190,.95)'; ctx.beginPath(); ctx.arc(x, y, arcH ? 1.4 : 1.2, 0, 6.2832); ctx.fill();
      if (!arcH) { const k0 = Math.max(0, k - .25); ctx.strokeStyle = 'rgba(255,200,120,.7)'; ctx.lineWidth = 1.4 / zoom * Math.max(1, zoom * .8); ctx.beginPath(); ctx.moveTo(a.x + (b.x - a.x) * k0, a.y + (b.y - a.y) * k0); ctx.lineTo(x, y); ctx.stroke(); } });
  }
  /* v174Flame: original body removed — replaced by a later layer (js/chains/v174Flame.js) */
  // ---- one attack: schedule the effects, return the time the damage lands ----
  /* v174Attack: original body removed — replaced by a later layer (js/chains/v174Attack.js) */
  // ---- wrap the combat entry points: snapshot, run, then replay on screen ----
  function v174Snap() { const m = new Map(); V174.pv = new Set(); units.forEach(u => { m.set(u, { hp: u.hp, models: u.models, ammo: u.ammo, sup: u.suppression }); if (u.hp > 0 && (u.team === currentTurn || visibleHexes.has(u.c + ',' + u.r))) V174.pv.add(u); }); return m; }
  function v174Hold(u, pre, until) { const h = V174.hold.get(u); if (h) { h.until = Math.max(h.until, until); return; } V174.hold.set(u, { hp: pre.hp, models: pre.models, sup: pre.sup, until }); }
  function v174FxShift(n0, at) { for (let i = n0; i < fxList.length; i++) { const f = fxList[i]; f._v173 = 1; const t = at(f); if (t) f.t0 = Math.max(f.t0, t); } }
  function v174Start() { const now = v174Now(); return Math.max(now + 30, V173.anim ? V173.anim.tEnd + 60 : 0, Math.min(V174.busyUntil, now + 1500)); }   // queue after the running one, never more than 1.5 s ahead
  {  /* executeCombat: layer moved to js/chains/executeCombat.js */ }
  {  /* v159WatchFire: layer moved to js/chains/v159WatchFire.js */ }
  // barrage shells (skills / off-map): an explosion at every impact hex, staggered
  { const o = impact; let last = 0, seq = 0; impact = function (team, c, r) {
      const res = o.apply(this, arguments);
      if (!reduceMotion() && visibleHexes.has(c + ',' + r)) { const now = v174Now(); if (now - last > 50) seq = 0; last = now;
        const p = getHexCenter(c, r); v174Boom(now + 40 + seq++ * 110, { x: p.x + v174Rand(-6, 6), y: p.y + v174Rand(-4, 4) - 3 }, 13); v174Kick(); }
      return res;
    }; }
  // ---- drawing hooks ----
  {  /* fxDraw: layer moved to js/chains/fxDraw.js */ }
  // victims keep their old HP / squad size on screen until the shot lands
  {  /* render: layer moved to js/chains/render.js */ }
  // recoil (cannons) and squad bob while walking
  {  /* drawUnitArt: layer moved to js/chains/drawUnitArt.js */ }
  // ---- move: camera follow + red marks on the enemies spotted on the way ----
  function v174Spot(c, r, t) {
    const ctr = getHexCenter(c, r), R = HEX_RADIUS * .96, pts = []; for (let i = 0; i < 6; i++) { const a = (60 * i - 30) * Math.PI / 180, d = v174Proj(R * Math.cos(a), R * Math.sin(a)); pts.push([ctr.x + d.x, ctr.y + d.y]); }
    v174Add(t, 1600, (k) => { const a = (1 - k) * (.6 + .4 * Math.sin(k * 18)); ctx.strokeStyle = `rgba(239,68,68,${a})`; ctx.lineWidth = 2.2 / zoom * Math.max(1, zoom * .7); ctx.lineJoin = 'round';
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = `rgba(239,68,68,${a * .18})`; ctx.fill(); });
  }
  {  /* v173End: layer moved to js/chains/v173End.js */ }
  {  /* v173Tick: layer moved to js/chains/v173Tick.js */ }
  // one tap skips every running animation
  canvas.addEventListener('click', e => { if (V173.anim) return; if (!V174.hold.size && v174Now() >= V174.busyUntil) return; v174Skip(); V174.busyUntil = 0; e.stopImmediatePropagation(); e.preventDefault(); }, true);

