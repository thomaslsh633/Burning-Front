  // [chain:bergepanzerRepair] 1 layer over bergepanzerRepair__base ([14]).
  //   Call order, outermost first: bergepanzerRepair → bergepanzerRepair__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // bergepanzerRepair: from [17+5], calls bergepanzerRepair__base
  function bergepanzerRepair(b) { const e = v158RepBlock(b); if (e) { toast(e); return; } return bergepanzerRepair__base.apply(this, arguments); }


