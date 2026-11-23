  // [chain:drawBuildingShape] 5 layers over drawBuildingShape__base ([10]).
  //   Call order, outermost first: drawBuildingShape → drawBuildingShape__v140 → drawBuildingShape__v133 → drawBuildingShape__v99 → drawBuildingShape__v98 → drawBuildingShape__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // drawBuildingShape: from [v168], calls drawBuildingShape__v140
  function drawBuildingShape(x, y, b) {
      if (!(V99 && V99.on) || !b || !BLD[b.type]) return drawBuildingShape__v140.apply(this, arguments);
      const G = v151Geo(b); ctx.save(); ctx.translate(G.x, G.y); ctx.scale(G.k, G.k);
      try { drawBuildingShape__v140.call(this, 0, 0, b); } finally { ctx.restore(); }
    }

  // drawBuildingShape__v140: from [17*], calls drawBuildingShape__v133
  function drawBuildingShape__v140(x, y, b) {
      if (!b.uc) { const r = drawBuildingShape__v133.apply(this, arguments); if (b.team === currentTurn && v140Rally(b.team) === b) v140Flag(x, y); return r; }
      ctx.save(); ctx.globalAlpha *= .5; drawBuildingShape__v133.apply(this, arguments); ctx.restore();
      const R = HEX_RADIUS; ctx.save(); ctx.strokeStyle = 'rgba(214,180,120,.95)'; ctx.lineWidth = Math.max(1, R * .05);
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * R * .28, y + R * .15); ctx.lineTo(x + i * R * .28, y - R * .95); ctx.stroke(); }
      for (let j = 0; j < 3; j++) { const yy = y - R * (.05 + j * .3); ctx.beginPath(); ctx.moveTo(x - R * .6, yy); ctx.lineTo(x + R * .6, yy); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(x - R * .56, y + R * .1); ctx.lineTo(x + R * .56, y - R * .9); ctx.stroke();
      ctx.font = `600 ${Math.round(R * .34)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.75)';
      const t = '🏗 ' + b.uc.left; ctx.strokeText(t, x, y - R * 1.15); ctx.fillStyle = '#fde68a'; ctx.fillText(t, x, y - R * 1.15);
      ctx.restore();
    }

  // drawBuildingShape__v133: from [17v], calls drawBuildingShape__v99
  function drawBuildingShape__v133(x, y, b) {
    if (!(V99 && V99.on)) return drawBuildingShape__v99(x, y, b);
    const e = v133Spr(b); if (!e) return drawBuildingShape__v99(x, y, b);
    const behind = units.some(u => { if (u.hp <= 0 || u.isLoaded || (u.team !== currentTurn && !visibleHexes.has(`${u.c},${u.r}`))) return false; const p = getHexCenter(u.c, u.r); return p.y < y - 2 && p.y > y - e.top - 4 && Math.abs(p.x - x) < e.W * .42; });
    ctx.save(); if (behind) ctx.globalAlpha = .68;
    const P = (v99G.info && v99G.info.pal) || V99PAL.summer, yd = ctx.createRadialGradient(x, y, 2, x, y, 21);
    yd.addColorStop(0, v99rgb(P.dirt, 1, .55)); yd.addColorStop(1, v99rgb(P.dirt, 1, 0)); ctx.fillStyle = yd; ctx.beginPath(); ctx.ellipse(x, y, 23, 23 * TILT * 1.1, 0, 0, 6.3); ctx.fill();
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(zoom * DPR <= 2.2 ? e.lo : e.hi, x - e.PX, y - e.PY, e.W, e.H);
    if (e.flag) v99Flag(x + e.flag.dx, y + e.flag.dy, e.flag.h, b.team, b.type === 'hq' ? 1.05 : .85);
    if (b.hp / b.maxHp < .5) for (let k = 0; k < 3; k++) { const px = x + (v99h(b.c, b.r, k) - .5) * 14, py = y - e.top * .7 - k * 5, rr = 4 + k * 1.6; const gr = ctx.createRadialGradient(px, py, 1, px, py, rr); gr.addColorStop(0, 'rgba(40,40,42,.5)'); gr.addColorStop(1, 'rgba(40,40,42,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(px, py, rr, 0, 6.3); ctx.fill(); }
    ctx.restore();
  }

  // drawBuildingShape__v99: from [17g], calls drawBuildingShape__v98
  function drawBuildingShape__v99(x, y, b) {
    if (!V99.on) return drawBuildingShape__v98(x, y, b);
    const behind = units.some(u => { if (u.hp <= 0 || u.isLoaded || (u.team !== currentTurn && !visibleHexes.has(`${u.c},${u.r}`))) return false; const p = getHexCenter(u.c, u.r); return p.y < y - 2 && p.y > y - HEX_RADIUS * 1.25 && Math.abs(p.x - x) < HEX_RADIUS * 1.4; });
    ctx.save(); if (behind) ctx.globalAlpha = .68; v99Bld(x, y, b); ctx.restore();
  }

  // drawBuildingShape__v98: from [17f], calls drawBuildingShape__base
  function drawBuildingShape__v98(x, y, b) {
    const behind = units.some(u => { if (u.hp <= 0 || u.isLoaded || (u.team !== currentTurn && !visibleHexes.has(`${u.c},${u.r}`))) return false; const p = getHexCenter(u.c, u.r); return p.y < y - 2 && p.y > y - HEX_RADIUS * 1.05 && Math.abs(p.x - x) < HEX_RADIUS * 1.35; });
    if (!behind) return drawBuildingShape__base(x, y, b);
    ctx.save(); ctx.globalAlpha = .55; drawBuildingShape__base(x, y, b); ctx.restore();
  }


