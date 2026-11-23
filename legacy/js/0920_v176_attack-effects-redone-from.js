  // ══════════════════════════════════════════════════════════════
  // [v176] Attack effects redone from the Burning Bridges footage:
  //   · muzzle: short white-yellow flash, then 4 big grey smoke clouds rolling out along the barrel (~0.45 s)
  //   · impact: ~1 s in four stages (white flash → yellow fireball of lumpy lobes → orange billows → dark smoke → thin haze), no flying dirt
  //   · the hit hex is tinted red for the whole exchange; shells are short and nearly invisible (0.45 s for artillery)
  //   · flamethrower: five pulses, and the target hex keeps burning ~1.2 s
  //   · terrain-aware impacts (snow spray, water column, brick dust, leaves), misses land beside the target,
  //     vehicles flash when hit and smoke when penetrated, kills leave a smoke column, artillery shows an incoming ring
  //   · the victim's HP bar slides to the new value 0.3 s after impact; damage numbers can be switched off

  // ══════════════════════════════════════════════════════════════
  var V176 = { tail: 500, blend: 300, counterGap: 350, nums: true, flash: new Map() };
  const v176Lerp = (a, b, k) => a + (b - a) * k, v176Cl = (k, a, b) => Math.max(0, Math.min(1, (k - a) / (b - a)));
  const v176Dir = u => { const fa = v183Ang(u) || 0, d = v174Proj(Math.cos(fa), Math.sin(fa)), l = Math.hypot(d.x, d.y) || 1; return { x: d.x / l, y: d.y / l }; };
  function v176Soft(x, y, r, rgb, a) { const g = ctx.createRadialGradient(x, y, r * .15, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.7, `rgba(${rgb},${a * .75})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); }
  // ---- muzzle ----
  /* v174Flash: layer moved to js/chains/v174Flash.js */
  function v176Muzzle(t, att, big) {
    const m = v174Muzzle(att, 'cannon'), d = v176Dir(att), sc = big ? 1.35 : 1;
    for (let i = 0, nP = Math.max(2, Math.round(4 * v178K())); i < nP; i++) {
      const t0 = t + 30 + i * 40, r0 = (8 + i * 1.2) * sc, drift = (14 + i * 6) * sc, sx = m.x + d.x * (3 + i * 3), sy = m.y + d.y * (3 + i * 3) - 1, jit = v174Rand(-1.5, 1.5);
      v174Add(t0, 450, (k) => { const e = 1 - (1 - k) * (1 - k); v176Soft(sx + d.x * drift * e + jit, sy + d.y * drift * e - 3 * k, r0 * (.8 + .9 * e), '168,174,180', .85 * (1 - k * k)); });
    }
  }
  // ---- impact fireball ----
  function v176Fireball(t, pt, R) {
    const lobes = Array.from({ length: Math.max(4, Math.round(7 * v178K())) }, (_, i) => ({ a: i * 0.9 + v174Rand(0, .5), d: v174Rand(.1, .55) * R, r: v174Rand(.5, .72) * R, ph: v174Rand(0, 1) }));
    v174Add(t, 1000, (k) => {
      const grow = 1 - Math.pow(1 - v176Cl(k, 0, .22), 2), fire = 1 - v176Cl(k, .3, .55), smoke = v176Cl(k, .22, .5) * (1 - v176Cl(k, .6, 1)), haze = v176Cl(k, .5, .7) * (1 - v176Cl(k, .7, 1));
      if (k < .08) v176Soft(pt.x, pt.y, R * (.6 + k * 4), '255,255,255', 1 - k * 8 * .5);
      lobes.forEach(L => {
        const x = pt.x + Math.cos(L.a) * L.d * grow, y = pt.y + Math.sin(L.a) * L.d * grow * .75 - k * R * .5, r = L.r * (.4 + .6 * grow) * (1 + .18 * k);
        if (smoke > 0) v176Soft(x, y - k * R * .2, r * 1.05, '66,62,58', .62 * smoke);
        if (haze > 0) v176Soft(x, y - k * R * .35, r * 1.2, '128,124,118', .22 * haze);
        if (fire > 0) {
          const c = k < .12 ? '255,250,215' : k < .26 ? '255,214,96' : '238,128,36';
          v176Soft(x, y, r, c, .95 * fire); if (k > .06) v176Soft(x + r * .12, y - r * .12, r * .55, k < .2 ? '255,255,235' : '255,190,70', .6 * fire);
        }
      });
    });
  }
  function v176Surface(c, r) {
    const t = getTerrain(c, r) || {}, ty = t.terrainType || '';
    if (/water/.test(ty)) return 'water'; if (/building|rubble/.test(ty)) return 'brick'; if (/forest|bush|wood/.test(ty)) return 'leaf';
    const win = typeof v99G !== 'undefined' && v99G.info && v99G.info.winter; return win ? 'snow' : 'dirt';
  }
  function v176Debris(t, pt, kind, R) {
    if (kind === 'water') {
      v174Add(t, 700, (k) => { const h = R * 2 * Math.sin(Math.min(1, k * 1.6) * Math.PI) * (1 - k * .3); ctx.fillStyle = `rgba(225,238,248,${.8 * (1 - k)})`; ctx.beginPath(); ctx.ellipse(pt.x, pt.y - h * .5, R * .32, Math.max(.5, h * .5), 0, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = `rgba(235,245,255,${.7 * (1 - k)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(pt.x, pt.y, R * (.5 + 1.4 * k), R * (.3 + .8 * k), 0, 0, 6.2832); ctx.stroke(); });
      return;
    }
    const col = kind === 'snow' ? '240,246,252' : kind === 'brick' ? '196,156,120' : kind === 'leaf' ? '110,150,70' : '150,128,96';
    const n = Math.max(3, Math.round((kind === 'leaf' ? 9 : 7) * v178K())), pieces = Array.from({ length: n }, () => [v174Rand(-1, 1), v174Rand(-1.5, -.5), v174Rand(.6, 1.6)]);
    v174Add(t, 560, (k) => { pieces.forEach(([vx, vy, s2]) => { const x = pt.x + vx * R * 1.3 * k, y = pt.y + vy * R * 1.4 * k + R * 1.8 * k * k; ctx.fillStyle = `rgba(${col},${.9 * (1 - k)})`; ctx.fillRect(x - s2 / 2, y - s2 / 2, s2 * (kind === 'snow' ? 1.4 : 1), s2); }); });
    if (kind === 'snow') v174Add(t, 700, (k) => { v176Soft(pt.x, pt.y - R * .3 * k, R * (.6 + .6 * k), '246,250,255', .5 * (1 - k)); });
  }
  /* v174Boom: layer moved to js/chains/v174Boom.js */
  /* v174Puff: layer moved to js/chains/v174Puff.js */
  // ---- red target hex while the exchange runs ----
  function v176Target(t0, t1, c, r) { v174Add(t0, t1 - t0, (k, now) => { const T = now - t0, D = t1 - t0, a = Math.min(1, T / 100) * (1 - v176Cl(T, D - 350, D)); v175Hex(c, r, .98); ctx.fillStyle = `rgba(255,86,64,${.3 * a})`; ctx.fill(); ctx.strokeStyle = `rgba(255,130,110,${.7 * a})`; ctx.lineWidth = 1.2; ctx.stroke(); }); }
  function v176Ring(t0, t1, pt) { v174Add(t0, t1 - t0, (k) => { ctx.strokeStyle = `rgba(255,70,50,${.9 * (1 - k * .4)})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(pt.x, pt.y, 24 - 15 * k, (24 - 15 * k) * .6, 0, 0, 6.2832); ctx.stroke(); }); }
  function v176Fire(t, pt, dur) { const fl = Array.from({ length: Math.max(4, Math.round(8 * v178K())) }, () => ({ x: v174Rand(-12, 12), y: v174Rand(-5, 6), ph: v174Rand(0, 6) })); v174Add(t, dur, (k, now) => { const a = 1 - v176Cl(k, .6, 1); fl.forEach(f => { const w = .75 + .25 * Math.sin(now / 70 + f.ph); v176Soft(pt.x + f.x, pt.y + f.y - 3 * w, 7 * w, '255,150,40', .85 * a); v176Soft(pt.x + f.x, pt.y + f.y - 6 * w, 3.6 * w, '255,235,150', .8 * a); }); }); }
  function v176Column(t, pt, dur) { for (let i = 0; i < 7; i++) { const t0 = t + i * 150, dx = v174Rand(-4, 4); v174Add(t0, dur, (k) => v176Soft(pt.x + dx + 6 * k, pt.y - 6 - 46 * k, 6 + 8 * k, '40,38,36', .6 * (1 - k))); } }
  // ---- one attack, rebuilt ----
  /* v174Attack: layer moved to js/chains/v174Attack.js */
  // vehicles flash when hit
  {  /* drawUnitArt: layer moved to js/chains/drawUnitArt.js */ }
  // damage numbers on / off
  {  /* fxDraw: layer moved to js/chains/fxDraw.js */ }
  (function () {
    const a = document.getElementById('v175-confirm'); if (!a) return;
    const g = document.createElement('div'); g.className = 'set-group';
    g.innerHTML = '<h3>피해 숫자 표시 (v176)</h3><div class="set-row"><select id="v176-nums"><option value="on" selected>표시 — 체력 바와 함께 떠오름</option><option value="off">숨김 — 체력 바만</option></select></div>';
    a.closest('.set-group').after(g);
    g.querySelector('select').addEventListener('change', e => { V176.nums = e.target.value === 'on'; });
  })();

