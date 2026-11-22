  // [chain:v99Bunker] 2 layers over v99Bunker__base ([17g]).
  //   Call order, outermost first: v99Bunker → v99Bunker__v134 → v99Bunker__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v99Bunker: from [v168], calls v99Bunker__v134
  function v99Bunker(b) { const id = b.team + ':' + (b.type === 'mg' ? 'bk_mg' : 'bk_med'); return v151Fit(id, 'full', v133Face(b), () => v99Bunker__v134.call(this, b)); }

  // v99Bunker__v134: from [17w], calls v99Bunker__base
  function v99Bunker__v134(b) {
    const id = b.team + ':' + (b.type === 'mg' ? 'bk_mg' : 'bk_med'), e = v134Get(id, 'full', v133Face(b));
    if (!e || e.none) return v99Bunker__base(b);
    const { x, y } = getHexCenter(b.c, b.r), k = v117Hs() * .8 / V134.S;
    ctx.save(); v134Draw(e, x, y, k);
    if (e.flag) v99Flag(x + e.flag.dx * k, y + e.flag.dy * k, e.flag.h * k, b.team, .8);
    ctx.save(); ctx.translate(x, y + 9); ctx.scale(1 / Math.max(1, zoom), 1 / Math.max(1, zoom)); plate(0, 0, 18, 7, 1.5); ctx.fillStyle = 'rgba(10,15,20,.82)'; ctx.fill(); ctx.strokeStyle = b.team === 'blue' ? '#38bdf8' : '#f87171'; ctx.lineWidth = .8; ctx.stroke();
    ctx.fillStyle = '#e5e7eb'; ctx.font = 'bold 5.5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.type === 'mg' ? 'MG' : 'MED', 0, .3); ctx.restore();
    ctx.restore();
  }


