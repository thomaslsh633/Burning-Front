  // [chain:startTargetedDismount] 1 layer over startTargetedDismount__base ([14]).
  //   Call order, outermost first: startTargetedDismount → startTargetedDismount__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // startTargetedDismount: from [17b], calls startTargetedDismount__base
  function startTargetedDismount() { startTargetedDismount__base.apply(this, arguments); noTgt(); }


