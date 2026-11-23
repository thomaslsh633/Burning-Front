  // ══════════════════════════════════════════════════════════════
  // [v173] Moves follow a path: the unit stops on the first hex where it sights a new enemy (rest of the move is kept),
  //        and the move is animated along the path. Tracked vehicles turn in place before driving off and at sharp
  //        corners; wheeled / half-tracks and infantry turn while moving. Tap skips the animation.
  // ══════════════════════════════════════════════════════════════
  var V173 = { stop: true, anim: null, msHex: { inf: 120, wheel: 85, track: 100 }, maxMs: 1300, turnDps: 270, turnDpsHeavy: 180, turnDpsCrew: 200, sharp: 90 };
  const V173_WHEEL = new Set(['truck', 'vehicle', 'transport', 'supply', 'ambulance', 'amb251', 'kettenkrad', 'puma', 'pzb221', 'm16', 'm3gmc', 'stummel']);
  function v173Kind(u) { if (u.isHeavy) return 'crew'; if (u.armorType !== 'hard') return 'inf'; return V173_WHEEL.has(u.key) ? 'wheel' : 'track'; }
  const v173Ang = d => Math.atan2(Math.sin(d), Math.cos(d));
  function v173Head(a, b) { const A = getHexCenter(a.c, a.r), B = getHexCenter(b.c, b.r), v = unproj(B.x - A.x, B.y - A.y); return Math.atan2(v.y, v.x); }
  // cheapest path with the same rules as calculateReachableHexes; equal costs prefer hexes nearer the destination
  function v173Path(u, dest) {
    if (dest.rpath) return dest.rpath.map(h => ({ c: h.c, r: h.r, cost: h.cost }));   // v196: a reverse move carries its own path
    const D = getHexCenter(dest.c, dest.r), h = (c, r) => { const p = getHexCenter(c, r); return Math.hypot(p.x - D.x, p.y - D.y); };
    const k0 = u.c + ',' + u.r, dist = { [k0]: 0 }, prev = {}, q = [{ c: u.c, r: u.r, cost: 0, h: 0 }];
    while (q.length) {
      q.sort((a, b) => a.cost - b.cost || a.h - b.h); const cur = q.shift(), ck = cur.c + ',' + cur.r;
      if (cur.cost > dist[ck]) continue; if (cur.c === dest.c && cur.r === dest.r) break;
      for (const n of getHexNeighbors(cur.c, cur.r)) {
        const step = getTileMovementCost(u, cur.c, cur.r, n.c, n.r); if (step === Infinity) continue;
        const occ = getUnitAt(n.c, n.r); if (occ && occ !== u && (occ.team !== u.team || occ.armorType === 'hard' || occ.isHeavy)) continue;
        const cost = cur.cost + step, nk = n.c + ',' + n.r;
        if (cost > u.remainingMove || (u.hasFuel && cost > u.fuel)) continue;
        if (dist[nk] !== undefined && dist[nk] <= cost) continue;
        dist[nk] = cost; prev[nk] = ck; q.push({ c: n.c, r: n.r, cost, h: h(n.c, n.r) });
      }
    }
    const dk = dest.c + ',' + dest.r; if (dist[dk] === undefined) return null;
    const path = []; for (let k = dk; k !== undefined; k = prev[k]) { const [c, r] = k.split(',').map(Number); path.unshift({ c, r, cost: dist[k] }); if (k === k0) break; }
    return path[0].c === u.c && path[0].r === u.r ? path : null;
  }
  // would unit u, standing on (c, r), see enemy e? (same rules as updateVision, for one viewer)
  function v173Sees(u, c, r, e) {
    const d = getDistance(c, r, e.c, e.r), t = getTerrain(c, r) || {};
    const sight = Math.max(1, (u.baseSight || u.sight || 3) + (t.elevation || 0) - (suppState(u) >= 2 ? 1 : 0));
    if (d > sight) return false;
    if (d > 1 && LAYERS.sight && sightLine(c, r, e.c, e.r, eyeOf(u)).block) return false;
    if (LAYERS.sight && LAYERS.conceal) { const k = concealOf(e.c, e.r); if (k && d > k) return false; }
    if (e.buff && e.buff.camo && d > 2) return false;
    if (d > 1 && typeof smokes !== 'undefined' && smokes.some(sm => sm.team !== u.team && sm.hexes.some(x => x.c === e.c && x.r === e.r))) return false;
    return true;
  }
  function v173Plan__base(u, mc) {
    const fa0 = u.facingAngle, seen0 = new Set(units.filter(e => e.team !== u.team && e.hp > 0 && !e.isLoaded && visibleHexes.has(e.c + ',' + e.r)).map(e => e.id));
    const path = v173Path(u, mc);
    if (!path || path.length < 2 || Math.abs(path[path.length - 1].cost - mc.cost) > 1e-6) return { mc, path: null, fa0, seen0 };
    let stop = path.length - 1;
    if (V173.stop) {
      const foes = units.filter(e => e.team !== u.team && e.hp > 0 && !e.isLoaded && !visibleHexes.has(e.c + ',' + e.r))
        .concat(typeof bunkers !== 'undefined' ? bunkers.filter(b => b.team !== u.team && b.hp > 0 && !visibleHexes.has(b.c + ',' + b.r)) : []);
      if (foes.length) for (let i = 1; i < path.length - 1; i++) if (foes.some(e => v173Sees(u, path[i].c, path[i].r, e))) {
        let j = i; while (j < path.length - 1 && getUnitAt(path[j].c, path[j].r)) j++;   // never stop on a friendly's hex
        stop = j; break;
      }
    }
    const p = path.slice(0, stop + 1), last = p[p.length - 1];
    return { mc: stop === path.length - 1 ? mc : Object.assign({}, mc, { c: last.c, r: last.r, cost: last.cost }), path: p, fa0, seen0 };
  }
  // ---- animation ----
  function v173Begin__base(u, P) {
    const path = P.path, n = path.length - 1, kind = v173Kind(u), H = [];
    for (let i = 0; i < n; i++) H.push(v173Head(path[i], path[i + 1]));
    if (!u.isHeavy && !P.keep) u.facingAngle = H[n - 1];            // logic facing: direction of the last leg (P.keep: scripted moves hand the facing back)
    if (reduceMotion()) return;
    const pts = path.map(h => getHexCenter(h.c, h.r)), fixed = null, piv = kind === 'track' || kind === 'crew' || kind === 'inf';   // v177: crew-served weapons pivot like vehicles (logic facing stays as it was)
    const dps = kind === 'crew' ? V173.turnDpsCrew : (u.cost || 0) >= 400 ? V173.turnDpsHeavy : V173.turnDps, ms = V173.msHex[kind], ph = [];
    const turn = (a, b) => { const d = v173Ang(b - a); if (Math.abs(d) * 180 / Math.PI < (kind === 'inf' ? 25 : 12)) return; ph.push({ k: 't', a, d, dur: Math.abs(d) * 180 / Math.PI / dps * 1000 }); };
    let fa = P.fa0 === undefined ? H[0] : P.fa0, s0 = 0;
    if (piv) { turn(fa, H[0]); fa = H[0]; }
    for (let i = 1; i <= n; i++) {
      const brk = i === n || (piv && Math.abs(v173Ang(H[i] - H[i - 1])) * 180 / Math.PI >= V173.sharp);
      if (!brk) continue;
      ph.push({ k: 'm', s0, s1: i, fa, dur: (i - s0) * ms });
      if (i < n) { turn(H[i - 1], H[i]); fa = H[i]; }
      s0 = i;
    }
    if ((kind === 'crew' || P.keep) && P.fa0 !== undefined) turn(H[n - 1], P.fa0);   // the gun ends up facing the way it did before the move
    let T = ph.reduce((a, x) => a + x.dur, 0); const sc = T > V173.maxMs ? V173.maxMs / T : 1;
    let t = performance.now(); const t0 = t; ph.forEach(x => { x.t0 = t; t += x.dur * sc; x.t1 = t; });
    V173.anim = { u, pts, H, ph, kind, fixed, fa0: P.fa0, t0, tEnd: t, seen0: P.seen0 };
    requestAnimationFrame(v173Tick);
  }
  function v173State(A, now) {
    const ph = A.ph.find(x => now < x.t1) || A.ph[A.ph.length - 1], pt = i => A.pts[Math.min(i, A.pts.length - 1)];
    const at = s => { const i = Math.min(Math.floor(s), A.pts.length - 2), f = s - i, a = pt(i), b = pt(i + 1); return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, i, f }; };
    const k = Math.max(0, Math.min(1, (now - ph.t0) / Math.max(1, ph.t1 - ph.t0)));
    if (ph.k === 't') { const p = at(A.ph.filter(x => x.k === 'm' && x.t1 <= ph.t0).reduce((m, x) => Math.max(m, x.s1), 0)); return { x: p.x, y: p.y, fa: ph.a + ph.d * (k * k * (3 - 2 * k)) }; }
    const ease = A.kind === 'inf' || A.kind === 'crew' ? .45 : 1, e = k - ease * Math.sin(2 * Math.PI * k) / (2 * Math.PI);   // vehicles start and stop smoothly
    const s = ph.s0 + (ph.s1 - ph.s0) * e, p = at(s);
    let fa = A.H[p.i];
    const from = p.i === ph.s0 ? (A.kind === 'track' || A.kind === 'crew' || A.kind === 'inf' ? ph.fa : (p.i === 0 ? (A.fa0 === undefined ? fa : A.fa0) : A.H[p.i - 1])) : A.H[p.i - 1];
    const blend = A.kind === 'inf' ? .3 : .5, w = Math.min(1, p.f / blend);
    fa = from + v173Ang(fa - from) * (w * w * (3 - 2 * w));
    return { x: p.x, y: p.y, fa };
  }
  function v173Pos__base(u) {
    const A = V173.anim; if (!A || A.u !== u) return null;
    const now = performance.now(); if (now >= A.tEnd) return null;
    const st = v173State(A, now); A.cur = st; return st;
  }
  function v173End__base() { if (!V173.anim) return; V173.anim = null; render(); if (typeof v129Kick === 'function') v129Kick(); }
  function v173Tick__base() { const A = V173.anim; if (!A) return; if (performance.now() >= A.tEnd || A.u.hp <= 0) { v173End(); return; } render(); requestAnimationFrame(v173Tick); }
  // vehicle sprites are baked per 15° direction on first use (slow on phones): mid-turn frames use the nearest baked one
  function v173Snap__base(u, fa) {
    if (typeof TANK_SPR === 'undefined' || !TANK_SPR.on || !TANK_SPR.mkey) return fa;
    const mk = TANK_SPR.mkey(u); if (!mk) return fa;
    TANK_SPR.ensureView(); const paint = TANK_SPR.paintOf(u.team), N = TANK_SPR.N, i = TANK_SPR.idx(fa);
    for (let d = 0; d <= N / 2; d++) for (const j of [i + d, i - d]) { const jj = ((j % N) + N) % N; if (TANK_SPR.cache.has(mk + '|' + paint + '|' + jj)) return TANK_SPR.yaw(jj); }
    return fa;
  }
  // drawn facing follows the animation (the logic facing is already final)
  {  /* drawUnitArt: layer moved to js/chains/drawUnitArt.js */ }
  // floating numbers caused by the move (mines, watch fire) appear when the unit arrives
  {  /* fxDraw: layer moved to js/chains/fxDraw.js */ }
  // a tap during the animation only skips it
  canvas.addEventListener('click', e => { if (!V173.anim) return; V173.anim.tEnd = 0; v173End(); e.stopImmediatePropagation(); e.preventDefault(); }, true);
  // settings switch
  (function () {
    const a = document.getElementById('sight-opt'); if (!a) return;
    const g = document.createElement('div'); g.className = 'set-group';
    g.innerHTML = '<h3>이동 중 적 발견 시 정지 (v173)</h3><div class="set-row"><select id="v173-stop"><option value="on" selected>켜짐 — 새 적이 보이는 칸에서 멈춤</option><option value="off">꺼짐 — 목적지까지 이동</option></select></div>';
    a.closest('.set-group').after(g);
    g.querySelector('select').addEventListener('change', e => { V173.stop = e.target.value === 'on'; });
  })();

