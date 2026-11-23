  // [chain:fillRangeTiles] 1 layer over fillRangeTiles__base ([15]).
  //   Call order, outermost first: fillRangeTiles → fillRangeTiles__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // fillRangeTiles: from [19], calls fillRangeTiles__base
  function fillRangeTiles(u) {
      const r = fillRangeTiles__base.apply(this, arguments);
      if (rangeTiles && !(u.isMortar || u.isArtillery || u.isNebel)) rangeTiles = rangeTiles.filter(t => losClear(u, t.c, t.r));
      return r;
    }


