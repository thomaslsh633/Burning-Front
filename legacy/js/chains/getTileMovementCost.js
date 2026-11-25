  // [chain:getTileMovementCost] 4 layers over getTileMovementCost__base ([09]).
  //   Call order, outermost first: getTileMovementCost → getTileMovementCost__v147 → getTileMovementCost__v145 → getTileMovementCost__v132 → getTileMovementCost__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // getTileMovementCost: from [17+2], calls getTileMovementCost__v147
  function getTileMovementCost(unit, fc, fr, tc, tr) { if (v150Fay() && V155.on && getCapturePointAt(tc, tr)) return Infinity; return getTileMovementCost__v147.apply(this, arguments); }

  // getTileMovementCost__v147: from [17&], calls getTileMovementCost__v145
  function getTileMovementCost__v147(unit, fc, fr, tc, tr) {
      const base = getTileMovementCost__v145.apply(this, arguments);
      if (base === Infinity || !unit || !unit.team || (fc === tc && fr === tr)) return base;
      const st = v147StructAt(tc, tr); if (!st || st.stage >= 2 || st.cells.some(([c, r]) => c === fc && r === fr)) return base;
      const g = v147Garrison(st).filter(x => x !== unit);
      return g.some(x => x.team !== unit.team) || g.length >= st.cap ? Infinity : base;
    }

  // getTileMovementCost__v145: from [17#], calls getTileMovementCost__v132
  function getTileMovementCost__v145(unit, fc, fr, tc, tr) {
      const base = getTileMovementCost__v132.apply(this, arguments);
      if (base === Infinity || (fc === tc && fr === tr)) return base;
      const e = getEdge(fc, fr, tc, tr), d = edgeDef(e); if (!d) return base;
      const x = unit && unit.armorType === 'hard' ? d.cross.veh : d.cross.inf;
      return x === Infinity ? Infinity : base + x;
    }

  // getTileMovementCost__v132: from [17u], calls getTileMovementCost__base
  function getTileMovementCost__v132(unit, fc, fr, tc, tr) { const t = terrainMap[tc + ',' + tr]; if (t && t.oob) return Infinity; return getTileMovementCost__base.apply(this, arguments); }


