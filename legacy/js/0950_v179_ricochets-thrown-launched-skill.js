  // ══════════════════════════════════════════════════════════════
  // [v179] Ricochets + thrown / launched skill effects + lob-path preview
  //   · a deflected shot against armour (hits landed, none penetrated) shows a flash, a ping ring, sparks and the shot
  //     skipping off the plate; small arms get little pings
  //   · thrown skills (satchel, Gammon bomb, sticky, bundle grenade), rifle grenades, rockets, aimed shots and S-mines each
  //     get their own flight and impact; thrown weapons fly on a parabola whose dotted path stays visible
  //   · picking a target for a thrown / launched skill previews the path (dashed arc with a travelling dot)
  // ══════════════════════════════════════════════════════════════
  var V179 = { res: new Map(), arc: true, sT: 0, sAt: -1e9 };
  try { if (localStorage.getItem('coh1944.arc') === 'off') V179.arc = false; } catch (e) { }
  {  /* calcDamage: layer moved to js/chains/calcDamage.js */ }
  const v179Norm = (x, y) => { const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l }; };
  const v179Lw = () => 1 / zoom * Math.max(1, zoom * .8);
  // ---- ricochet ----
  function v179Ping(t, pt, dir, big) {
    const n = Math.max(3, Math.round((big ? 11 : 4) * v178K())), sp = big ? 95 : 60, dur = big ? 430 : 280;
    const ps = Array.from({ length: n }, () => ({ vx: dir.x * v174Rand(-.1, .8) * sp + v174Rand(-.7, .7) * sp, vy: -v174Rand(.5, 1.25) * sp, l: v174Rand(.55, 1) }));
    v174Add(t, dur, (k, now) => {
      const T = (now - t) / 1000; ctx.lineCap = 'round'; ctx.lineWidth = 1.1 * v179Lw();
      ps.forEach(q => {
        const a = 1 - k / q.l; if (a <= 0) return;
        const x = pt.x + q.vx * T, y = pt.y + q.vy * T + 85 * T * T, x2 = x - q.vx * .035, y2 = y - (q.vy + 170 * T) * .035;
        ctx.strokeStyle = k < .3 ? `rgba(255,250,220,${a})` : `rgba(255,170,60,${a})`; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x, y); ctx.stroke();
      });
    });
    v174Add(t, 150, (k) => v176Soft(pt.x, pt.y, (big ? 10 : 5) * (.6 + .9 * k), '255,248,222', .95 * (1 - k)));
    if (!big) return;
    v174Add(t, 260, (k) => { ctx.strokeStyle = `rgba(255,255,255,${.75 * (1 - k)})`; ctx.lineWidth = 1.3 * v179Lw(); ctx.beginPath(); ctx.ellipse(pt.x, pt.y, 3 + 14 * k, (3 + 14 * k) * .6, 0, 0, 6.2832); ctx.stroke(); });
    const out = v179Norm(dir.x * .55 + v174Rand(-.3, .3), -.85), L = 52;   // the round skips off upward and slightly onward
    v174Add(t + 10, 280, (k) => { const e = 1 - (1 - k) * (1 - k), k0 = Math.max(0, e - .3);
      ctx.strokeStyle = `rgba(255,236,170,${1 - k})`; ctx.lineWidth = 1.8 * v179Lw(); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(pt.x + out.x * L * k0, pt.y + out.y * L * k0); ctx.lineTo(pt.x + out.x * L * e, pt.y + out.y * L * e); ctx.stroke(); });
    v174Add(t + 30, 520, (k) => v176Soft(pt.x + dir.x * 4 * k, pt.y - 3 - 6 * k, 4 + 5 * k, '120,116,110', .35 * (1 - k)));
  }
  {  /* v174Attack: layer moved to js/chains/v174Attack.js */ }
  // ---- thrown / launched skills ----
  const V179_T = [[/폭파 가방/, 'satchel'], [/감마/, 'gammon'], [/접착/, 'sticky'], [/뭉치/, 'bundle'], [/소총 유탄/, 'rgren'], [/총류탄/, 'atrg'], [/판저파우스트/, 'rocket'], [/약점/, 'shot'], [/S-마인/, 'smine']];
  const v179Type = l => { for (const [re, k] of V179_T) if (re.test(l || '')) return k; return 'gammon'; };
  function v179Sprite(kind, x, y, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    if (kind === 'bundle') { ctx.fillStyle = '#6b5a3a'; ctx.fillRect(-4, -1.3, 8, 2.6); ctx.fillStyle = '#d9d2b0'; ctx.fillRect(-.5, -1.6, 1, 3.2); }
    else if (kind === 'satchel') { ctx.fillStyle = '#7a5a34'; ctx.fillRect(-3.4, -2.4, 6.8, 4.8); ctx.fillStyle = '#c0392b'; ctx.fillRect(-1, -2.6, 2, 5.2); }
    else if (kind === 'sticky') { ctx.fillStyle = '#5a5f5a'; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, 6.2832); ctx.fill(); ctx.fillStyle = '#e8c34a'; ctx.fillRect(-.6, -3.2, 1.2, 2); }
    else if (kind === 'gammon') { ctx.fillStyle = '#8a7a58'; ctx.beginPath(); ctx.arc(0, 0, 2.8, 0, 6.2832); ctx.fill(); ctx.fillStyle = '#d8cfae'; ctx.fillRect(-.5, -3.4, 1, 2); }
    else { ctx.fillStyle = '#ffeab0'; ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, 6.2832); ctx.fill(); }
    ctx.restore();
  }
  // lob: the thing flies on a parabola, its ground shadow slides underneath, and the dotted path stays 0.4 s after landing
  function v179Lob(t0, A, B, dur, H, kind) {
    const pos = k => ({ x: A.x + (B.x - A.x) * k, y: A.y + (B.y - A.y) * k - 4 * H * k * (1 - k) }), fine = kind === 'rgren' || kind === 'atrg';
    v174Add(t0, dur + 400, (k, now) => {
      const kf = Math.min(1, (now - t0) / dur), fade = 1 - Math.max(0, (now - t0 - dur) / 400); if (fade <= 0) return;
      ctx.save(); ctx.setLineDash([3, 3]); ctx.lineWidth = v179Lw(); ctx.strokeStyle = `rgba(255,244,190,${(fine ? .4 : .6) * fade})`;
      ctx.beginPath(); for (let i = 0; i <= 18; i++) { const p = pos(kf * i / 18); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); } ctx.stroke(); ctx.restore();
    });
    v174Add(t0, dur, (k) => {
      const p = pos(k), h = 4 * H * k * (1 - k), gy = A.y + (B.y - A.y) * k;
      ctx.fillStyle = `rgba(0,0,0,${.28 * (1 - h / (H * 1.4 + 1))})`; ctx.beginPath(); ctx.ellipse(p.x, gy + 2, 3 * (1 - .4 * h / (H + 1)), 1.5, 0, 0, 6.2832); ctx.fill();
      v179Sprite(kind, p.x, p.y, k * (fine ? 0 : 16));
      if (fine) for (let j = 1; j <= 5; j++) { const q = pos(Math.max(0, k - j * .03)); v176Soft(q.x, q.y, 1.6 + j * .5, '225,225,215', .35 * (1 - j / 6)); }
    });
  }
  function v179Rocket(t0, A, B, dur) {
    v174Add(t0, dur + 700, (k, now) => {
      const T = now - t0, kk = Math.min(1, T / dur);
      for (let i = 0; i < 14; i++) { const kp = kk * i / 14, age = (T - kp * dur) / 700; if (age < 0 || age > 1) continue; v176Soft(A.x + (B.x - A.x) * kp, A.y + (B.y - A.y) * kp - 6 * age, 2 + 5 * age, '210,208,200', .5 * (1 - age)); }
      if (kk < 1) { const x = A.x + (B.x - A.x) * kk, y = A.y + (B.y - A.y) * kk; v176Soft(x, y, 3.4, '255,230,150', .95); }
    });
  }
  function v179Mine(t0, pt, c, r) {
    v174Add(t0, 240, (k) => { const h = 14 * (1 - (1 - k) * (1 - k)); ctx.fillStyle = '#4a4f4a'; ctx.fillRect(pt.x - 2.4, pt.y - 4 - h, 4.8, 5); ctx.fillStyle = '#2f332f'; ctx.fillRect(pt.x - 2.4, pt.y - 4 - h, 4.8, 1.4); });
    v174Add(t0, 300, (k) => v176Soft(pt.x, pt.y + 1, 6 + 8 * k, '140,126,100', .5 * (1 - k)));
    v174Boom(t0 + 240, { x: pt.x, y: pt.y - 14 }, 16, c, r);
    v174Add(t0 + 240, 260, (k) => { ctx.strokeStyle = `rgba(255,225,150,${1 - k})`; ctx.lineWidth = 1.1 * v179Lw(); ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = i * .5236 + .2, r0 = 6 + 22 * k, r1 = 10 + 34 * k; ctx.moveTo(pt.x + Math.cos(a) * r0, pt.y - 14 + Math.sin(a) * r0 * .6); ctx.lineTo(pt.x + Math.cos(a) * r1, pt.y - 14 + Math.sin(a) * r1 * .6); } ctx.stroke(); });
  }
  function v179Finish(t, B, boomT, size, res, showD) {
    if (!showD) return;
    v174Boom(boomT, B, size, t.c, t.r);
    const hard = t.armorType === 'hard';
    if (hard && res.dmg > 0) { V176.flash.set(t, boomT); for (let i = 0; i < 3; i++) v174Add(boomT + i * 120, 800, (k) => v176Soft(B.x + 3 * k, B.y - 6 - 16 * k, 3 + 4 * k, '70,68,66', .5 * (1 - k))); }
    if (res.kill) { v174Boom(boomT + 120, { x: B.x + 2, y: B.y - 3 }, size + 5); if (hard) v176Column(boomT + 200, B, 2200); }
  }
  function v179Throw(kind, a, t, t0, res) {
    const showA = v174Vis(a), showD = v174Vis(t); if (!showA && !showD) return t0;
    const dist = getDistance(a.c, a.r, t.c, t.r), A0 = getHexCenter(a.c, a.r), P0 = getHexCenter(t.c, t.r), hand = { x: A0.x, y: A0.y - 9 }, B = v174HitPt(t, 3);
    const L = Math.hypot(B.x - hand.x, B.y - hand.y), dir = v179Norm(B.x - hand.x, B.y - hand.y), tint = end => { if (showD) v176Target(t0, end + V176.tail, t.c, t.r); };
    let end;
    if (kind === 'smine') { v179Mine(t0, { x: P0.x, y: P0.y - 2 }, t.c, t.r); end = t0 + 520; }
    else if (kind === 'shot') {
      const mz = v174Muzzle(a, 'sniper'); if (showA) v174Flash(t0 + 80, mz, 3);
      v174Tracer(t0 + 90, mz, B, 100, 'rgba(255,245,210,.95)', 1.4, 30);
      if (showD) (t.armorType === 'hard' ? v174Spark : v174Puff)(t0 + 190, B, t.c, t.r);
      end = t0 + 230;
    } else if (kind === 'rocket') {
      const dur = 170 + 32 * dist;
      if (showA) { v174Flash(t0, hand, 7); for (let i = 0; i < 3; i++) v174Add(t0, 450, (k) => v176Soft(hand.x - dir.x * (6 + 16 * k) * (1 + i * .5), hand.y - dir.y * (6 + 16 * k) * (1 + i * .5) - 2, 5 + 9 * k, '200,196,186', .5 * (1 - k))); }
      v179Rocket(t0, hand, B, dur); v179Finish(t, B, t0 + dur, 17, res, showD); end = t0 + dur + 30;
    } else if (kind === 'rgren' || kind === 'atrg') {
      const dur = 240 + 38 * dist, H = Math.min(54, 10 + L * .22);
      if (showA) { v174Flash(t0, hand, 5); v174Add(t0, 350, (k) => v176Soft(hand.x + dir.x * 6 * k, hand.y + dir.y * 6 * k - 2, 4 + 6 * k, '190,190,184', .45 * (1 - k))); }
      v179Lob(t0, hand, B, dur, H, kind); v179Finish(t, B, t0 + dur, kind === 'atrg' ? 13 : 12, res, showD); end = t0 + dur + 30;
    } else {
      const dur = 340 + 70 * dist, H = kind === 'satchel' && dist <= 1 ? Math.min(22, 8 + L * .2) : Math.min(66, 14 + L * .32);
      const fuse = { sticky: 380, satchel: 520, bundle: 360, gammon: 260 }[kind] || 300, size = { gammon: 16, bundle: 20, satchel: 22, sticky: 15 }[kind] || 15, hit = t0 + dur;
      v179Lob(t0, hand, B, dur, H, kind);
      if (showD) v174Add(hit, fuse, (k) => v176Soft(B.x, B.y - 1, 2 + 1.2 * Math.sin(k * 40), '255,220,120', .9));   // fuse spark
      v179Finish(t, B, hit + fuse, size, res, showD); end = hit + fuse + 30;
    }
    tint(end); return end;
  }
  {  /* throwAt: layer moved to js/chains/throwAt.js */ }
  // ---- path preview while picking the target of a thrown / launched skill ----
  const V179_STY = { gammon: 'lob', bundle: 'lob', sticky: 'lob', satchel: 'lob', rgren: 'lob2', atrg: 'lob2', pfaust: 'line', faust: 'line' };
  function v179PreviewArc() {
    if (!V179.arc || !PV || actionMode !== 'usk' || !USKC.cur) return;
    const { u, id } = USKC.cur, sty = V179_STY[id]; if (!sty || !u) return;
    const A0 = getHexCenter(u.c, u.r), B0 = getHexCenter(PV.c, PV.r), A = { x: A0.x, y: A0.y - 9 }, B = { x: B0.x, y: B0.y - 4 }, L = Math.hypot(B.x - A.x, B.y - A.y);
    const H = sty === 'line' ? 0 : sty === 'lob2' ? Math.min(54, 10 + L * .22) : (id === 'satchel' ? Math.min(22, 8 + L * .2) : Math.min(66, 14 + L * .32)), now = performance.now(), still = reduceMotion();
    const pos = k => [A.x + (B.x - A.x) * k, A.y + (B.y - A.y) * k - 4 * H * k * (1 - k)];
    ctx.save(); ctx.setTransform(DPR * zoom, 0, 0, DPR * zoom, 0, 0); ctx.translate(-camX, -camY); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); for (let i = 0; i <= 24; i++) { const q = pos(i / 24); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }
    ctx.setLineDash([]); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3.2; ctx.stroke();
    ctx.setLineDash([4, 3.5]); ctx.lineDashOffset = still ? 0 : -(now / 55) % 7.5; ctx.strokeStyle = 'rgba(255,240,170,.95)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.setLineDash([]); ctx.strokeStyle = 'rgba(255,240,170,.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(B0.x, B0.y, 8, 5, 0, 0, 6.2832); ctx.stroke();
    if (!still) { const q = pos((now % 1100) / 1100); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(q[0], q[1], 2, 0, 6.2832); ctx.fill(); }
    ctx.restore();
  }
  {  /* pvDraw: layer moved to js/chains/pvDraw.js */ }
  (function () {
    const a = document.getElementById('v178-q'); if (!a) return;
    const g = document.createElement('div'); g.className = 'set-group';
    g.innerHTML = '<h3>투척 경로 미리보기 (v179)</h3><div class="set-row"><select id="v179-arc"><option value="on">켜기 — 투척·유탄·로켓 스킬 대상 선택 시 경로 표시</option><option value="off">끄기</option></select></div>';
    a.closest('.set-group').after(g); const sel = g.querySelector('select'); sel.value = V179.arc ? 'on' : 'off';
    sel.addEventListener('change', e => { V179.arc = e.target.value === 'on'; try { localStorage.setItem('coh1944.arc', V179.arc ? 'on' : 'off'); } catch (x) { } render(); });
  })();

