  // [chain:v174Flash] 1 layer; the original in [v174] and older layers were dead code and are removed.
  //   Call order, outermost first: v174Flash
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v174Flash: from [v176], does NOT call the layer below
  function v174Flash(t, pt, r) { v174Add(t, 100, (k) => { const a = 1 - k * k; v176Soft(pt.x, pt.y, r * (.7 + .5 * k), '255,246,205', a); v176Soft(pt.x, pt.y, r * .55, '255,255,255', a * .9); }); }


