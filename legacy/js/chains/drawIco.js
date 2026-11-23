  // [chain:drawIco] 1 layer over drawIco__base ([17d]).
  //   Call order, outermost first: drawIco → drawIco__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // drawIco: from [17h], calls drawIco__base
  function drawIco(c, name, cx, cy, size) { const cv = V100.icoCv[name]; if (!cv) return drawIco__base(c, name, cx, cy, size); c.drawImage(cv, cx - size / 2, cy - size / 2, size, size); }


