  // [chain:canReinforce] 1 layer over canReinforce__base ([v162]).
  //   Call order, outermost first: canReinforce → canReinforce__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // canReinforce: from [17*], calls canReinforce__base
  function canReinforce(u) { return !v140InCombat(u) && canReinforce__base.apply(this, arguments); }


