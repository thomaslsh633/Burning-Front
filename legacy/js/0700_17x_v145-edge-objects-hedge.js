  // ══════════════════════════════════════════════════════════════
  // [17#] v145 — edge objects: hedge / fence lines become edges · directional cover · edge crossing cost · edge models
  // ══════════════════════════════════════════════════════════════
  const EDGE_NAMES = { hedge: '산울타리', fence: '목재 울타리', stone_wall: '돌담', sandbag_row: '샌드백 열', wire: '철조망' };
  const DIR_KO = { e: '동', se: '남동', sw: '남서', w: '서', nw: '북서', ne: '북동' };
  function edgeStripText(c, r) {
    const ed = edgesOf(c, r), ks = Object.keys(ed); if (!ks.length) return '';
    return '<span>변: ' + ks.map(k => DIR_KO[k] + ' ' + EDGE_NAMES[ed[k].kind] + (ed[k].st >= 2 ? '(파괴)' : ed[k].st ? '(손상)' : '')).join(' · ') + '</span>';
  }
  // map load → convert legacy hedge / fence cells
  { 
    /* loadHistoricalMap: layer moved to js/chains/loadHistoricalMap.js */ }
  // stepping over an edge costs extra movement (EDGE_DEFS.cross); Infinity = vehicles cannot cross
  { 
    /* getTileMovementCost: layer moved to js/chains/getTileMovementCost.js */ }
  // edge models in the baked ground: each edge is drawn once, by the cell that owns it (edges e / se / sw)
  { 
    /* v99Uprights: layer moved to js/chains/v99Uprights.js */ }
  // settings: directional-cover switch for comparison tests
  (function () {
    const prev = document.getElementById('sight-opt'); if (!prev) return;
    const g3 = document.createElement('div'); g3.className = 'set-group';
    g3.innerHTML = '<h3>방향 엄폐 (v145)</h3><div class="set-row"><select id="edgecov-opt"><option value="on" selected>켜짐 — 사격 방향의 변(산울타리·담) 엄폐 적용</option><option value="off">꺼짐 — 칸 엄폐만</option></select></div>';
    prev.closest('.set-group').after(g3);
    g3.querySelector('select').addEventListener('change', e => { LAYERS.edgeCover = e.target.value === 'on'; render(); });
  })();


