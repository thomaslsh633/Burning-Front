  // [chain:createUnitFromKey] 4 layers over createUnitFromKey__base ([v162]).
  //   Call order, outermost first: createUnitFromKey → createUnitFromKey__v140 → createUnitFromKey__v55 → createUnitFromKey__v162 → createUnitFromKey__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // createUnitFromKey: from [17+6], calls createUnitFromKey__v140
  function createUnitFromKey() {
      const u = createUnitFromKey__v140.apply(this, arguments);
      if (v159Crew(u)) { u.tgl = u.tgl || {}; u.tgl.emplace = false; if (TGL.watch.keys[u.team].includes(u.key)) u.tgl.watch = true; }
      return u;
    }

  // createUnitFromKey__v140: from [17*], calls createUnitFromKey__v55
  function createUnitFromKey__v140() { const u = createUnitFromKey__v55.apply(this, arguments); v140IntHp(u); return u; }

  // createUnitFromKey__v55: from [v128], calls createUnitFromKey__v162
  function createUnitFromKey__v55(id, team, key, c, r, a) {
    const u = createUnitFromKey__v162(id, team, key, c, r, a), t = UNIT_ROSTER[team][key];
    if (t && t.cat === 'tank' && balLog.armed) {
      if (!balLog.tank[team]) balLog.tank[team] = roundCount + '라운드 ' + t.uniqueName;
      if ((key === 'pershing' || key === 'tiger') && !balLog.heavy[team]) balLog.heavy[team] = roundCount + '라운드 ' + t.uniqueName;
    }
    return u;
  }

  // createUnitFromKey__v162: from [v162], calls createUnitFromKey__base
  function createUnitFromKey__v162(...a) {
    const u = createUnitFromKey__base(...a), cat = UNIT_ROSTER[u.team][u.key].cat;
    initModels(u); applyDoctrine(u); u.counterAttacksLeft = counterMax(u.team);
    u.vetClass = VET_CLASS_OF[u.key] || 'A'; u.vet = null; u.vetD = {};
    { const R = UNIT_ROSTER[u.team][u.key];   // v129: boarding size, towing, capture, small arms / immunity, structure damage
      u.raw = !!R.raw; u.rofB = R.rofB ? R.rofB.slice() : null; u.aoe = R.aoe || 0; u.tsize = R.tsize || 0; u.rearMul = R.rearMul || 0;   // v162
      u.overkill = !!R.overkill; u.crewed = !!R.crewed; u.rawD = R.rawD || null; u.rawW = R.rawW || null; u.closeEnd = R.closeEnd || u.closeEnd; u.midEnd = R.midEnd || u.midEnd; u.maxM = R.maxM || 0; u.reload = R.reload || 0;   // v214
      u.hw = R.hw || ''; u.tow = !!R.tow; u.capt = !!R.capt; u.sa = !!R.sa; u.saImm = !!R.saImm; u.cone = !!R.cone; }
    return u;
  }


