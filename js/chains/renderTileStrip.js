  // [chain:renderTileStrip] 2 layers over renderTileStrip__base ([16]).
  //   Call order, outermost first: renderTileStrip → renderTileStrip__v147 → renderTileStrip__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // renderTileStrip: from [17(], calls renderTileStrip__v147
  function renderTileStrip(ter, c, r) {
      const res = renderTileStrip__v147.apply(this, arguments);
      try { const st = v147StructAt(c, r); if (st && st.rebuild) { const row = unitStrip.querySelector('.us-row'); if (row) row.insertAdjacentHTML('beforeend', `<span>🏗 재건 ${st.rebuild.left}턴 남음</span>`); } } catch (err) { }
      return res;
    }

  // renderTileStrip__v147: from [17&], calls renderTileStrip__base
  function renderTileStrip__v147(ter, c, r) {
      renderTileStrip__base.apply(this, arguments);
      const st = v147StructAt(c, r); if (!st) return;
      const row = unitStrip.querySelector('.us-row'); if (row) row.insertAdjacentHTML('beforeend', `<span>🏚 ${st.name} HP ${hpD(st.hp)}/${hpD(st.maxHp)} · ${STAGE_KO[st.stage]}${st.stage < 2 ? ` · 주둔 ${v147Garrison(st).length}/${st.cap}` : ''}</span>`);
    }


