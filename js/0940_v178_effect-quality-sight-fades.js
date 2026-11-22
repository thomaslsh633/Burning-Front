  // ══════════════════════════════════════════════════════════════
  // [v178] Effect quality + sight fades + vehicle dust
  //   · quality low / mid / high scales particle counts and caps the number of live effects (saved in localStorage)
  //   · enemy units fade in (0.25 s) when they come into view and fade out when they leave it; no fade on turn change,
  //     for the player's own units, or with reduced motion; banners wait until the fade is over
  //   · wheeled and tracked vehicles kick up dust behind them while they drive (colour follows the ground)
  // ══════════════════════════════════════════════════════════════
  var V178 = { q: 'mid', fade: true, fadeMs: 250, st: new Map(), turn: null, alpha: new Map(), raf: 0 };
  const V178_Q = { low: { k: .5, cap: 45, dust: 120 }, mid: { k: 1, cap: 120, dust: 65 }, high: { k: 1.5, cap: 240, dust: 40 } };
  try { const v = localStorage.getItem('coh1944.fxq'); if (V178_Q[v]) V178.q = v; const f = localStorage.getItem('coh1944.fade'); if (f === 'off') V178.fade = false; } catch (e) { }
  function v178K() { return V178_Q[V178.q].k; }
  function v178Cap() { return V178_Q[V178.q].cap; }
  function v178Kick() { if (!V178.raf) V178.raf = requestAnimationFrame(() => { V178.raf = 0; render(); }); }
  function v178Show(u) {
    const hidden = V173.anim && u.team !== V173.anim.u.team && !V173.anim.seen0.has(u.id);
    const vis = !hidden && (u.team === currentTurn || visibleHexes.has(`${u.c},${u.r}`));
    if (V178.turn !== currentTurn) { V178.turn = currentTurn; V178.st.clear(); V178.alpha.clear(); }
    if (!V178.fade || reduceMotion() || u.team === currentTurn) { V178.st.set(u.id, { vis, t: -1e9 }); V178.alpha.delete(u); return vis; }
    const now = performance.now(); let s = V178.st.get(u.id);
    if (!s) { s = { vis, t: -1e9 }; V178.st.set(u.id, s); }
    else if (s.vis !== vis) { s.vis = vis; s.t = now; }
    const k = (now - s.t) / V178.fadeMs;
    if (k >= 1) { V178.alpha.delete(u); return vis; }
    V178.alpha.set(u, vis ? Math.max(0, k) : 1 - k); v178Kick(); return true;
  }
  {  /* drawUnitArt: layer moved to js/chains/drawUnitArt.js */ }
  // ---- dust behind driving vehicles ----
  function v178Dust(u, st) {
    const A = V173.anim; if (!A || A.u !== u || (A.kind !== 'wheel' && A.kind !== 'track')) return;
    const now = performance.now(), lp = A.lp; A.lp = { x: st.x, y: st.y };
    if (!lp || Math.hypot(st.x - lp.x, st.y - lp.y) < .25 || now - (A.dn || 0) < V178_Q[V178.q].dust) return;
    A.dn = now;
    const sf = v176Surface(u.c, u.r); if (sf === 'water') return;
    const d = v174Proj(-Math.cos(st.fa) * 14, -Math.sin(st.fa) * 14), rgb = sf === 'snow' ? '214,224,234' : sf === 'dirt' ? '150,128,96' : '150,146,140';
    const px = st.x + d.x + v174Rand(-2, 2), py = st.y + d.y + v174Rand(-1, 1) + 2, r0 = A.kind === 'track' ? 6 : 4.6, dx = d.x * .7, dy = d.y * .7 - 4, a0 = sf === 'snow' ? .8 : .6;
    v174Add(now, 650, (k) => { v176Soft(px + dx * k, py + dy * k, r0 * (.8 + 1.5 * k), rgb, a0 * (1 - k) * (1 - k * .3)); });
    v174Kick();
  }
  {  /* v173Pos: layer moved to js/chains/v173Pos.js */ }
  // ---- settings ----
  (function () {
    const a = document.getElementById('v176-nums'); if (!a) return;
    const g = document.createElement('div'); g.className = 'set-group';
    g.innerHTML = '<h3>연출 품질 · 시야 페이드 (v178)</h3><div class="set-row"><select id="v178-q"><option value="low">연출 품질: 낮음 — 입자 적게 (느린 기기)</option><option value="mid">연출 품질: 보통</option><option value="high">연출 품질: 높음 — 입자 많이</option></select></div><div class="set-row"><select id="v178-fade"><option value="on">시야 페이드: 켜기</option><option value="off">시야 페이드: 끄기</option></select></div>';
    a.closest('.set-group').after(g);
    const q = g.querySelector('#v178-q'), f = g.querySelector('#v178-fade'); q.value = V178.q; f.value = V178.fade ? 'on' : 'off';
    q.addEventListener('change', e => { V178.q = e.target.value; try { localStorage.setItem('coh1944.fxq', V178.q); } catch (x) { } });
    f.addEventListener('change', e => { V178.fade = e.target.value === 'on'; V178.st.clear(); V178.alpha.clear(); try { localStorage.setItem('coh1944.fade', V178.fade ? 'on' : 'off'); } catch (x) { } render(); });
  })();

