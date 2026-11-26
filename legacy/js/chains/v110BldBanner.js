  // [chain:v110BldBanner] 1 layer over v110BldBanner__base ([17o]).
  //   Call order, outermost first: v110BldBanner → v110BldBanner__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v110BldBanner: from [v168], calls v110BldBanner__base
  function v110BldBanner(b, x, y) { if (b && b.cells && b.cells.length > 1) { const G = v151Geo(b); return v110BldBanner__base.call(this, b, G.x, G.y); } return v110BldBanner__base.apply(this, arguments); }


