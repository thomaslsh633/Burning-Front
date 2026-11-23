  // ══════════════════════════════════════════════════════════════
  // [17f] v98 — unit visibility: compact chips (zoom LOD), infantry readability scale (v99 removed the sprite rims),
  //       low / faded buildings, decluttered capture flags, calmer terrain palette
  // ══════════════════════════════════════════════════════════════
  const V98 = { chipZoom: .8, glyphZoom: 1.3 };
  function v98InfScale() { const z = zoom / V109.HEXK; return Math.max(1, Math.min(1.5, 1.5 - (z - 1) * (.5 / 1.4))); }   // v109: on the 1.3x zoom range
  function v98Rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(k => parseInt(h.substr(k, 2), 16)); }
  /* v98Disc: original body removed — replaced by a later layer (js/chains/v98Disc.js) */
  

  // A: compact chip — glyph disc + HP bar + head count, screen-constant, sitting just above the model; the full banner returns for the selected unit / targets / far zoom
  
  /* drawBanner: layer moved to js/chains/drawBanner.js */

  // D: a building fades when a visible unit stands right behind it (screen-above, within ~1 hex)
  
  /* drawBuildingShape: layer moved to js/chains/drawBuildingShape.js */

  // F: terrain palette 15 % less saturated (cached per colour)
  const _tf98 = new Map();
  /* getTerrainFillColor: layer moved to js/chains/getTerrainFillColor.js */

  // settings toggle: compare the baked 2.5D tank with the old prism art
  { const sb = document.getElementById('spr-btn'); if (sb) sb.addEventListener('click', () => { TANK_SPR.on = !TANK_SPR.on; sb.textContent = '전차 2.5D 스프라이트: ' + (TANK_SPR.on ? '켜짐' : '꺼짐'); render(); }); }


