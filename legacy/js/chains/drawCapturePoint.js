  // [chain:drawCapturePoint] 1 layer over drawCapturePoint__base ([17c]).
  //   Call order, outermost first: drawCapturePoint → drawCapturePoint__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // drawCapturePoint: from [17g], calls drawCapturePoint__base
  function drawCapturePoint(cp) {
    if (!V99.on) return drawCapturePoint__base(cp);
    const cs = cp.cores.map(k => getHexCenter(k[0], k[1])), x = cs.reduce((s, q) => s + q.x, 0) / cs.length, y = cs.reduce((s, q) => s + q.y, 0) / cs.length;
    if (x < camX - 50 || x > camX + VIEW_W + 50 || y < camY - 70 || y > camY + VIEW_H + 50) return;
    const now = performance.now(), rm = reduceMotion(), col = cp.owner ? TEAM_COL[cp.owner] : '#94a3b8';
    ctx.save();
    cs.forEach(q => { ctx.beginPath(); ctx.ellipse(q.x, q.y + 1, 10, 5.4, 0, 0, 6.3); ctx.fillStyle = 'rgba(20,22,24,.18)'; ctx.fill(); ctx.globalAlpha = .7; ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1; });
    const bx = x - HEX_RADIUS * .38, by = y - HEX_RADIUS * .2;   // stone base under the flag pole (pole sits on the back corner, see v98)
    if (!(typeof v155On === 'function' && v155On())) v99Solid(ctx, bx, by, .4, v99Prism([[-2.6, -2.6], [2.6, -2.6], [2.6, 2.6], [-2.6, 2.6]], 0, 1.4, .8), [140, 140, 136], .3);   // v155: the 3D mast has its own base
    const ft = cp.flashT ? (now - cp.flashT) / 1200 : 1;
    if (ft < 1 && !rm) { ctx.globalAlpha = 1 - ft; ctx.strokeStyle = col; ctx.lineWidth = 3 - ft * 2; ctx.beginPath(); ctx.ellipse(x, y, 9 + ft * 22, (9 + ft * 22) * .55, 0, 0, 6.3); ctx.stroke(); }
    ctx.restore();
  }


