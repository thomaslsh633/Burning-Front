  // [chain:v99Conifer] 1 layer over v99Conifer__base ([17g]).
  //   Call order, outermost first: v99Conifer → v99Conifer__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v99Conifer: from [17n], calls v99Conifer__base
  function v99Conifer(g, x, y, h, w, P) { return v99Conifer__base(g, x, y, h * HZ, w, P); }


