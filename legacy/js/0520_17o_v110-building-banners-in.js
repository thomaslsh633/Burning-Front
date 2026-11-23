  // ══════════════════════════════════════════════════════════════
  // [17o] v110 — building banners in the unit-banner style: dark pointed shield, HP bar in the team colour on top,
  //       white building mark in the body, tier code (HQ / T1 / T2a …) in the tip, one status badge (HQ crippled) on the right
  // ══════════════════════════════════════════════════════════════
  const v110Helmet = (K, red) => { K.D('M3.4 15.6 A8.6 8.6 0 0 1 20.6 15.6 Z'); if (red) K.P(2, 15.2, 22, 15.2, 21.4, 18.4, 18.6, 17.2, 5.4, 17.2, 2.6, 18.4); else K.RR(1.6, 15, 20.8, 2.4, 1.1); };
  const v110Cog = (K, cx, cy, r) => { for (let i = 0; i < 8; i++) K.at(cx, cy, i * 45, k => k.R(-r * .22, -r * 1.3, r * .44, r * .6)); K.C(cx, cy, r).cut(k => k.C(cx, cy, r * .42)); };
  const v110Star = (K, cx, cy, r) => K.D(v100Star(cx, cy, r));
  const V110_BLD = {
    hq: (K, red) => K.P(3.4, 21.5, 3.4, 12.6, 11, 6.8, 18.6, 12.6, 18.6, 21.5).cut(k => k.R(9.4, 15.6, 3.2, 5.9).R(5.4, 13.6, 2.4, 2.2).R(14.2, 13.6, 2.4, 2.2)).R(19.2, 1.6, 1.2, 19.9).P(20.4, 1.8, 23.4, 3.6, 20.4, 5.6),
    outpost: K => K.P(1.6, 20.6, 12, 5.4, 22.4, 20.6).cut(k => k.P(9.6, 20.6, 12, 13.6, 14.4, 20.6)).R(11.4, 2.4, 1.2, 4).P(12.6, 2.4, 16, 3.4, 12.6, 4.4),
    barracks: (K, red) => v110Helmet(K, red),
    support_center: K => V105_SQ['blue:hmg'](K),
    motor_pool: K => v110Cog(K, 12, 12, 6.4),
    air_coy: K => K.RR(10.9, 2.4, 2.2, 19.4, 1.1).P(1.4, 11.6, 12, 8.4, 22.6, 11.6, 22.6, 13.4, 12, 12, 1.4, 13.4).P(7.4, 20.2, 16.6, 20.2, 16.6, 21.8, 7.4, 21.8),
    doc_inf: (K, red) => { K.at(0, 3.4, 0, k => v110Helmet(k, red)); v110Star(K, 12, 4.6, 3.8); },
    doc_mech: K => { v110Cog(K, 12, 14.4, 5.2); v110Star(K, 12, 3.6, 3.4); },
    doc_air: K => { v105Canopy(K, 12, 15, 7.2, 4); K.L(6, 15.4, 12, 22.4, .9).L(18, 15.4, 12, 22.4, .9).L(10, 15.8, 12, 22.4, .9).L(14, 15.8, 12, 22.4, .9); v110Star(K, 12, 3.8, 3.4); }
  };
  const V110_ICO = new Map();
  function v110BldIcon(b) {
    const id = b.team + ':' + b.type; if (V110_ICO.has(id)) return V110_ICO.get(id);
    let c = null;
    try {
      if (b.type === 'tank_depot') c = v105Icon(b.team, b.team === 'blue' ? 'sherman' : 'panzer4');
      else if (V110_BLD[b.type]) c = v105Paint(96, 96, K => V110_BLD[b.type](K, b.team === 'red'));
    } catch (e) { c = null; }
    V110_ICO.set(id, c); return c;
  }
  function v110BldBanner__base(b, x, y) {
    const sel = b === selBld && !selectedUnit, tgt = validAttacks.some(t => t.c === b.c && t.r === b.r) || (pendingAttackTarget && pendingAttackTarget.c === b.c && pendingAttackTarget.r === b.r);
    const far = zoom < V98.chipZoom, k = 1.15 * (far ? .8 : Math.max(.86, Math.min(1.12, .86 + (zoom - 1.4) * .14))) * (sel ? 1.25 : tgt ? 1.12 : 1);   // v111: +15 %
    const W = 23 * k, TIP = 8.6 * k, H = 17.6 * k + TIP, top = v99BldTop(b) * HZ;
    ctx.save(); ctx.translate(x, y - top - 2); ctx.scale(1 / zoom, 1 / zoom);
    ctx.save(); ctx.translate(.7, 1.1); v105Shield('veh', W, H, TIP); ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.fill(); ctx.restore();
    v105Shield('veh', W, H, TIP); const gr = ctx.createLinearGradient(0, -H, 0, -TIP); gr.addColorStop(0, '#2d343c'); gr.addColorStop(1, '#181c21'); ctx.fillStyle = gr; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#0e1114'; ctx.fillRect(-W, -TIP, 2 * W, TIP + 1); ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(-W, -TIP, 2 * W, .6); ctx.restore();
    v105Shield('veh', W, H, TIP); ctx.lineJoin = 'miter'; ctx.lineWidth = sel ? 1.5 : tgt ? 1.4 : 1; ctx.strokeStyle = sel ? '#f2f5f8' : tgt ? '#ef4b3c' : 'rgba(160,172,184,.6)'; ctx.stroke();
    const tc = V105.bar[b.team] || '#cbd5e1', hp = Math.max(0, Math.min(1, b.hp / b.maxHp)), bx = -W / 2 + 2 * k, bw = W - 4 * k, by = -H + 1.9 * k, bh = (far ? 2 : 2.6) * k;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx, by, bw, bh); ctx.fillStyle = tc; ctx.fillRect(bx, by, bw * hp, bh); ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(bx, by, bw * hp, Math.max(.5, bh * .28));
    if (b._pv) { const n = Math.max(0, Math.min(hp, b._pv.n)); ctx.fillStyle = 'rgba(0,0,0,' + b._pv.a + ')'; ctx.fillRect(bx + bw * n, by, bw * (hp - n), bh); }
    const ic = v110BldIcon(b), cy = (by + bh - TIP) / 2 + .5 * k;
    if (ic) { const wide = ic.width > ic.height, iw = (wide ? 18 : 12.6) * k, ih = wide ? iw / 2 : iw; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(ic, -iw / 2, cy - ih / 2, iw, ih); }
    if (!far) {
      const s = (bd(b.type, b.team) || {}).s || ''; ctx.fillStyle = '#fff'; ctx.font = '600 ' + ((s.length > 2 ? 5.6 : 6.6) * k).toFixed(2) + 'px Oswald, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, 0, -TIP * .6);
      if (b.crippled) { ctx.save(); ctx.translate(W / 2 + .2 * k, (by + bh - TIP) / 2); ctx.scale(.82 * k, .82 * k); drawStatusIcon('supp', 0, 0, '#ef4444'); ctx.restore(); }
    }
    ctx.restore();
  }

