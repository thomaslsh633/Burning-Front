  // [chain:drawStatusIcon] 1 layer over drawStatusIcon__base ([10]).
  //   Call order, outermost first: drawStatusIcon → drawStatusIcon__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // drawStatusIcon: from [17j], calls drawStatusIcon__base
  function drawStatusIcon(kind, x, y, col) {
    const n = V102_ST[kind]; if (!n || !V100.icoCv[n]) return drawStatusIcon__base(kind, x, y, col);
    ctx.save(); ctx.translate(x, y); const g = ctx.createRadialGradient(-1.3, -1.5, .4, 0, 0, 4.8); g.addColorStop(0, '#4a5460'); g.addColorStop(1, '#191d23');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, 6.3); ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = col; ctx.stroke(); drawIco(ctx, n, 0, .1, 6.8); ctx.restore();
  }


