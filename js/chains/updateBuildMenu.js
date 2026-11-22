  // [chain:updateBuildMenu] 2 layers over updateBuildMenu__base ([12]).
  //   Call order, outermost first: updateBuildMenu → updateBuildMenu__v101 → updateBuildMenu__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // updateBuildMenu: from [17m], calls updateBuildMenu__v101
  function updateBuildMenu() {
    const r = updateBuildMenu__v101.apply(this, arguments);
    buildButtonsContainer.querySelectorAll('.tile.rec').forEach(btn => { const k = btn.dataset.key, i = btn.querySelector('i'); if (!k || !i || i.querySelector('.ic-lock')) return;
      const url = v105IconUrl(currentTurn, k); if (!url) return; i.querySelectorAll('.v101-cls,.v105-cls').forEach(e => e.remove());
      const wide = (UNIT_ROSTER[currentTurn][k] || {}).armorType === 'hard'; if (getComputedStyle(i).position === 'static') i.style.position = 'relative';
      i.insertAdjacentHTML('beforeend', `<em class="v105-cls${wide ? ' w' : ''}"><img src="${url}" alt=""></em>`); });
    return r;
  }

  // updateBuildMenu__v101: from [17i], calls updateBuildMenu__base
  function updateBuildMenu__v101() {
    const r = updateBuildMenu__base.apply(this, arguments);
    buildButtonsContainer.querySelectorAll('.tile.rec').forEach(btn => { const k = btn.dataset.key, i = btn.querySelector('i'); if (!k || !i || i.querySelector('.ic-lock')) return; const im = v101Img(k, currentTurn); if (!im) return;
      const R = UNIT_ROSTER[currentTurn][k] || {}, cls = R.armorType !== 'hard' ? [...String(R.code || '')].map(ch => UNIT_GLYPH[ch]).find(n => n && n !== 'inf') : null;   // squads share figures: badge the speciality
      i.innerHTML = im + (cls ? `<em class="v101-cls">${ico(cls)}</em>` : ''); btn.classList.add('port'); });
    return r;
  }


