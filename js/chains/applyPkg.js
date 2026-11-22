  // [chain:applyPkg] 1 layer over applyPkg__base ([13]).
  //   Call order, outermost first: applyPkg → applyPkg__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // applyPkg: from [13], calls applyPkg__base
  function applyPkg(u, id) {
    if (u.raw && ['thompson', 'stg44', 'fg42'].includes(id)) { u.pkg = id; if (equipKit(u, id)) return; }   // v162: CoH3 kit weapons
    if (u.raw && id === 'bazooka') { u.pkg = id; if (equipKit(u, 'rocket_blue')) return; }
    if (id === 'thompson') { u.pkg = id; u.atk += 5; u.rof += 1; u.accDrop = Math.min(.4, u.accDrop + .03); shiftAcc(u, .03); return; }
    if (id === 'bazooka') { u.pkg = id; equipSub(u, AT_ROCKET.blue); return; }   // v127: launcher on the secondary slot
    if (id === 'stg44') { u.pkg = id; u.atk += 3; u.rof += 2; u.accDrop = Math.max(.02, u.accDrop - .02); shiftAcc(u, -.02); return; }
    if (id === 'fg42') { u.pkg = id; u.atk += 4; u.rof += 1; u.range += 1; u.accDrop = Math.max(.02, u.accDrop - .02); shiftAcc(u, -.02); return; }
    if (id === 'panzerfaust') { u.pkg = id; u.pfCharges = 2; return; }
    return applyPkg__base(u, id);
  }


