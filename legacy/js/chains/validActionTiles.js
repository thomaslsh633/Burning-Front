  // [chain:validActionTiles] 2 layers over validActionTiles__base ([17b]).
  //   Call order, outermost first: validActionTiles → validActionTiles__v150 → validActionTiles__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // validActionTiles: from [v168], calls validActionTiles__v150
  function validActionTiles() {
      const m = actionMode, a = activeActor;
      if (!m || !a || !m.startsWith('build_')) return validActionTiles__v150.apply(this, arguments);
      const bt = m.slice(6), B = BLD[bt], one = !(FORT[bt] && FORT[bt].big) && !(B && (V151.FP[bt] || 1) > 1);   // v212: every build within 2 hexes
      const out = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const d = getDistance(a.c, a.r, c, r); if (d < 1 || d > 2 || getUnitAt(c, r) || getBuildingAt(c, r)) continue;
        if (one && (TERRAIN_DEFS[getTerrain(c, r).terrainType].inf === Infinity || bunkers.some(k => k.hp > 0 && k.c === c && k.r === r) || !canPlaceBuilding(c, r, !!B))) continue;
        if (!v151PlaceCheck(bt, { c, r }, a)) out.push({ c, r });
      }
      V151.pend = null; return out;
    }

  // validActionTiles__v150: from [17(], calls validActionTiles__base
  function validActionTiles__v150() {
      const res = validActionTiles__base.apply(this, arguments), a = activeActor;
      if (actionMode !== 'repair' || !a || !res) return res;
      try {
        getHexNeighbors(a.c, a.r).forEach(n => {
          if (res.some(q => q.c === n.c && q.r === n.r)) return;
          const st = v147StructAt(n.c, n.r), e = getEdge(a.c, a.r, n.c, n.r);
          if ((st && (st.hp < st.maxHp || (st.stage >= 2 && !st.rebuild))) || (e && (e.st > 0 || (e.hp !== undefined && e.hp < (EDGE_HP[e.kind] || 50))))) res.push(n);
        });
      } catch (err) { }
      return res;
    }


