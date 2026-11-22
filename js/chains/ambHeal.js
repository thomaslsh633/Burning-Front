  // [chain:ambHeal] 2 layers; the original in [v162] and older layers were dead code and are removed.
  //   Call order, outermost first: ambHeal → ambHeal__v140
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // ambHeal: from [17(], calls ambHeal__v140
  function ambHeal(tm) {
      const res = ambHeal__v140.apply(this, arguments);
      try { (V147.structs || []).forEach(st => {
        if (!st.rebuild || st.rebuild.team !== tm) return;
        if (!units.some(u => u.team === tm && u.hp > 0 && !u.isLoaded && v140IsEng(u) && v150Near(u, st))) { addLog(`🏗 [재건 정지] ${st.name} — 인접 공병 없음`, 'info'); return; }
        if (--st.rebuild.left <= 0) v150Rebuild(st); else addLog(`🏗 [재건] ${st.name} · ${st.rebuild.left}턴 남음`, 'eng');
      }); } catch (err) { console.warn('v150 rebuild', err); }
      return res;
    }

  // ambHeal__v140: from [17*], does NOT call the layer below
  function ambHeal__v140(tm) {
    const src = [];
    buildings.forEach(b => { if (b.team === tm && b.hp > 0 && b.type === 'hq' && !b.uc) src.push([b, V140.healHq, '본부']); });
    units.forEach(a => { if (a.team === tm && a.hp > 0 && !a.isLoaded && a.class === 'medic_vehicle') src.push([a, Math.round(V140.healMed * vetV(a).effic), a.className]); });
    bunkers.forEach(b => { if (b.team === tm && b.hp > 0 && b.type === 'medic') src.push([b, V140.healMed, '메딕 벙커']); });
    units.filter(p => p.team === tm && p.hp > 0 && !p.isLoaded && p.armorType === 'soft' && p.hp < hpCap(p) && !v140InCombat(p)).forEach(p => {
      const b0 = p.hp, who = [];
      src.forEach(([s, amt, n]) => { if (getDistance(s.c, s.r, p.c, p.r) <= V140.healR) { const h = p.hp; healUnit(p, amt); if (p.hp > h) who.push(n); } });
      if (p.hp > b0) addLog(`✚ [자동 회복] ${p.className} +${p.hp - b0} HP (${who.join(' · ')})`, 'supply');
    });
  }


