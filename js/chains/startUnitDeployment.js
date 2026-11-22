  // [chain:startUnitDeployment] 1 layer over startUnitDeployment__base ([12]).
  //   Call order, outermost first: startUnitDeployment → startUnitDeployment__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // startUnitDeployment: from [16], calls startUnitDeployment__base
  function startUnitDeployment(key) {
    const ud = UNIT_ROSTER[currentTurn][key];
    if (ud.req && !research[currentTurn][ud.req]) { toast("연구 필요: " + TECH[ud.req][0]); return; }
    startUnitDeployment__base(key); }


