  // [chain:useSkill] 1 layer over useSkill__base ([13]).
  //   Call order, outermost first: useSkill → useSkill__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // useSkill: from [17*], calls useSkill__base
  function useSkill(uid) { const u = uById(uid), s0 = u ? JSON.stringify(u.skillCd || {}) : ''; const r = useSkill__base.apply(this, arguments); if (u && JSON.stringify(u.skillCd || {}) !== s0) u.skT = turnNo; return r; }


