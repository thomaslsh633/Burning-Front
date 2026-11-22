  // [chain:updateGoldUI] 2 layers over updateGoldUI__base ([12]).
  //   Call order, outermost first: updateGoldUI → updateGoldUI__s12 → updateGoldUI__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // updateGoldUI: from [17c], calls updateGoldUI__s12
  function updateGoldUI() { updateGoldUI__s12(); vmRefreshHud(); }

  // updateGoldUI__s12: from [12], calls updateGoldUI__base
  function updateGoldUI__s12() { updateGoldUI__base(); renderCP(); supLabel(); }


