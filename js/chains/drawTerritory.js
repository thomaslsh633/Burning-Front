  // [chain:drawTerritory] 2 layers over drawTerritory__base ([10]).
  //   Call order, outermost first: drawTerritory → drawTerritory__v99 → drawTerritory__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // drawTerritory: from [17u], calls drawTerritory__v99
  function drawTerritory() { if (sectors.length) return; return drawTerritory__v99.apply(this, arguments); }

  // drawTerritory__v99: from [17g], calls drawTerritory__base
  function drawTerritory__v99() { if (!V99.on) return drawTerritory__base(); }


