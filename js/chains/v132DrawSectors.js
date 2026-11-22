  // [chain:v132DrawSectors] 1 layer; the original in [17u] and older layers were dead code and are removed.
  //   Call order, outermost first: v132DrawSectors
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v132DrawSectors: from [17x], does NOT call the layer below
  function v132DrawSectors() {
    if (!sectors.length) return;
    const G = v135Geo(), px = 1 / zoom, linked = { blue: v131Linked('blue'), red: v131Linked('red') }, own = id => id >= 0 && sectors[id] ? v131Owner(sectors[id]) : null;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (v132P2D) sectors.forEach(sc => { const o = v131Owner(sc), f = G.fills.get(sc.id); if (!o || !f) return; ctx.fillStyle = linked[o].has(sc.id) ? `rgba(${zoneRgb(o)},.08)` : v131Hatch(o); ctx.fill(f, 'evenodd'); });
    v135Lines(G.runs.filter(rn => rn.id >= 0 && rn.nb >= 0 && rn.id < rn.nb)); ctx.strokeStyle = 'rgba(255,255,255,.34)'; ctx.lineWidth = px; ctx.stroke();
    ['blue', 'red'].forEach(t => { const rs = G.runs.filter(rn => rn.id >= 0 && own(rn.id) === t && own(rn.nb) !== t); if (!rs.length) return; v135Lines(rs);
      ctx.strokeStyle = `rgba(${zoneRgb(t)},.16)`; ctx.lineWidth = 5 * px; ctx.stroke(); ctx.strokeStyle = `rgba(${zoneRgb(t)},.9)`; ctx.lineWidth = 1.5 * px; ctx.stroke(); });
    ctx.restore();
  }


