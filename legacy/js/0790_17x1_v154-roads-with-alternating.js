  // ══════════════════════════════════════════════════════════════
  // [17+1] v154 — roads with alternating straight and curved stretches · stone / pale earth yards around houses ·
  //         softer hillshade (no black slopes) · lighter, fewer grass tufts · calmer dry-grass patches
  //   · roads: each road polyline gets a smooth sideways meander whose strength itself varies along the road, so stretches
  //     run straight and then bend; it fades out at the ends and near junctions so roads still meet; rules unchanged
  //   · yards: the hexes round each house are flagstone on the door side and pale packed earth elsewhere; the next ring
  //     blends half of its hexes into the same earth
  // ══════════════════════════════════════════════════════════════
  const V154 = { polys: null, amp: 26, yard: [196, 178, 136] };
  GROUND_VAR_NAMES.push('yard'); GROUND_VAR.yard = { rgb: V154.yard.slice(), tx: 9 };
  GROUND_VAR.dry_grass.rgb = [134, 132, 82];
  V137.shMin = .74; V137.shMax = 1.16;

  // ---------- roads: straight / curved stretches ----------
  { 
    /* v151RoadPolys: layer moved to js/chains/v151RoadPolys.js */ }
  {  /* loadHistoricalMap: layer moved to js/chains/loadHistoricalMap.js */ }

  // ---------- yards: flagstone on the door side, pale earth round the rest ----------
  { 
    /* v149Assign: layer moved to js/chains/v149Assign.js */ }


