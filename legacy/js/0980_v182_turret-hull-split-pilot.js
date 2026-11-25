  // ══════════════════════════════════════════════════════════════
  // [v182] Turret / hull split pilot (visual only, Sherman + Panzer IV). Mesh triangles carry a part group (Mesh.G), the baker can
  //   rasterise one part (o.part), TANK_SPR.getPart caches hull-only / turret-only sprites (24 directions, warmed after the whole ones).
  //   Attack turn: the turret turns first, the hull follows; at rest (same direction) the ordinary whole sprite is drawn.
  //   Rules are untouched: the logic facing still becomes the attack direction at once. Tripod-leg / release-hop motion of v181 removed.
  // ══════════════════════════════════════════════════════════════
  var V182 = { on: true, cur: null, splitDraws: 0 };
