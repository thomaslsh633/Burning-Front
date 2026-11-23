  // [chain:skEnd] 1 layer over skEnd__base ([13]).
  //   Call order, outermost first: skEnd → skEnd__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // skEnd: from [17b], calls skEnd__base
  function skEnd() { pvClear(0); setTimeout(() => { if (!skOn()) hideTip(); }, 0); skEnd__base(); }


