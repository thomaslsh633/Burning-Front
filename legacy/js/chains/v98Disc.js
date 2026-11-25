  // [chain:v98Disc] 1 layer; the original in [17f] and older layers were dead code and are removed.
  //   Call order, outermost first: v98Disc
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v98Disc: from [17g], does NOT call the layer below
  function v98Disc(x, y, fillCol, strokeCol, rx, ry) {
    if (!V99.on) { ctx.beginPath(); ctx.ellipse(x + 1, y + 2, rx - 1, ry - 1, 0, 0, 6.3); ctx.fillStyle = 'rgba(0,0,0,.26)'; ctx.fill(); ctx.beginPath(); ctx.ellipse(x, y + 1, rx, ry, 0, 0, 6.3); ctx.globalAlpha = .22; ctx.fillStyle = fillCol; ctx.fill(); ctx.globalAlpha = .75; ctx.lineWidth = 1.1; ctx.strokeStyle = strokeCol; ctx.stroke(); ctx.globalAlpha = 1; return; }
    ctx.save(); ctx.beginPath(); ctx.ellipse(x + 1, y + 1.5, rx - 2.5, ry - 2, 0, 0, 6.3); ctx.fillStyle = 'rgba(0,0,0,.09)'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y + 1, rx, ry, 0, 0, 6.3); ctx.globalAlpha = .45; ctx.lineWidth = .65; ctx.strokeStyle = strokeCol; ctx.stroke(); ctx.restore();
  }


