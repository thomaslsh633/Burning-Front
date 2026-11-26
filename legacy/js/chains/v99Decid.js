  // [chain:v99Decid] 1 layer over v99Decid__base ([17g]).
  //   Call order, outermost first: v99Decid → v99Decid__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v99Decid: from [17n], calls v99Decid__base
  function v99Decid(g, x, y, h, w, P, rnd) { return v99Decid__base(g, x, y, h * HZ, w, P, rnd); }


