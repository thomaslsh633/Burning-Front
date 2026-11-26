  // [chain:stripStatus] 1 layer over stripStatus__base ([11]).
  //   Call order, outermost first: stripStatus → stripStatus__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // stripStatus: from [11], calls stripStatus__base
  function stripStatus(u) { const b = buffTxt(u); return stripStatus__base(u) + (b ? `<span style="color:#a5b4fc">✨${b}</span>` : ''); }


