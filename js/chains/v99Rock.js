  // [chain:v99Rock] 1 layer over v99Rock__base ([17g]).
  //   Call order, outermost first: v99Rock → v99Rock__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v99Rock: from [17n], calls v99Rock__base
  function v99Rock(g, x, y, r, hh, P, rnd, fa) { return v99Rock__base(g, x, y, r, hh * HZ, P, rnd, fa); }


