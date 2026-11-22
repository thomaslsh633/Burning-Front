  // [chain:updateVision] 5 layers over updateVision__base ([09]).
  //   Call order, outermost first: updateVision → updateVision__v48 → updateVision__v47 → updateVision__s09_2 → updateVision__s09 → updateVision__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // updateVision: from [19], calls updateVision__v48
  function updateVision() { const r = updateVision__v48.apply(this, arguments); if (!SHELL.cfg.fog) for (let rr = 0; rr < ROWS; rr++) for (let c = 0; c < COLS; c++) visibleHexes.add(c + ',' + rr); return r; }

  // updateVision__v48: from [17b], calls updateVision__v47
  function updateVision__v48() { units.forEach(u => { if (u.hasMoved && u.hp > 0) u.lastMoveTurn = turnNo; }); return updateVision__v47.apply(this, arguments); }

  // updateVision__v47: from [17b], calls updateVision__s09_2
  function updateVision__v47() { pasSyncAll(); return updateVision__s09_2.apply(this, arguments); }

  // updateVision__s09_2: from [09], calls updateVision__s09
  function updateVision__s09_2() {
    units.forEach(u => {
      if (u.buff && u.buff.camo && u.camoPos && (u.camoPos[0] !== u.c || u.camoPos[1] !== u.r)) {
        delete u.buff.camo; addLog(`🫥 [위장 해제] ${u.className} — 이동으로 노출`, 'move');
      }
    });
    updateVision__s09();
    units.forEach(u => {
      if (u.hp > 0 && !u.isLoaded && u.buff && u.buff.camo && u.team !== currentTurn) {
        const spotted = units.some(e => e.team === currentTurn && e.hp > 0 && !e.isLoaded && getDistance(e.c, e.r, u.c, u.r) <= 2);
        if (!spotted) visibleHexes.delete(`${u.c},${u.r}`);
      }
    });
  }

  // updateVision__s09: from [09], calls updateVision__base
  function updateVision__s09() {
    updateVision__base();
    reveals.filter(x => x.team === currentTurn && x.expire > turnNo).forEach(x => ring(x.c, x.r, 3).forEach(h => visibleHexes.add(`${h.c},${h.r}`)));
    smokes.forEach(sm => { if (sm.team === currentTurn) return; sm.hexes.forEach(h => { if (!units.some(u => u.team === currentTurn && u.hp > 0 && !u.isLoaded && getDistance(u.c, u.r, h.c, h.r) <= 1)) visibleHexes.delete(`${h.c},${h.r}`); }); });
  }


