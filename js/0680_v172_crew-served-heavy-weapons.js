  // [v172] crew-served heavy weapons move like infantry (4 hexes per turn), whatever their old per-weapon value was
  ['blue', 'red'].forEach(tm => Object.keys(UNIT_ROSTER[tm] || {}).forEach(k => { const t = UNIT_ROSTER[tm][k]; if (t.macro === 'TW' && t.move > 0) t.move = RAW.INF_MOVE; }));
  // Faymonville at 0.75 scale
  FAY2.bridge = [594, 0, 626, 110];
  FAY2.points.forEach(p => { p.radius = p.cls === 'vp' ? 2 : 1;   // v168: 70 % map if (p.name === 'Dairy') { p.x = 585; p.y = 280; }
    if (p.cls === 'manpower') p.yield = { g: 70 }; else if (p.cls === 'mun') p.yield = { m: 14 }; else if (p.cls === 'fuel') p.yield = { f: 12 }; });

  // capture: a point changes hands after V139.capT consecutive ticks of the same side (neutralising likewise)
  function v139CapLeft(cp, f) {
    const pr = cp.cprog && cp.cprog.k === f.tm + f.st ? cp.cprog.n : 0, left = V139.capT - pr;
    return f.st === 'neutralize' ? left + V139.capT : left;
  }
  /* captureTick: layer moved to js/chains/captureTick.js */

  // veterancy from damage
  { 
    /* executeCombat: layer moved to js/chains/executeCombat.js */ }

  // retreat to the nearest rally point
  
  /* retreatBlock: layer moved to js/chains/retreatBlock.js */
  /* retreatMove: layer moved to js/chains/retreatMove.js */
  { 
    /* processTurnStartStatus: layer moved to js/chains/processTurnStartStatus.js */ }
