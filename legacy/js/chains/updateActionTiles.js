  // [chain:updateActionTiles] 4 layers over updateActionTiles__base ([15]).
  //   Call order, outermost first: updateActionTiles → updateActionTiles__v159 → updateActionTiles__v147 → updateActionTiles__v47 → updateActionTiles__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // updateActionTiles: from [v194], calls updateActionTiles__v159
  function updateActionTiles(unit) {
      if (V196.uid && (!unit || unit.id !== V196.uid)) V196.uid = null;
      const r = updateActionTiles__v159.apply(this, arguments);
      if (unit && V196.uid === unit.id) { if (v196On(unit)) validMoves = v196Reach(unit); else V196.uid = null; }
      return r;
    }

  // updateActionTiles__v159: from [17+6], calls updateActionTiles__v147
  function updateActionTiles__v159(u) {
      const r = updateActionTiles__v147.apply(this, arguments);
      if (v159Crew(u)) { if (v159Emplaced(u)) validMoves = []; if (!v159Ready(u)) validAttacks = []; }
      if (v214Reloading(u)) validAttacks = [];   // v214: reloading
      return r;
    }

  // updateActionTiles__v147: from [17&], calls updateActionTiles__v47
  function updateActionTiles__v147(unit) {
      const res = updateActionTiles__v47.apply(this, arguments); V147.att = new Set();
      try {
        if (!unit || unit.hasAttacked || !(unit.ammo > 0) || suppState(unit) >= 2 || !structDmg(unit) || unit.isFlamer) return res;
        const ind = !!(unit.isMortar || unit.isArtillery || unit.isNebel);
        V147.structs.forEach(st => { if (st.stage >= 2) return; st.cells.forEach(([c, r]) => {
          const k = c + ',' + r; if (getUnitAt(c, r) || !visibleHexes.has(k)) return;
          const d = getDistance(unit.c, unit.r, c, r); if (!mainReach(unit, c, r, d) || (!ind && !losClear(unit, c, r))) return;
          V147.att.add(k); if (!validAttacks.some(a => a.c === c && a.r === r)) validAttacks.push({ c, r });
        }); });
      } catch (err) { console.warn('v147 targets', err); }
      return res;
    }

  // updateActionTiles__v47: from [17b], calls updateActionTiles__base
  function updateActionTiles__v47() { pasSyncAll(); return updateActionTiles__base.apply(this, arguments); }


