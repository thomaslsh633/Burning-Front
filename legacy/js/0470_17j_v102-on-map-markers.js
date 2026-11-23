  // ══════════════════════════════════════════════════════════════
  // [17j] v102 — on-map markers in the new style
  //   · the old near-black badge fills (unit banners, building banners, capture badges, countdown badges) become a brushed
  //     gunmetal plate pattern on the main canvas (one fillStyle hook, every call site at once)
  //   · class glyphs on the map (chips / banners) and the status badges use the illustrated icons
  //   · compact unit chip: national flag · class icon · health bar · head count on a gunmetal plate with a team-colour sill
  //   · full banner: national flag beside the shield
  // ══════════════════════════════════════════════════════════════
  const V102_KIND = { inf: 'inf', hvy: 'burst', art: 'howitzer', tank: 'tank', td: 'td', veh: 'jeep', sup: 'crate' };
  const V102_ST = { pin: 'pin', supp: 'warn', nofire: 'gunx', trk: 'wheel', fire: 'flame', amm: 'ammo', fue: 'fuel' };
  { // gunmetal plate pattern replaces the dark badge fills
    const W = 64, c = TankBaker.mkCanvas(W, W), g = c.getContext('2d'), id = g.createImageData(W, W), d = id.data;
    for (let y = 0; y < W; y++) { const rv = v99h(y, 5, 2); for (let x = 0; x < W; x++) { const n = rv * .5 + v99h(x, y, 4) * .5, o = (y * W + x) * 4; d[o] = 40 + n * 10; d[o + 1] = 46 + n * 10; d[o + 2] = 53 + n * 11; d[o + 3] = 240; } }
    g.putImageData(id, 0, 0);
    const pat = ctx.createPattern(c, 'repeat'), DARK = new Set(['rgba(10,15,20,.94)', 'rgba(8,12,16,.92)', 'rgba(8,12,16,.96)', 'rgba(10,14,18,.92)', 'rgba(10,14,18,.94)', 'rgba(8,12,16,.9)']);
    const D = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'fillStyle');
    if (D && D.set && pat) Object.defineProperty(ctx, 'fillStyle', { configurable: true, get() { return D.get.call(this); }, set(v) { D.set.call(this, typeof v === 'string' && DARK.has(v) ? pat : v); } });
  }
  const o_dg102 = drawGlyph;
  drawGlyph = function (k, c) { const n = V102_KIND[k]; if (n && V100.icoCv[n]) return drawIco(ctx, n, 0, 0, 13); return o_dg102(k, c); };
  
  /* drawStatusIcon: layer moved to js/chains/drawStatusIcon.js */
  
  
  // compact chip (zoom ≥ chipZoom, unit not selected / targeted): drawn at screen scale above the model
  
  /* drawBanner: layer moved to js/chains/drawBanner.js */

