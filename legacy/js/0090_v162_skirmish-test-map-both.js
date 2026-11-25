  // [v162] Skirmish test map (22×14): both HQs with every tier building and all three doctrine buildings already built,
  //   mixed cover in the middle (forest, bushes, rubble, stone houses, trenches), one VP and four resource points.
  //   Replaces the old duel / sandbox / visual-lab / Langres / Sector Front test maps.
  function loadHistoricalMap__base() {
    terrainMap = {}; mines = []; bunkers = []; capturePoints = []; buildings = [];
    COLS = 22; ROWS = 14;
    initProjection();
    const S = (c, r, t, elev = 0) => {
      if (c >= 0 && c < COLS && r >= 0 && r < ROWS) { const d = TERRAIN_DEFS[t] || TERRAIN_DEFS.plains; setTerrain(c, r, t, elev, d.cover, d.name, d.code, 0); }
    };
    const M = (c, r) => [COLS - 1 - c, ROWS - 1 - r];   // point mirror: the Axis half copies the Allied half
    const both = (list, t) => list.forEach(([c, r]) => { S(c, r, t); const [mc, mr] = M(c, r); S(mc, mr, t); });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) S(c, r, 'plains');
    for (let c = 0; c < COLS; c++) S(c, 7, 'road');
    for (let r = 0; r < ROWS; r++) S(10, r, r === 7 ? 'road' : 'field');
    both([[7, 2], [8, 2], [8, 3], [7, 12]], 'forest');
    both([[7, 5], [9, 10], [11, 3], [6, 9]], 'bush');
    both([[10, 5], [9, 8]], 'rubble');
    both([[8, 10], [11, 9]], 'building');
    both([[9, 4], [12, 6]], 'crater');
    const mk = (tm, type, c, r) => {
      if (type === 'hq') return { id: 'base_' + tm, type: 'hq', team: tm, className: tm === 'blue' ? '연합군 사령부' : '추축군 사령부', name: tm === 'blue' ? '교전 테스트 연합 기지' : '교전 테스트 추축 기지', c, r, hp: 690, maxHp: 690, armor: 0, sight: 5 };
      const B = bd(type, tm);
      return { id: 'b' + nextUnitId, type, team: tm, className: B.n, name: B.n + ' #' + nextUnitId++, c, r, hp: B.hp, maxHp: B.hp, armor: B.armor, sight: 4, cost: { g: B.g, f: B.f } };
    };
    const bq = { c: 2, r: 6 }, [rc, rr] = M(bq.c, bq.r), rq = { c: rc, r: rr };
    buildings.push(mk('blue', 'hq', bq.c, bq.r), mk('red', 'hq', rq.c, rq.r));
    const used = new Set([bq.c + ',' + bq.r, rq.c + ',' + rq.r]);
    [['blue', bq, rq], ['red', rq, bq]].forEach(([tm, home, foe]) => {
      const ring = d => { const o = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (getDistance(home.c, home.r, c, r) === d && !used.has(c + ',' + r) && r !== 7) o.push({ c, r }); return o.sort((a, b) => getDistance(foe.c, foe.r, b.c, b.r) - getDistance(foe.c, foe.r, a.c, a.r)); };
      const r1 = ring(1); BLD_LIST[tm].forEach((t, i) => { const n = r1[i]; if (n) { used.add(n.c + ',' + n.r); buildings.push(mk(tm, t, n.c, n.r)); } });
      const r2 = ring(2); ['doc_inf', 'doc_mech', 'doc_air'].forEach((t, i) => { const n = r2[i]; if (n) { used.add(n.c + ',' + n.r); buildings.push(mk(tm, t, n.c, n.r)); } });
    });
    buildings.forEach(b => { S(b.c, b.r, 'plains'); getHexNeighbors(b.c, b.r).forEach(n => { const t = getTerrain(n.c, n.r).terrainType; if (t !== 'road' && t !== 'plains') S(n.c, n.r, 'plains'); }); });
    // fortifications: a trench and sandbags in front of each base, an MG bunker and a medical bunker beside it, one mine
    let bunkerId = 9000;
    [['blue', [[6, 6, 'trench'], [6, 8, 'sandbag'], [5, 4, 'mg_bunker'], [4, 9, 'medic_bunker'], [8, 7, 'mine']]]].forEach(([tm, list]) => list.forEach(([c0, r0, k]) => {
      [[tm, c0, r0], [tm === 'blue' ? 'red' : 'blue', ...M(c0, r0)]].forEach(([t2, c, r]) => {
        const cost = { g: FORT[k].g, f: 0 }, ter = getTerrain(c, r), o = { ...ter };
        if (k === 'trench') { setTerrain(c, r, 'trench', ter.elevation, 'hard', '방호 참호', '☲', 24); terrainMap[`${c},${r}`].fort = { team: t2, cost, orig: o }; }
        else if (k === 'sandbag') { setTerrain(c, r, ter.terrainType, ter.elevation, 'hard', '샌드백 진지', '☲', 24); terrainMap[`${c},${r}`].fort = { team: t2, cost, orig: o }; }
        else if (k === 'mine') mines.push({ c, r, team: t2, cost, dmgMul: 1 });
        else bunkers.push({ id: bunkerId++, c, r, team: t2, type: k === 'mg_bunker' ? 'mg' : 'medic', hp: 145, maxHp: 145, cost });
      });
    }));
  }
  // points for the skirmish test map (called after the terrain pass)
  function skirmishPoints__base() {
    const M = (c, r) => [COLS - 1 - c, ROWS - 1 - r];
    addPoint({ cls: 'vp', name: '중앙 교차로', c: 10, r: 7 });
    [['fuel', '제재소', 7, 3], ['mun', '탄약고', 6, 11], ['manpower', '농가', 4, 3]].forEach(([cls, name, c, r]) => {
      const [mc, mr] = M(c, r);
      addPoint({ cls, name: name + ' (연합)', c, r, home: cls === 'manpower' ? 'blue' : null });
      addPoint({ cls, name: name + ' (추축)', c: mc, r: mr, home: cls === 'manpower' ? 'red' : null });
    });
  }

  function setTerrain(c, r, terrainType, elevation, cover, name, code, defense) {
    terrainMap[`${c},${r}`] = { terrainType, elevation, cover, name, code, defense };
  }
  function getTerrain(c, r) {
    return terrainMap[`${c},${r}`] || { terrainType: 'plains', elevation: 0, cover: 'none', name: '평지', code: '', defense: 0 };
  }
  function getBuildingAt(c, r) {
    return buildings.find(b => b.hp > 0 && (b.c === c && b.r === r || (b.cells && b.cells.some(q => q[0] === c && q[1] === r))));   // v151: footprint
  }
  function getTerrainFillColor__base(ter) {
    const def = TERRAIN_DEFS[ter.terrainType];
    return MAP_PALETTE[ter.terrainType] || (def ? def.fill : '#4d6342');   // v59: per-map palette override (Langres snow)
  }

