  // [chain:runStrikes] 1 layer over runStrikes__base ([13]).
  //   Call order, outermost first: runStrikes → runStrikes__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // runStrikes: from [13], calls runStrikes__base
  function runStrikes(tm) {
    const dueOk = x => x.team === tm && x.custom && (x.due === undefined || x.due <= turnNo);   // v49: due = 예약 착탄 턴
    const mine = pendingStrikes.filter(dueOk);
    pendingStrikes = pendingStrikes.filter(x => !dueOk(x));
    mine.forEach(x => { addLog(`🛩 [${x.n}] 착탄! (${x.c},${x.r})`, 'crit'); strike(x.team, x.c, x.r, x.shells, x.rad, x.P, x.A, 1);
      if (x.supp) units.filter(e => e.team !== x.team && e.hp > 0 && !e.isLoaded && e.armorType === 'soft' && getDistance(e.c, e.r, x.c, x.r) <= x.rad).forEach(e => addSuppression(e, x.supp)); });   // v50: 공중 폭발탄 제압
    const held = pendingStrikes.filter(x => x.team === tm && x.custom);   // 아직 착탄 시점이 아닌 예약 포격은 원본 처리에서 제외
    pendingStrikes = pendingStrikes.filter(x => !held.includes(x));
    const rv = runStrikes__base(tm); pendingStrikes = pendingStrikes.concat(held); return rv;
  }


