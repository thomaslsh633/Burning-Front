  // [chain:v159SetEmpl] 1 layer over v159SetEmpl__base ([17+6]).
  //   Call order, outermost first: v159SetEmpl → v159SetEmpl__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v159SetEmpl: from [v181], calls v159SetEmpl__base
  function v159SetEmpl(u, on) {
      const was = !!(u && u.tgl && u.tgl.emplace), r = v159SetEmpl__base.apply(this, arguments);
      if (!reduceMotion() && u && u.hp > 0 && !u.isLoaded && !!on && !was && (u.team === currentTurn || visibleHexes.has(u.c + ',' + u.r))) v181Plant(u, !!on);
      return r;
    }


