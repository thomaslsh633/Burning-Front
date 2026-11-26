  // [chain:drawBanner] 2 layers; the original in [10] and older layers were dead code and are removed.
  //   Call order, outermost first: drawBanner → drawBanner__v106
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // drawBanner: from [17&], calls drawBanner__v106
  function drawBanner(u) { if (V147.on && !V147.drawing && v147GarrisonOf(u)) return; return drawBanner__v106.apply(this, arguments); }

  // drawBanner__v106: from [17m], does NOT call the layer below
  function drawBanner__v106(u, x, y) {
    const sel = u === selectedUnit || (isDraggingFacing && u === facingUnit);
    const tgt = validAttacks.some(t => t.c === u.c && t.r === u.r) || (pendingAttackTarget && pendingAttackTarget.c === u.c && pendingAttackTarget.r === u.r);
    const own = u.team === currentTurn, kind = v105Kind(u), far = zoom < V98.chipZoom;
    const k = 1.15 * (far ? .92 : Math.max(.86, Math.min(1.12, .86 + (zoom - 1.4) * .14))) * (sel ? 1.25 : tgt ? 1.12 : 1);   // v109: up to 1.12 at the closer zooms · v111: +15 %
    const W = (kind === 'veh' ? 24 : 18) * k, TIP = 8.6 * k, H = 16.4 * k + TIP;
    const tankSpr = TANK_SPR.on && u.armorType === 'hard' && TANK_SPR.mkey(u), infSpr = INF_SPR.on && TANK_SPR.on && u.armorType !== 'hard' && (INF_SPR.squads[u.team] || {})[u.key];
    const gun117 = !tankSpr && V115_GUN[u.team + ':' + u.key];
    const lift = tankSpr ? (v117Small(tankSpr) ? 2.0 * v117Hs() * (.55 + HZ * .45) + 3 : 3.1 * v117Vs() * (.55 + HZ * .45)) : infSpr ? (1.75 * v117Hs()) * (.45 + HZ * .55) + 4.5 : gun117 ? gun117.Hm * v117Hs() * (.45 + HZ * .55) + 4 : u.armorType === 'hard' ? 13 : (u.isHeavy || u.isMortar || u.isArtillery) ? 11.5 : 11;   // v117
    const canAtk = (u.atk || 0) > 0, atkUsed = !!u.hasAttacked || !canAtk, mv = Math.max(0, Math.floor(u.remainingMove || 0));
    const done = own && mv <= 0 && atkUsed && !sel;
    ctx.save(); ctx.translate(x, y - lift); ctx.scale(1 / zoom, 1 / zoom);
    if (done) ctx.globalAlpha = .6;
    ctx.save(); ctx.translate(.7, 1.1); v105Shield(kind, W, H, TIP); ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.fill(); ctx.restore();        // drop shadow
    v105Shield(kind, W, H, TIP); const gr = ctx.createLinearGradient(0, -H, 0, -TIP); gr.addColorStop(0, '#2d343c'); gr.addColorStop(1, '#181c21'); ctx.fillStyle = gr; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#0e1114'; ctx.fillRect(-W, -TIP, 2 * W, TIP + 1); ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(-W, -TIP, 2 * W, .6); ctx.restore();   // darker tip pocket
    v105Shield(kind, W, H, TIP); ctx.lineJoin = 'miter'; ctx.lineWidth = sel ? 1.5 : tgt ? 1.4 : 1;
    ctx.strokeStyle = sel ? '#f2f5f8' : tgt ? '#ef4b3c' : u.rank >= 3 ? '#d8b25a' : 'rgba(160,172,184,.6)'; ctx.stroke();
    if (v129Idle(u) && (reduceMotion() || performance.now() % 500 < 280)) {   // v129: idle while the end-turn confirm is armed
      v105Shield(kind, W, H, TIP); ctx.save(); ctx.lineWidth = 2.4; ctx.strokeStyle = '#facc15'; ctx.shadowColor = 'rgba(250,204,21,.85)'; ctx.shadowBlur = 5; ctx.stroke(); ctx.restore();
    }
    // HP: one solid bar in the team colour
    const tc = V105.bar[u.team] || '#cbd5e1', hp = Math.max(0, Math.min(1, u.hp / u.maxHp)), bx = -W / 2 + 2 * k, bw = W - 4 * k, by = -H + 1.9 * k, bh = (far ? 2 : 2.6) * k;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx, by, bw, bh); ctx.fillStyle = tc; ctx.fillRect(bx, by, bw * hp, bh);
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(bx, by, bw * hp, Math.max(.5, bh * .28));
    if (u._pv) { const n = Math.max(0, Math.min(hp, u._pv.n)); ctx.fillStyle = 'rgba(0,0,0,' + u._pv.a + ')'; ctx.fillRect(bx + bw * n, by, bw * (hp - n), bh); }
    // white class mark, centred in the body (dimmed once the attack is spent)
    const ic = v105Icon(u.team, u.key), cy = (by + bh - TIP) / 2 + .5 * k;
    ctx.save(); if (own && atkUsed && canAtk && !done) ctx.globalAlpha *= .42;
    if (ic) { const wide = ic.width > ic.height, iw = (wide ? 17.5 : 10.4) * k, ih = wide ? iw / 2 : iw; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(ic, -iw / 2, cy - ih / 2, iw, ih); }
    else { ctx.translate(0, cy); ctx.scale(k * .8, k * .8); o_dg102(unitKind(u), '#f2f5f8'); }
    ctx.restore();
    // move points left: white number in the tip (own side's turn only; spent = grey 0)
    if (own && !far) { ctx.fillStyle = mv > 0 ? '#ffffff' : '#69727c'; ctx.font = '600 ' + (7.2 * k).toFixed(2) + 'px Oswald, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(mv), 0, -TIP * .58); }
    // veterancy stars
    if (u.rank > 0) {
      const sy = -H - 3.6 * k, sr = (far ? 2.4 : 2.9) * k; ctx.lineJoin = 'round';
      for (let i = 0; i < u.rank; i++) { const p = new Path2D(v100Star((i - (u.rank - 1) / 2) * sr * 2.15, sy, sr)); ctx.lineWidth = 1.1 * k; ctx.strokeStyle = 'rgba(20,14,4,.9)'; ctx.stroke(p); ctx.fillStyle = '#f3c74f'; ctx.fill(p); }
    }
    if (!far) {
      const bY = (by + bh - TIP) / 2 + .5 * k;
      if (u.N > 0) {   // head count
        const r = 4.2 * k, bxR = -W / 2 - .2 * k, lo = u.models < u.N; ctx.beginPath(); ctx.arc(bxR, bY, r, 0, 6.2832); ctx.fillStyle = '#12161b'; ctx.fill(); ctx.lineWidth = 1.1 * k; ctx.strokeStyle = lo ? '#f0b43c' : '#e8ecf0'; ctx.stroke();
        const pm = u._pvM !== undefined && u._pvM < u.models && u._pv && u._pv.a > .6 ? u._pvM : null;   // v130: predicted head count while the preview pulses
        ctx.fillStyle = pm !== null ? '#f87171' : lo ? '#f0b43c' : '#fff'; ctx.font = '600 ' + (6.4 * k).toFixed(2) + 'px Oswald, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(Math.max(0, pm !== null ? pm : u.models)), bxR, bY + .35 * k);
      }
      const st = v105Status(u, own);
      if (st) { ctx.save(); ctx.translate(W / 2 + .2 * k, bY); ctx.scale(.82 * k, .82 * k); drawStatusIcon(st[0], 0, 0, st[1]); ctx.restore(); }
      v140BannerMarks(u, W, k, bY);   // v140
      if (typeof v167CrewMarks === 'function') v167CrewMarks(u, W, H, k);   // v167: emplaced / packed / cannot fire
    }
    ctx.restore();
  }


