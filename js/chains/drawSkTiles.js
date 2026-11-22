  // [chain:drawSkTiles] 1 layer over drawSkTiles__base ([17b]).
  //   Call order, outermost first: drawSkTiles → drawSkTiles__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // drawSkTiles: from [17g], calls drawSkTiles__base
  function drawSkTiles() { const r = drawSkTiles__base.apply(this, arguments); v99Flush(); return r; }


