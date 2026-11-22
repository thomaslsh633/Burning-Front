  // [chain:v99Territory] 1 layer over v99Territory__base ([17g]).
  //   Call order, outermost first: v99Territory → v99Territory__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v99Territory: from [17u], calls v99Territory__base
  function v99Territory() { if (sectors.length) return; return v99Territory__base.apply(this, arguments); }


