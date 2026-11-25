  // [chain:checkElevationCombatRule] 1 layer over checkElevationCombatRule__base ([11]).
  //   Call order, outermost first: checkElevationCombatRule → checkElevationCombatRule__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // checkElevationCombatRule: from [11], calls checkElevationCombatRule__base
  function checkElevationCombatRule(att, def) {
    const res = checkElevationCombatRule__base(att, def);
    if (!res.allowed || att.isMortar || att.isArtillery || att.isNebel || losClear(att, def.c, def.r)) return res;
    return { allowed: false, reason: "시선 차단: 숲·건물·바위·능선에 가려 직사 불가!" };
  }


