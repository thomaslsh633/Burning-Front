  // [chain:v140RetStep] 1 layer over v140RetStep__base ([17*]).
  //   Call order, outermost first: v140RetStep → v140RetStep__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v140RetStep: from [v181], calls v140RetStep__base
  function v140RetStep(u, budget) {
      const a = { c: u.c, r: u.r }, fa0 = u.facingAngle, r = v140RetStep__base.apply(this, arguments);
      if (r && u.hp > 0 && (u.c !== a.c || u.r !== a.r)) v181Walk(u, a, { fa0 });
      return r;
    }


