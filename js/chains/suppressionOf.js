  // [chain:suppressionOf] 4 layers over suppressionOf__base ([11]).
  //   Call order, outermost first: suppressionOf → suppressionOf__s11_3 → suppressionOf__s11_2 → suppressionOf__s11 → suppressionOf__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // suppressionOf: from [17b], calls suppressionOf__s11_3
  function suppressionOf(att) { return suppressionOf__s11_3(att); }

  // suppressionOf__s11_3: from [11], calls suppressionOf__s11_2
  function suppressionOf__s11_3(att) { const sp = suppressionOf__s11_2(att), m = vetV(att).supGive; return m !== 1 ? Math.round(sp * m) : sp; }

  // suppressionOf__s11_2: from [11], calls suppressionOf__s11
  function suppressionOf__s11_2(att) {
    let s = suppressionOf__s11(att); const fx = fxOf(att);
    if (fx && fx.supp) s += fx.supp;
    return s;
  }

  // suppressionOf__s11: from [11], calls suppressionOf__base
  function suppressionOf__s11(att) { return suppressionOf__base(att) + (att.suppressBonus || 0) + (att.buff && att.buff.hold > 0 ? 40 : 0); }


