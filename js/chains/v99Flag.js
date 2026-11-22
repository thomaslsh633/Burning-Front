  // [chain:v99Flag] 1 layer over v99Flag__base ([17g]).
  //   Call order, outermost first: v99Flag → v99Flag__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v99Flag: from [17h], calls v99Flag__base
  function v99Flag(px, py, top, team, sc = 1) {
    const id = v100FlagId(team), F = V100_FLAGS[id], fw = 10.5 * sc, fh = fw * F.h / F.w, t = py - top;
    if (!V100.flagCv[id]) return v99Flag__base(px, py, top, team, sc);
    ctx.strokeStyle = '#2f3134'; ctx.lineWidth = .75; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, t - .8); ctx.stroke();
    ctx.fillStyle = '#d9b762'; ctx.beginPath(); ctx.arc(px, t - 1, .75, 0, 6.3); ctx.fill();
    v100DrawFlag(ctx, id, px + .35, t, fw, fh, performance.now() / 300 + px * .1);
  }


