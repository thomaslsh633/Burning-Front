  // [chain:addSuppression] 3 layers over addSuppression__base ([11]).
  //   Call order, outermost first: addSuppression → addSuppression__s11_2 → addSuppression__s11 → addSuppression__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // addSuppression: from [17+6], calls addSuppression__s11_2
  function addSuppression(u, amt) { if (v159Crew(u) && v159Emplaced(u) && amt > 0) amt = amt * V159.supp; return addSuppression__s11_2.call(this, u, amt); }

  // addSuppression__s11_2: from [11], calls addSuppression__s11
  function addSuppression__s11_2(u, amt) { const m = vetV(u).supRes; if (m !== 1) amt = amt * m; return addSuppression__s11(u, amt); }

  // addSuppression__s11: from [11], calls addSuppression__base
  function addSuppression__s11(u, amt) { if (u && u.buff && u.buff.grit > 0) amt = amt * .3; return addSuppression__base(u, amt); }


