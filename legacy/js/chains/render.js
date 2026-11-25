  // [chain:render] 14 layers over render__base ([10]).
  //   Call order, outermost first: render → render__v194 → render__v174 → render__v147 → render__v140 → render__v130 → render__v129 → render__v99 → render__v59 → render__v30 → render__s10_3 → render__s10_2 → render__s10 → render__v20 → render__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // render: from [19], calls render__v194
  function render() { const r = render__v194.apply(this, arguments); if (SHELL.inGame && !SHELL.hudRaf) SHELL.hudRaf = requestAnimationFrame(shHudSync); return r; }

  // render__v194: from [v194], calls render__v174
  function render__v194() { if (V196.uid && !(selectedUnit && selectedUnit.id === V196.uid)) V196.uid = null; return render__v174.apply(this, arguments); }

  // render__v174: from [v174], calls render__v147
  function render__v174() {
      if (!V174.hold.size) return render__v147.apply(this, arguments);
      const now = v174Now(), saved = [];
      V174.hold.forEach((h, u) => { if (now < h.until) { saved.push([u, u.hp, u.models, u.suppression]); u.hp = h.hp; u.models = h.models; if (h.sup !== undefined) u.suppression = h.sup; }
        else if (now < h.until + V176.blend) { saved.push([u, u.hp, u.models, u.suppression]); const k = (now - h.until) / V176.blend; u.hp = h.hp + (u.hp - h.hp) * k; } });   // v176: bar slides to the new value
      try { return render__v147.apply(this, arguments); } finally { saved.forEach(([u, hp, m, sp]) => { u.hp = hp; u.models = m; u.suppression = sp; }); }
    }

  // render__v147: from [17&], calls render__v140
  function render__v147() {
      render__v140.apply(this, arguments);
      if (!V147.on || !V147.structs.length) return;
      try {
        ctx.setTransform(DPR * zoom, 0, 0, DPR * zoom, 0, 0); ctx.save(); ctx.translate(-camX, -camY);
        V147.structs.slice().sort((a, b) => a.fy - b.fy).forEach(v147DrawStructBanner);
        ctx.restore();
      } catch (err) { console.warn('v147 banners', err); }
    }

  // render__v140: from [17*], calls render__v130
  function render__v140() { v140IntAll(); const r = render__v130.apply(this, arguments); v140RallyBtn(); return r; }

  // render__v130: from [17s], calls render__v129
  function render__v130() {
    if (!pendingAttackTarget) V130.pv = null;
    const L = V130.pv;
    if (!L || !L.length) return render__v129.apply(this, arguments);
    const a = reduceMotion() ? .7 : .45 + .4 * (.5 + .5 * Math.sin(performance.now() / 160));
    L.forEach(i => { const r = i.ref; if (r.hp > 0 && r.maxHp > 0 && i.next < r.hp) { r._pv = { n: Math.max(0, i.next / r.maxHp), a }; if (r.N) r._pvM = Math.max(0, Math.ceil(i.next / (r.maxHp / r.N) - 1e-6)); } });
    try { return render__v129.apply(this, arguments); } finally { L.forEach(i => { delete i.ref._pv; delete i.ref._pvM; }); }
  }

  // render__v129: from [17r], calls render__v99
  function render__v129() { v129Eject(); return render__v99.apply(this, arguments); }

  // render__v99: from [17g], calls render__v59
  function render__v99() { const r = render__v59.apply(this, arguments); v99Flush(); return r; }

  // render__v59: from [17c], calls render__v30
  function render__v59() {
    render__v30.apply(this, arguments);
    ctx.setTransform(DPR * zoom, 0, 0, DPR * zoom, 0, 0); ctx.save(); ctx.translate(-camX, -camY);
    capturePoints.forEach(cp => drawCapturePointFlag(cp));
    ctx.restore();
  }

  // render__v30: from [17b], calls render__s10_3
  function render__v30() {
    if (!PV) return render__s10_3();
    // 유닛 배너: 원래 체력 바 위에 예상 피해 구간을 검은색으로 나타냈다 사라지게 (hp·인원수는 건드리지 않음)
    const sw = PV.p > .001 ? PV.items.filter(i => i.ref) : [], old = sw.map(i => i.ref.hp);
    sw.forEach(i => { const r = i.ref; if (units.includes(r) && r.maxHp > 0) r._pv = { n: Math.max(0, i.next / r.maxHp), a: PV.p }; else r.hp = r.hp + (i.next - r.hp) * PV.p; });
    try { render__s10_3(); } finally { sw.forEach((i, k) => { delete i.ref._pv; i.ref.hp = old[k]; }); }
    if (PV) pvDraw();
  }

  // render__s10_3: from [10], calls render__s10_2
  function render__s10_3() {
    render__s10_2.apply(this, arguments);
    ctx.setTransform(DPR * zoom, 0, 0, DPR * zoom, 0, 0); ctx.save(); ctx.translate(-camX, -camY);
    if (V99 && V99.on) v99Fire(); else fires.forEach(f => f.hexes.forEach(h => { const q = getHexCenter(h.c, h.r); ctx.fillStyle = 'rgba(249,115,22,.38)'; ctx.beginPath(); ctx.arc(q.x, q.y, HEX_RADIUS * .8, 0, 6.3); ctx.fill(); }));
    ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
    units.forEach(u => {
      if (u.hp <= 0 || u.isLoaded) return;
      const mineU = u.team === currentTurn;
      if (!mineU && !visibleHexes.has(`${u.c},${u.r}`)) return;
      const q = getHexCenter(u.c, u.r);
      if (mineU && u.buff && u.buff.camo) { ctx.fillStyle = '#a5b4fc'; ctx.fillText('🫥', q.x - 11, q.y + 14); }
      if (u.shell && u.shell !== 'std') { ctx.fillStyle = u.shell === 'ap' ? '#93c5fd' : '#fca5a5'; ctx.fillText(u.shell.toUpperCase(), q.x - 11, q.y - 9); }
      if (u.marked > turnNo) { ctx.fillStyle = '#f87171'; ctx.fillText('🎯', q.x, q.y - 14); }
    });
    ctx.restore();
  }

  // render__s10_2: from [10], calls render__s10
  function render__s10_2() {
    render__s10.apply(this, arguments);
    ctx.setTransform(DPR * zoom, 0, 0, DPR * zoom, 0, 0); ctx.save(); ctx.translate(-camX, -camY);
    drawTerritory();
    if (V99 && V99.on) { v99Smoke(); v99Strike(); } else {
    smokes.forEach(sm => sm.hexes.forEach(h => { const q = getHexCenter(h.c, h.r); hexPath(q.x, q.y, HEX_RADIUS * .95); ctx.fillStyle = 'rgba(200,205,215,.3)'; ctx.fill(); ctx.fillStyle = hatchPat('smoke'); ctx.fill(); ctx.strokeStyle = 'rgba(226,232,240,.6)'; ctx.lineWidth = 1; ctx.stroke(); }));
    pendingStrikes.forEach(st => ring(st.c, st.r, st.rad).forEach(h => { const q = getHexCenter(h.c, h.r); hexPath(q.x, q.y, HEX_RADIUS * .92); ctx.fillStyle = hatchPat('strike'); ctx.fill(); ctx.strokeStyle = 'rgba(248,113,113,.9)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]); if (h.c === st.c && h.r === st.r) { ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('💥', q.x, q.y + 4); } })); }
    drawV24Overlays();
    ctx.restore();
  }

  // render__s10: from [10], calls render__v20
  function render__s10() { units.forEach(syncModels); return render__v20.apply(this, arguments); }

  // render__v20: from [10], calls render__base
  function render__v20() { render__base.apply(this, arguments); placeBalloon(); }


