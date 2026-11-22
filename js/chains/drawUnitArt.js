  // [chain:drawUnitArt] 14 layers over drawUnitArt__base ([10]).
  //   Call order, outermost first: drawUnitArt → drawUnitArt__v181 → drawUnitArt__v180 → drawUnitArt__v178 → drawUnitArt__v176 → drawUnitArt__v174 → drawUnitArt__v173 → drawUnitArt__v157 → drawUnitArt__v151 → drawUnitArt__v147 → drawUnitArt__v134 → drawUnitArt__v115 → drawUnitArt__v96 → drawUnitArt__v67 → drawUnitArt__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // drawUnitArt: from [v185], calls drawUnitArt__v181
  function drawUnitArt(u, x, y) {
      const r = drawUnitArt__v181.apply(this, arguments), g = V185.rot || V185.pend ? v185Ghost(u) : null; if (g === null) return r;
      const save = u.facingAngle; ctx.save(); ctx.globalAlpha *= .42; u.facingAngle = g; V185.ghost = true;
      try { drawUnitArt__v181.call(this, u, x, y); } finally { V185.ghost = false; u.facingAngle = save; ctx.restore(); }
      return r;
    }

  // drawUnitArt__v181: from [v181], calls drawUnitArt__v180
  function drawUnitArt__v181(u, x, y) {
      const now = performance.now(), A = V173.anim; let a = 1;
      const e = V181.emerge.get(u); if (e !== undefined) { const k = (now - e) / 160; if (k >= 1) V181.emerge.delete(u); else a = Math.max(0, k); }
      if (A && A.u === u && V181.board.has(u)) { const k = (A.tEnd - now) / 140; a = Math.min(a, Math.max(0, Math.min(1, k))); }
      else if (V181.board.has(u) && !(A && A.u === u)) V181.board.delete(u);
      // plant / lift motion of a crew-served weapon
      const P = V181.plant.get(u); if (P) { const k = (v174Now() - P.t0) / 280; if (k >= 1 || k < 0) { if (k >= 1) V181.plant.delete(u); } else y += (P.on ? 1 : -1) * 2.2 * Math.sin(k * Math.PI); }
      if (a >= 1) return drawUnitArt__v180.call(this, u, x, y);
      ctx.save(); ctx.globalAlpha *= a; try { return drawUnitArt__v180.call(this, u, x, y); } finally { ctx.restore(); }
    }

  // drawUnitArt__v180: from [v180], calls drawUnitArt__v178
  function drawUnitArt__v180(u, x, y) {
      const T = V180.turn.get(u); if (!T || (V173.anim && V173.anim.u === u)) return drawUnitArt__v178.apply(this, arguments);
      if (T.tur) return drawUnitArt__v178.apply(this, arguments);   // v183: turret turn — the hull stays, v183Pose reads the animation
      const now = v174Now(); let fa;
      if (now < T.t0) fa = T.a; else if (now < T.t0 + T.dur) { const k = (now - T.t0) / T.dur; fa = T.a + T.d * k * k * (3 - 2 * k); } else return drawUnitArt__v178.apply(this, arguments);
      const save = u.facingAngle;
      u.facingAngle = v173Snap(u, fa); try { return drawUnitArt__v178.apply(this, arguments); } finally { u.facingAngle = save; }
    }

  // drawUnitArt__v178: from [v178], calls drawUnitArt__v176
  function drawUnitArt__v178(u, x, y) {
      const a = V178.alpha.get(u); if (a === undefined) return drawUnitArt__v176.apply(this, arguments);
      ctx.save(); ctx.globalAlpha *= a; try { return drawUnitArt__v176.apply(this, arguments); } finally { ctx.restore(); }
    }

  // drawUnitArt__v176: from [v176], calls drawUnitArt__v174
  function drawUnitArt__v176(u, x, y) {
      const f = V176.flash.get(u), now = v174Now();
      if (f !== undefined && now >= f && now < f + 130 && 'filter' in ctx) { ctx.save(); ctx.filter = 'brightness(2.2) saturate(.5)'; try { return drawUnitArt__v174.call(this, u, x, y); } finally { ctx.restore(); } }
      return drawUnitArt__v174.call(this, u, x, y);
    }

  // drawUnitArt__v174: from [v174], calls drawUnitArt__v173
  function drawUnitArt__v174(u, x, y) {
      const rt = V174.recoil.get(u), now = v174Now();
      if (rt !== undefined && now >= rt) { const k = Math.min(1, (now - rt) / 260), d = 3.2 * (k < .15 ? k / .15 : (1 - k) / .85), v = v174Proj(-Math.cos(v183Ang(u) || 0) * d, -Math.sin(v183Ang(u) || 0) * d); x += v.x; y += v.y; }
      const A = V173.anim; if (A && A.u === u && A.kind === 'inf' && !u.isHeavy) y -= Math.abs(Math.sin((now - A.t0) / 95)) * 1.3;
      return drawUnitArt__v173.call(this, u, x, y);
    }

  // drawUnitArt__v173: from [v173], calls drawUnitArt__v157
  function drawUnitArt__v173(u, x, y) {
      const A = V173.anim; if (!A || A.u !== u || A.fixed !== null || !A.cur) return drawUnitArt__v157.apply(this, arguments);
      const fa = u.facingAngle; u.facingAngle = v173Snap(u, A.cur.fa); try { return drawUnitArt__v157.apply(this, arguments); } finally { u.facingAngle = fa; } }

  // drawUnitArt__v157: from [17+4], calls drawUnitArt__v151
  function drawUnitArt__v157(u, x, y) {
      let o = null; try { o = v157Lean(u); } catch (err) { o = null; }
      if (!o) return drawUnitArt__v151.apply(this, arguments);
      return drawUnitArt__v151.call(this, u, x + o[0], y + o[1]);
    }

  // drawUnitArt__v151: from [v168], calls drawUnitArt__v147
  function drawUnitArt__v151(u, x, y) { const E = u && u.empl && V134_EMPL[u.empl]; if (!E) return drawUnitArt__v147.apply(this, arguments);
      if (u.cells && u.cells.length > 1) { ctx.save(); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2; ctx.strokeStyle = u.team === 'blue' ? 'rgba(56,189,248,.55)' : 'rgba(248,113,113,.55)';
        u.cells.forEach(([c, r]) => { const p = getHexCenter(c, r); hexPath(p.x, p.y, HEX_RADIUS * .92); ctx.stroke(); }); ctx.restore(); }   // v212: large emplacement footprint
      const args = arguments; return v151Fit(u.empl, E.full ? 'full' : 'back', E.full ? TANK_SPR.idx(u.facingAngle) : 0, () => drawUnitArt__v147.apply(this, args)); }

  // drawUnitArt__v147: from [17&], calls drawUnitArt__v134
  function drawUnitArt__v147(u) { if (V147.on && v147GarrisonOf(u)) return; return drawUnitArt__v134.apply(this, arguments); }

  // drawUnitArt__v134: from [17w], calls drawUnitArt__v115
  function drawUnitArt__v134(u, x, y) {
    const E = u && u.empl && V134_EMPL[u.empl]; if (!E) return drawUnitArt__v115(u, x, y);
    const k = v117Hs() / V134.S, tc = u.team === 'blue' ? '#38bdf8' : '#f87171';
    if (E.full) {
      const e = v134Get(u.empl, 'full', TANK_SPR.idx(u.facingAngle)); if (!e) return;
      ctx.save(); v98Disc(x, y, tc, tc, 15 * V109.FK, 15 * V109.FK * TILT * 1.07); v134Draw(e, x, y, k); ctx.restore(); return;
    }
    const b = v134Get(u.empl, 'back', 0), f = v134Get(u.empl, 'front', 0);
    ctx.save(); v134Draw(b, x, y, k); ctx.restore();
    const at = u.armorType, md = u.models; u.armorType = 'soft'; u.models = null;
    try { drawUnitArt__v115(u, x, y); } finally { u.armorType = at; u.models = md; }
    ctx.save(); v134Draw(f, x, y, k); ctx.restore();
  }

  // drawUnitArt__v115: from [17p], calls drawUnitArt__v96
  function drawUnitArt__v115(u, x, y) {
    const g = TANK_SPR.on && u.armorType !== 'hard' && V115_GUN[u.team + ':' + u.key];
    if (!g) return drawUnitArt__v96(u, x, y);
    const n = Math.max(0, Math.min(g.n, u.models == null ? g.n : u.models)), e = GUN_SPR.get(g, n, u.facingAngle), D = v115Scale(g), k = D / g.S, tc = u.team === 'blue' ? '#38bdf8' : '#f87171';
    ctx.save();
    v98Disc(x, y, tc, tc, 15 * V109.FK, 15 * V109.FK * TILT * 1.07);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(D * zoom * DPR <= g.S * 2 ? e.lo : e.hi, x - e.PX * k, y - e.PY * k, e.W * k, e.H * k);
    ctx.restore();
    GUN_SPR.warm(g, n);
  }

  // drawUnitArt__v96: from [17e], calls drawUnitArt__v67
  function drawUnitArt__v96(u, x, y) {
    const figs = INF_SPR.on && TANK_SPR.on && u.armorType !== 'hard' ? (INF_SPR.squads[u.team] || {})[u.key] : null;
    if (!figs) return drawUnitArt__v67(u, x, y);
    const n = Math.max(1, Math.min(figs.length, u.models || figs.length)), fa = u.facingAngle, tc = u.team === 'blue' ? '#38bdf8' : '#f87171';
    const P = (a, b) => { const c = Math.cos(fa), s = Math.sin(fa), px = a * c - b * s, py = a * s + b * c; return [x + px * COSA - py * SINA, y + (px * SINA + py * COSA) * TILT]; };
    ctx.save();
    v98Disc(x, y, tc, tc, 15 * V109.FK, 15 * V109.FK * TILT * 1.07);                  // v98: drop shadow + translucent team disc
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    const gs = v98InfScale(), f = v117Hs() / INF_SPR.S, fs = (1 + (gs - 1) * .4) * V109.FK * 1.1;   // v129: wider wedge for the larger men, still inside the hex   // v117: the common human scale; v109 wedge
    const big = zoom * DPR * f > 1.6;
    INF_SPR.FORM.slice(0, n).map(([a, b], k) => ({ p: P(a * fs, b * fs), k })).sort((m, q) => m.p[1] - q.p[1]).forEach(({ p, k }) => {
      const e = INF_SPR.get(figs[k], fa); ctx.drawImage(big ? e.hi : e.lo, p[0] - INF_SPR.PX * f, p[1] - INF_SPR.PY * f, INF_SPR.W * f, INF_SPR.H * f);
    });
    ctx.restore();
    INF_SPR.warm(figs);
  }

  // drawUnitArt__v67: from [17e], calls drawUnitArt__base
  function drawUnitArt__v67(u, x, y) {
    const mk = TANK_SPR.mkey(u);
    if (!TANK_SPR.on || u.armorType !== 'hard' || !mk) return drawUnitArt__base(u, x, y);
    const e = TANK_SPR.get(mk, u.team, u.facingAngle); TANK_SPR.warm(mk, u.team);
    const blue = u.team === 'blue', tc = blue ? '#38bdf8' : '#f87171', K = v117VehS(mk) / TANK_SPR.S, img = zoom * DPR * K <= 1.6 ? e.lo : e.hi;   // v117: per-class scale
    ctx.save();
    // same armour/team ring the prism tanks use (kept as the readable team cue), softened under the sprite
    v98Disc(x, y, tc, u.armor >= 30 ? '#fbbf24' : tc, 15 * K, 15 * K * TILT * 1.07);   // v98: drop shadow + translucent team disc
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    // v183: turret pose (Sherman / Panzer IV): hull-only + turret-only sprites, the turret ring kept on the hull's ring; falls back to the whole
    //   sprite until both parts are baked. Antenna rod and pennant are no longer drawn (v183).
    const md = TANK_SPR.models[mk], hi_ = TANK_SPR.idx(u.facingAngle), ta = V182.on && md.tp ? v183Pose(u) : null;
    let drawn = false;
    if (ta !== null) {
      const tj = TANK_SPR.idx(ta), sfx = img === e.lo ? 'lo' : 'hi';
      if (tj !== hi_) {
        const ph = TANK_SPR.getPart(mk, u.team, hi_, 'h', false), pt = TANK_SPR.getPart(mk, u.team, tj, 't', false);
        if (ph && pt) {
          const Ti = TankBaker.projectPoint(TANK_SPR.view, TANK_SPR.yaw(hi_), md.X0, TANK_SPR.S, md.tp[0], md.tp[1], md.tp[2]), Tj = TankBaker.projectPoint(TANK_SPR.view, TANK_SPR.yaw(tj), md.X0, TANK_SPR.S, md.tp[0], md.tp[1], md.tp[2]);
          ctx.drawImage(ph[sfx], x - TANK_SPR.PX * K, y - TANK_SPR.PY * K, TANK_SPR.W * K, TANK_SPR.H * K);
          ctx.drawImage(pt[sfx], x - TANK_SPR.PX * K + (Ti[0] - Tj[0]) * K, y - TANK_SPR.PY * K + (Ti[1] - Tj[1]) * K, TANK_SPR.W * K, TANK_SPR.H * K);
          drawn = true; V182.splitDraws++;
        }
      }
    }
    if (!drawn) ctx.drawImage(img, x - TANK_SPR.PX * K, y - TANK_SPR.PY * K, TANK_SPR.W * K, TANK_SPR.H * K);
    ctx.restore();
  }


