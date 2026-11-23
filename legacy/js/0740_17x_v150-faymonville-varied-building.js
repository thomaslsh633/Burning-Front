  // ══════════════════════════════════════════════════════════════
  // [17(] v150 — Faymonville: varied building yaw, north–south relief, no starting craters, craters from explosions,
  //        structure-damage tuning, engineer repair / rebuild of buildings and cover edges
  //   · yaw: every house except the villa turns its door toward the nearest road, plus a fixed ±12° jitter
  //   · relief (visual only — rules keep the integer elevation): the land rises in two terrace steps from the river valley in the
  //     north to the town plateau (+1.1) and the villa ridge in the south (+2.6), hills are drawn 1.6x taller, the lake bank stays steep, the jetty landing flat
  //   · craters: the map starts without any; artillery / rockets / mortars / HE shells and barrage impacts leave one by chance
  //   · structure damage: main-gun factor 0.9 → 1.18 (Sherman 38 → 50, villa in ~13 shots)
  //   · engineers (repair mode): building +10 % HP per repair (back to intact above 50 %), ruin rebuild 120G + 3 turns with
  //     an engineer next to it (comes back at 50 % HP), cover edge repair (destroyed edge 30G)
  // ══════════════════════════════════════════════════════════════
  const V150 = { craterP: { art: .5, mortar: .3, he: .15, impact: .25 }, rebuildG: 120, rebuildT: 3, edgeG: 30,
    hillK: 1.6, jitter: 12, shade: 4.1 };
  const v150Fay = () => typeof mapSelect !== 'undefined' && mapSelect.value === 'faymonville';
  const v150Smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  // ---------- building yaw toward the nearest road ----------
  function v150RoadYaw(sp) {
    let best = null, bd = 1e9; const [fx, fy] = [sp.fx, sp.fy];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const t = terrainMap[c + ',' + r]; if (!t || t.terrainType !== 'road') continue;
      const q = v146CellFlat(c, r), d = Math.hypot(q[0] - fx, q[1] - fy); if (d < bd) { bd = d; best = q; } }
    if (!best || bd < 1) return null;
    const dx = (best[0] - fx) / bd, dy = (best[1] - fy) / bd;   // door (local −Y) toward the road
    return Math.atan2(-dx, dy);   // door (mesh −Y, verified with a marker bake) faces the road
  }
  { 
    /* loadFaymonville: layer moved to js/chains/loadFaymonville.js */ }

  // ---------- map load: relief + crater clean-up ----------
  function v150Relief() {
    const w = Math.sqrt(3) * HEX_RADIUS, isW = t => t && (t.terrainType === 'deep_water' || t.terrainType === 'shallow_water');
    const J = V138 && V138.jetty && V138.jetty.map === 'faymonville' ? V138.jetty : null;
    let r0 = ROWS, r1 = 0; for (const k in terrainMap) { const t = terrainMap[k]; if (t.oob) continue; const r = +k.split(',')[1]; r0 = Math.min(r0, r); r1 = Math.max(r1, r); }
    let n = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = terrainMap[c + ',' + r]; if (!t || isW(t) || t.bridge || t.vh !== undefined) continue;
      const fx = ORIGIN_X + c * w + (r % 2) * w / 2, fy = ORIGIN_Y + r * 1.5 * HEX_RADIUS;
      // two terrace steps: river valley → town plateau (+1.1) → villa ridge (+1.5 more); each step a ~5-row slope the hillshade picks up
      const L = r1 - r0, wob = (v99N(c * .11 + 4, 3) - .5) * 3;
      let tilt = 1.1 * v150Smooth(r0 + L * .1 + wob, r0 + L * .24 + wob, r) + 1.5 * v150Smooth(r0 + L * .62 + wob, r0 + L * .78 + wob, r) + (v99N(c * .19 + 2, r * .19 + 9) - .5) * .45;
      if (J) { const d = Math.hypot(fx - J.fx, fy - J.fy) / w; tilt *= v150Smooth(1.2, 3.6, d); }   // flat landing at the jetty
      t.vh = Math.max(0, (t.elevation | 0) * V150.hillK + tilt); n++;
    }
    return n;
  }
  function v150ClearCraters() {
    let n = 0; const d = TERRAIN_DEFS.plains;
    for (const k in terrainMap) { const t = terrainMap[k]; if (t.terrainType !== 'crater') continue;
      const [c, r] = k.split(',').map(Number), vh = t.vh, oob = t.oob; setTerrain(c, r, 'plains', t.elevation | 0, d.cover, d.name, d.code, 0);
      if (vh !== undefined) terrainMap[k].vh = vh; if (oob) terrainMap[k].oob = oob; n++; }
    return n;
  }
  { 
    /* loadHistoricalMap: layer moved to js/chains/loadHistoricalMap.js */ }

  // ---------- craters from explosions ----------
  const V150_CRATER_OK = { plains: 1, field: 1, road: 1, bush: 1 };
  function v150Crater(c, r, p) {
    if (!(Math.random() < p)) return false;
    const t = terrainMap[c + ',' + r]; if (!t || t.oob || t.bridge || !V150_CRATER_OK[t.terrainType]) return false;
    if (getBuildingAt(c, r) || (typeof bunkers !== 'undefined' && bunkers.some(b => b.c === c && b.r === r && b.hp > 0))) return false;
    if (typeof v147StructAt === 'function' && v147StructAt(c, r)) return false;
    const d = TERRAIN_DEFS.crater, vh = t.vh; setTerrain(c, r, 'crater', t.elevation | 0, d.cover, d.name, d.code, 0); if (vh !== undefined) terrainMap[c + ',' + r].vh = vh;
    addLog(`🕳 [포탄 구덩이] (${c},${r}) — 경엄폐 생성`, 'info');
    return true;
  }
  { 
    /* executeCombat: layer moved to js/chains/executeCombat.js */ }
  { const o_imp150 = impact;
    impact = function (team, c, r) { const res = o_imp150.apply(this, arguments); try { v150Crater(c, r, V150.craterP.impact); } catch (err) { } return res; }; }

  // ---------- engineer repair / rebuild ----------
  const v150Near = (u, st) => st.cells.some(([c, r]) => getDistance(u.c, u.r, c, r) <= 1);
  function v150Restore(st) {   // stage 1 → 0
    st.stage = 0; st.cells.forEach(([c, r]) => { const t = terrainMap[c + ',' + r]; if (t && t.terrainType === 'building') { t.cover = 'hard'; t.name = st.name; } });
  }
  function v150Rebuild(st) {
    const d = TERRAIN_DEFS.building;
    st.cells.forEach(([c, r]) => { const t = terrainMap[c + ',' + r] || {}, vh = t.vh; setTerrain(c, r, 'building', t.elevation | 0, d.cover, st.name, d.code, 0); if (vh !== undefined) terrainMap[c + ',' + r].vh = vh; });
    st.stage = 0; st.hp = Math.round(st.maxHp * .5); st.rebuild = null;
    addLog(`🏗 [재건 완료] ${st.name} (${hpD(st.hp)}/${hpD(st.maxHp)})`, 'eng'); updateVision();
  }
  function v150RepairStruct(a, st) {
    if (st.stage >= 2) {
      if (st.rebuild) return `🏗 재건 중 · ${st.rebuild.left}턴 남음`;
      if (gold[a.team] < V150.rebuildG) return `🏗 재건 비용 부족 (💰${V150.rebuildG})`;
      gold[a.team] -= V150.rebuildG; st.rebuild = { team: a.team, left: V150.rebuildT }; updateGoldUI();
      addLog(`🏗 [재건 시작] ${a.className} ➔ ${st.name} (💰${V150.rebuildG}, ${V150.rebuildT}턴 · 인접 공병 필요)`, 'eng');
      return true;
    }
    if (st.hp >= st.maxHp) return '🔧 이미 온전한 건물입니다';
    const add = Math.round(st.maxHp * .1); st.hp = Math.min(st.maxHp, st.hp + add);
    if (st.stage === 1 && st.hp > st.maxHp / 2) { v150Restore(st); addLog(`🏠 [복구] ${st.name} — 중엄폐 회복`, 'eng'); }
    addLog(`🔧 [건물 수리] ${a.className} ➔ ${st.name} [+${hpD(add)}] (${hpD(st.hp)}/${hpD(st.maxHp)})`, 'eng');
    return true;
  }
  function v150RepairEdge(a, c, r) {
    const e = getEdge(a.c, a.r, c, r); if (!e) return null;
    const max = EDGE_HP[e.kind] || 50; if (!(e.st > 0) && (e.hp === undefined || e.hp >= max)) return '🔧 엄폐물이 온전합니다';
    if (e.st >= 2) { if (gold[a.team] < V150.edgeG) return `🔧 재설치 비용 부족 (💰${V150.edgeG})`; gold[a.team] -= V150.edgeG; updateGoldUI(); }
    e.st = 0; e.hp = max; EDGE_VER++;
    addLog(`🔧 [엄폐물 수리] ${EDGE_NAMES[e.kind] || e.kind}`, 'eng');
    try { if (v99G && v99G.cv) v99G.ver++; } catch (err) { }
    return true;
  }
  { 
    /* handleSpecialTap: layer moved to js/chains/handleSpecialTap.js */ }
  { 
    /* validActionTiles: layer moved to js/chains/validActionTiles.js */ }
  // rebuild progress at the owner's turn start
  { 
    /* ambHeal: layer moved to js/chains/ambHeal.js */ }
  // tile strip: rebuild progress
  { 
    /* renderTileStrip: layer moved to js/chains/renderTileStrip.js */ }


