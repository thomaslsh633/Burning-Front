  // [chain:startTargetedBuild] 2 layers over startTargetedBuild__base ([14]).
  //   Call order, outermost first: startTargetedBuild → startTargetedBuild__v30 → startTargetedBuild__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // startTargetedBuild: from [17+5], calls startTargetedBuild__v30
  function startTargetedBuild(eng) { if (v158Locked(eng)) { toast('수리한 턴에는 건설할 수 없습니다.'); return; } return startTargetedBuild__v30.apply(this, arguments); }

  // startTargetedBuild__v30: from [17b], calls startTargetedBuild__base
  function startTargetedBuild__v30() { startTargetedBuild__base.apply(this, arguments); noTgt(); }


