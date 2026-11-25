  // [chain:v174Boom] 1 layer; the original in [v174] and older layers were dead code and are removed.
  //   Call order, outermost first: v174Boom
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v174Boom: from [v176], does NOT call the layer below
  function v174Boom(t, pt, size, c, r) { v176Fireball(t, pt, size); if (c !== undefined) v176Debris(t, pt, v176Surface(c, r), size * .8); }


