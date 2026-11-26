  // [chain:v173End] 2 layers over v173End__base ([v173]).
  //   Call order, outermost first: v173End → v173End__v174 → v173End__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v173End: from [v181], calls v173End__v174
  function v173End() { const A = V173.anim, r = v173End__v174.apply(this, arguments); if (A) V181.board.delete(A.u); return r; }

  // v173End__v174: from [v174], calls v173End__base
  function v173End__v174() {
      const A = V173.anim; v173End__base.apply(this, arguments);
      if (!A || A.u.hp <= 0) return;
      const now = v174Now(); let n = 0;
      units.forEach(e => { if (e.team !== A.u.team && e.hp > 0 && !e.isLoaded && !A.seen0.has(e.id) && visibleHexes.has(e.c + ',' + e.r)) { v174Spot(e.c, e.r, now); n++; } });
      if (n) v174Kick();
    }


