  // [chain:rebuildHud] 3 layers over rebuildHud__base ([16]).
  //   Call order, outermost first: rebuildHud → rebuildHud__v189 → rebuildHud__v48 → rebuildHud__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // rebuildHud: from [19], calls rebuildHud__v189
  function rebuildHud(u) {   // the buttons go in before the tray turns every button into a tile
      const rows = u && u.team === currentTurn && !u.isLoaded ? shConvRows(u) : []; if (rows.length) shConvInject(u, rows);
      return rebuildHud__v189.apply(this, arguments);
    }

  // rebuildHud__v189: from [v189], calls rebuildHud__v48
  function rebuildHud__v189(u) {
      if (v189Stage(u) && u.team === currentTurn) {
        const dim0 = Math.abs(v173Ang(V185.pend.a - u.facingAngle)) < 1e-3, cost = v197Cost(u, v173Ang(V185.pend.a - u.facingAngle)), poor = !u.isHeavy && u.remainingMove < cost, dim = dim0 || poor;
        specialActionsEl.innerHTML = `<button class="btn-action" ${dim ? 'style="opacity:.55"' : ''} onclick="v189Confirm('${u.id}')"><span>🔄 <strong>선회 확정</strong><br><small>선회 확정 · ${u.isHeavy ? '이동력 0' : '이동력 ' + cost}${poor ? ' · 이동력 부족' : ''}</small></span></button>`;
      }
      return rebuildHud__v48.apply(this, arguments);
    }

  // rebuildHud__v48: from [17b], calls rebuildHud__base
  function rebuildHud__v48(u) {
    if (u && u.key && u.team === currentTurn && !u.isLoaded && u.armorType === 'hard') {
      const ids = vpList(u);
      if (ids.length) {
        if (u.pkg2) specialActionsEl.insertAdjacentHTML('beforeend', `<div style="font-size:.8em;color:#fbbf24">장착: ${VPKG[u.pkg2].ico} ${vpN(u.pkg2, u.team)} — ${VPKG[u.pkg2].d}</div>`);
        else specialActionsEl.insertAdjacentHTML('beforeend', ids.map(id => { const lack = mun[u.team] < vpM(id, u.team); return `<button class="btn-action" ${lack ? 'style="opacity:.55"' : ''} title="${VPKG[id].d}" onclick="buyVpkg('${u.id}','${id}')">${VPKG[id].ico} ${vpN(id, u.team)} (💣${vpM(id, u.team)})</button>`; }).join(''));
      }
    }
    return rebuildHud__base(u);
  }


