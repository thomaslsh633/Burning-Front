  // [chain:v180TurnMs] 1 layer over v180TurnMs__base ([v180]).
  //   Call order, outermost first: v180TurnMs → v180TurnMs__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v180TurnMs: from [19], calls v180TurnMs__base
  function v180TurnMs(u, d, tur) { return shWithClass(u, () => v180TurnMs__base.call(this, u, d, tur)); }


