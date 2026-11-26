  // [chain:drawZones] 1 layer; the original in [17c] and older layers were dead code and are removed.
  //   Call order, outermost first: drawZones
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // drawZones: from [17u], does NOT call the layer below
  function drawZones() { v132DrawOob(); v132DrawSectors(); v132DrawZoneCircles(); }


