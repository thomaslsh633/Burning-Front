  // ══════════════════════════════════════════════════════════════
  // [v175] Two-tap movement: select a unit → reachable hexes → tap a hex: the route lights up in blinking bright green and the
  //        destination shows its move cost → tap the same hex again to move. Any other tap re-previews or cancels.
  // ══════════════════════════════════════════════════════════════
  var V175 = { on: true, pend: null, raf: 0 };
  function v175Valid() {
    const P = V175.pend; if (!P) return null;
    if (!selectedUnit || selectedUnit.id !== P.uid || selectedUnit.team !== currentTurn || selectedUnit.hp <= 0 || V173.anim) { V175.pend = null; return null; }
    if (!validMoves.some(m => m.c === P.c && m.r === P.r)) { V175.pend = null; return null; }
    return P;
  }
  // true = go ahead and move; false = preview only
  function v175Confirm(u, mc) {
    const P = v175Valid();
    if (P && P.c === mc.c && P.r === mc.r) { V175.pend = null; return true; }
    const path = v173Path(u, mc);
    V175.pend = { uid: u.id, c: mc.c, r: mc.r, cost: mc.cost, path: path ? path.slice(1).map(h => ({ c: h.c, r: h.r })) : [], t0: performance.now() };
    v175Kick(); render();
    return false;
  }
  function v175Kick() { if (!V175.raf && !reduceMotion()) V175.raf = requestAnimationFrame(v175Tick); }
  function v175Tick() { V175.raf = 0; if (!v175Valid()) { render(); return; } render(); V175.raf = requestAnimationFrame(v175Tick); }
  function v175Hex(c, r, grow) {
    const ctr = getHexCenter(c, r), R = HEX_RADIUS * (grow || .97); ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = (60 * i - 30) * Math.PI / 180, d = v174Proj(R * Math.cos(a), R * Math.sin(a)); i ? ctx.lineTo(ctr.x + d.x, ctr.y + d.y) : ctx.moveTo(ctr.x + d.x, ctr.y + d.y); }
    ctx.closePath(); return ctr;
  }
  function v175Preview() {
    const P = v175Valid(); if (!P) return;
    const now = performance.now(), blink = reduceMotion() ? .75 : .5 + .5 * Math.sin((now - P.t0) / 150);
    ctx.save(); ctx.lineJoin = 'round';
    const draw = (c, r, k) => { v175Hex(c, r); ctx.fillStyle = `rgba(16,214,84,${(.30 + .32 * blink) * k})`; ctx.fill(); ctx.strokeStyle = `rgba(34,222,100,${(.75 + .25 * blink) * Math.min(1, k)})`; ctx.lineWidth = 1.5; ctx.stroke(); };
    P.path.forEach(h => { if (h.c !== P.c || h.r !== P.r) draw(h.c, h.r, .85); });
    draw(P.c, P.r, 1.15);
    // cost badge: dark inverted triangle with the move points the trip uses
    const q = getHexCenter(P.c, P.r), w = 4.25, h = 4.5, x = q.x, y = q.y - 1.5;
    ctx.beginPath(); ctx.moveTo(x - w, y - h); ctx.lineTo(x + w, y - h); ctx.lineTo(x, y + 2); ctx.closePath();
    ctx.fillStyle = 'rgba(16,22,26,.92)'; ctx.fill(); ctx.strokeStyle = 'rgba(210,255,190,.95)'; ctx.lineWidth = .6; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(Math.round(P.cost * 10) / 10), x, y - h / 2 + .25);
    ctx.restore();
  }
  // switches
  (function () {
    const a = document.getElementById('v173-stop'); if (!a) return;
    const g = document.createElement('div'); g.className = 'set-group';
    g.innerHTML = '<h3>이동 확인 (v175)</h3><div class="set-row"><select id="v175-confirm"><option value="on" selected>두 번 탭 — 경로 미리보기 후 같은 칸을 다시 눌러 이동</option><option value="off">한 번 탭 — 바로 이동</option></select></div>';
    a.closest('.set-group').after(g);
    g.querySelector('select').addEventListener('change', e => { V175.on = e.target.value === 'on'; V175.pend = null; render(); });
  })();

