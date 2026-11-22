  // [chain:canProd] 1 layer over canProd__base ([v162]).
  //   Call order, outermost first: canProd → canProd__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // canProd: from [17*], calls canProd__base
  function canProd(b) { return !(b && b.uc) && canProd__base.apply(this, arguments); }


