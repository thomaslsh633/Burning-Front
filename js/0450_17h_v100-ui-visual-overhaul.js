  // ══════════════════════════════════════════════════════════════
  // [17h] v100 — UI / visual overhaul, step 1
  //   · theme registry: one entry per battle setting (place · date · season · ground biome · faction flags). A map of another
  //     year/region only needs a V100_THEMES entry + a V100_MAP_THEME line; ground painter, flags and briefing read from it.
  //   · faction flags: 1944 US flag (48 stars) and the red Axis war flag (black iron cross, white edge) — SVG for the DOM,
  //     canvas sprites (waving) on the map: buildings, bunkers, owned capture points
  //   · illustrated icons replace the line pictograms (this step: funds / fuel / munitions; more in v101) — the shared sprite
  //     symbols are swapped in place, so every DOM use updates; the canvas draws a raster of the same SVG
  //   · embedded fonts (Saira Stencil One, Oswald, Black Han Sans, Do Hyeon — SIL OFL 1.1) on DOM and canvas
  //   · brushed-metal texture for the gunmetal plates (generated, no image files)
  //   · operation briefing: recon-photo minimap of the whole map with every objective; opens on a new game and from the map button
  // ══════════════════════════════════════════════════════════════
  var V100 = { flagCv: {}, icoCv: {}, brief: { sel: -1, cache: null } };
  const V100_THEMES = {
    ardennes44: { title: '아르덴 공방전', place: '벨기에 · 아르덴', date: '1944년 12월', year: 1944, season: 'winter', biome: 'winter', grade: 'cold',
      sides: { blue: { flag: 'us48', name: '미 육군' }, red: { flag: 'axis', name: '독일 국방군' } } },
    normandy44: { title: '노르망디 보카주', place: '프랑스 · 노르망디', date: '1944년 7월', year: 1944, season: 'summer', biome: 'summer', grade: 'warm',
      sides: { blue: { flag: 'us48', name: '미 육군' }, red: { flag: 'axis', name: '독일 국방군' } } }
  };
  const V100_MAP_THEME = { langres: 'ardennes44', duel: 'normandy44', sandbox: 'normandy44', vlab: 'normandy44', sector: 'lorraine44', faymonville: 'faymonville44' };
  // v131: autumn ground for the Sector Front map
  V99PAL.autumn = JSON.parse(JSON.stringify(V99PAL.summer));
  Object.assign(V99PAL.autumn.g, { plains: [142, 122, 92], field: [128, 120, 80], bush: [96, 94, 60], hedge: [82, 88, 56], forest: [52, 58, 40], cobblestone: [120, 116, 110] });
  Object.assign(V99PAL.autumn, { soil: [124, 100, 72], grass: [140, 124, 86], road: [150, 144, 132], roadEdge: [112, 104, 92], rut: [118, 108, 94], roadMid: [178, 172, 160], leaf: [96, 84, 46], bush: [88, 86, 52], decLit: [118, 110, 70] });
  V100_THEMES.faymonville44 = { title: '포몽빌', place: '벨기에 · 포몽빌', date: '1944년 9월', year: 1944, season: 'summer', biome: 'summer', grade: 'warm', weather: null, tint: 'rgba(214,170,96,.16)',
    sides: { blue: { flag: 'us48', name: '미 육군' }, red: { flag: 'axis', name: '독일 국방군' } } };
  V100_THEMES.lorraine44 = { title: '로렌 전역', place: '프랑스 · 로렌', date: '1944년 11월', year: 1944, season: 'autumn', biome: 'autumn', grade: 'warm', weather: null, tint: 'rgba(196,150,96,.16)',
    sides: { blue: { flag: 'us48', name: '미 육군' }, red: { flag: 'axis', name: '독일 국방군' } } };

  function v100Theme() { const id = V100_MAP_THEME[mapSelect.value] || 'ardennes44'; return Object.assign({ id }, V100_THEMES[id]); }
  const v100FlagId = team => team === 'blue' || team === 'red' ? v100Theme().sides[team].flag : 'neutral';

  // ---------- flags ----------
  const v100Star = (cx, cy, R) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * .382 : R; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * r).toFixed(2) + ' ' + (cy + Math.sin(a) * r).toFixed(2); } return d + 'Z'; };
  const v100Folds = (w, h) => `<defs><linearGradient id="fo" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".2"/><stop offset=".18" stop-color="#fff" stop-opacity=".12"/><stop offset=".4" stop-color="#000" stop-opacity=".14"/><stop offset=".62" stop-color="#fff" stop-opacity=".1"/><stop offset=".84" stop-color="#000" stop-opacity=".13"/><stop offset="1" stop-color="#fff" stop-opacity=".05"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#fo)"/>`;
  const V100_FLAGS = {
    us48: { w: 190, h: 100, body() {   // 48-star flag (1912–1959): 13 stripes, canton 7 stripes tall, 6 × 8 stars
      let s = '<rect width="190" height="100" fill="#b22234"/>';
      for (let i = 1; i < 13; i += 2) s += `<rect y="${(i * 100 / 13).toFixed(2)}" width="190" height="${(100 / 13 + .02).toFixed(2)}" fill="#f2efe6"/>`;
      s += '<rect width="76" height="53.85" fill="#3c3b6e"/><path fill="#f2efe6" d="';
      for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) s += v100Star(4.75 + 9.5 * c, 4.49 + 8.975 * r, 3.1);
      return s + '"/>' + v100Folds(190, 100); } },
    axis: { w: 161, h: 100, body() {   // v133: war flag, design 1 — red field, offset black-and-white Nordic cross, roundel with an iron cross (no party symbols)
      const cx = 67.14, cy = 52.86, ST = [[1.86, 'f2f2ee'], [2.64, '16181a'], [3.43, 'f2f2ee'], [9.07, '16181a'], [3.43, 'f2f2ee'], [2.64, '16181a'], [1.86, 'f2f2ee']], T = ST.reduce((a, b) => a + b[0], 0);
      let s = '<rect width="161" height="100" fill="#c41f1a"/>', o = -T / 2;
      ST.forEach(([w, c]) => { s += `<rect x="${(cx + o).toFixed(2)}" width="${w}" height="100" fill="#${c}"/><rect y="${(cy + o).toFixed(2)}" width="161" height="${w}" fill="#${c}"/>`; o += w; });
      [[35.4, 'f2f2ee'], [33.6, '16181a'], [30.1, 'f2f2ee'], [28.3, '16181a'], [26.9, 'f2f2ee']].forEach(([r, c]) => { s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#${c}"/>`; });
      const a = 3.4, L = 19.6, b = 7.6, R = (x, y, k) => { const c = [1, 0, -1, 0][k], n = [0, 1, 0, -1][k]; return [cx + x * c - y * n, cy + x * n + y * c]; }, f = p => p[0].toFixed(2) + ' ' + p[1].toFixed(2);
      let d = 'M' + f(R(a, -a, 0));
      for (let k = 0; k < 4; k++) d += 'Q' + f(R(a + (L - a) * .7, -a - (b - a) * .25, k)) + ' ' + f(R(L, -b, k)) + 'L' + f(R(L, b, k)) + 'Q' + f(R(a + (L - a) * .7, a + (b - a) * .25, k)) + ' ' + f(R(a, a, k));
      d += 'Z';
      return s + `<path d="${d}" fill="#16181a" stroke="#16181a" stroke-width="7.6" stroke-linejoin="miter"/><path d="${d}" fill="#f2f2ee" stroke="#f2f2ee" stroke-width="4.2" stroke-linejoin="miter"/><path d="${d}" fill="#16181a"/>` + v100Folds(161, 100); } },
    neutral: { w: 150, h: 90, body() { return '<rect width="150" height="90" fill="#d8d4c8"/>' + v100Folds(150, 90); } }
  };
  const v100FlagUrl = id => { const F = V100_FLAGS[id]; return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${F.w} ${F.h}" width="${F.w * 2}" height="${F.h * 2}">${F.body()}</svg>`); };
  Object.keys(V100_FLAGS).forEach(id => { const im = new Image(); im.onload = () => { const F = V100_FLAGS[id], c = TankBaker.mkCanvas(F.w * 2, F.h * 2); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); V100.flagCv[id] = c; if (mapReady) render(); }; im.src = v100FlagUrl(id); });
  function v100FlagCss() { const r = document.documentElement.style; r.setProperty('--flag-blue', `url("${v100FlagUrl(v100FlagId('blue'))}")`); r.setProperty('--flag-red', `url("${v100FlagUrl(v100FlagId('red'))}")`); }
  // waving cloth: vertical slices offset by a travelling sine, shaded by the slope (hoist edge fixed)
  function v100DrawFlag(g, id, x, y, w, h, ph) {
    const im = V100.flagCv[id]; if (!im) return false;
    const N = 9, rm = reduceMotion(), sw = im.width / N;
    for (let i = 0; i < N; i++) {
      const u = i / N, a = rm ? 0 : Math.sin(ph + u * 4.2), dy = a * h * .11 * (u + .1), xx = x + u * w, ww = w / N + .3;
      g.drawImage(im, i * sw, 0, sw, im.height, xx, y + dy, ww, h);
      const sh = rm ? 0 : Math.cos(ph + u * 4.2) * .17;
      if (sh > .01 || sh < -.01) { g.fillStyle = sh > 0 ? `rgba(255,255,255,${(sh * .55).toFixed(3)})` : `rgba(0,0,0,${(-sh).toFixed(3)})`; g.fillRect(xx, y + dy, ww, h); }
    }
    return true;
  }
  
  /* v99Flag: layer moved to js/chains/v99Flag.js */
  // capture point cloth: owner's national flag, weathered white when neutral; VP poles get a brass star finial
  function v100CpFlag(cp, x, top, fw, fh) {
    const id = cp.owner ? v100FlagId(cp.owner) : 'neutral', F = V100_FLAGS[id]; if (!V100.flagCv[id]) return false;
    const w = fw * 1.18, h = w * F.h / F.w;
    v100DrawFlag(ctx, id, x + .6, top, w, h, performance.now() / 260 + cp.c);
    if (cp.cls === 'vp') { ctx.fillStyle = '#e2c47e'; ctx.strokeStyle = '#5b4316'; ctx.lineWidth = .5; ctx.beginPath(); const s = new Path2D(v100Star(x, top - 3.2, 3.4)); ctx.fill(s); ctx.stroke(s); }
    return true;
  }

  // ---------- illustrated icons (24-unit viewBox; shading from the upper left like the map and the sprites) ----------
  const V100_ICONS = {
    gold: `<defs><linearGradient id="v1gT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3e9d1"/><stop offset="1" stop-color="#aab991"/></linearGradient></defs><g stroke="none">
      <path d="M2.5 11 L12 15.2 L12 21.2 L2.5 17 Z" fill="#8d9b75"/><path d="M12 15.2 L21.5 10.6 L21.5 16.6 L12 21.2 Z" fill="#66744c"/>
      <path d="M2.5 12.6 L12 16.8 M2.5 14.2 L12 18.4 M2.5 15.8 L12 20 M12 16.8 L21.5 12.2 M12 18.4 L21.5 13.8 M12 20 L21.5 15.4" stroke="#c7d1ae" stroke-width=".45" fill="none"/>
      <path d="M2.5 11 L12 6.5 L21.5 10.6 L12 15.2 Z" fill="url(#v1gT)"/><path d="M4.7 11 L12 7.6 L19.3 10.6 L12 14.1 Z" fill="none" stroke="#7f8f62" stroke-width=".55"/>
      <ellipse cx="12" cy="10.85" rx="2.2" ry="1.25" fill="#8fa070"/><path d="M6.5 9.1 L8 8.4 L17.5 12.6 L16 13.3 Z" fill="#cfae60"/><path d="M16 13.3 L17.5 12.6 L17.5 18.6 L16 19.3 Z" fill="#9c7f3c"/>
      <path d="M2.5 11 L12 6.5 L21.5 10.6 L21.5 16.6 L12 21.2 L2.5 17 Z" fill="none" stroke="#252c1c" stroke-width=".6" stroke-linejoin="round"/></g>`,
    fuel: `<defs><linearGradient id="v1fF" x1="0" x2="1"><stop offset="0" stop-color="#7d8a52"/><stop offset="1" stop-color="#525d2d"/></linearGradient></defs><g stroke="none">
      <path d="M16 7.2 L19.6 5.4 L19.6 20.4 L16 22.2 Z" fill="#3b4421"/><path d="M5.4 7.2 L9 5.4 L19.6 5.4 L16 7.2 Z" fill="#8d995e"/>
      <rect x="5.4" y="7.2" width="10.6" height="15" rx=".8" fill="url(#v1fF)"/>
      <path d="M7.4 9.6 L14 19.6 M14 9.6 L7.4 19.6" stroke="#3a431e" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M7 9.2 L13.6 19.2 M13.6 9.2 L7 19.2" stroke="#97a468" stroke-width=".65" stroke-linecap="round" fill="none"/>
      <path d="M10.2 5.9 V3.2 H18 V5.6" fill="none" stroke="#283014" stroke-width="1.3" stroke-linejoin="round"/><path d="M12.8 3.4 V5.6 M15.4 3.4 V5.6" stroke="#283014" stroke-width="1" fill="none"/>
      <rect x="5.9" y="3.5" width="2.6" height="2.8" fill="#4a5428"/><ellipse cx="7.2" cy="3.5" rx="1.3" ry=".55" fill="#a3ae72"/><rect x="5.4" y="7.2" width=".9" height="15" fill="#b2bd84" opacity=".5"/>
      <path d="M5.4 7.2 L9 5.4 L19.6 5.4 L19.6 20.4 L16 22.2 L5.4 22.2 Z" fill="none" stroke="#1d220e" stroke-width=".6" stroke-linejoin="round"/></g>`,
    ammo: `<defs><linearGradient id="v1aB" x1="0" x2="1"><stop offset="0" stop-color="#f6e09e"/><stop offset=".45" stop-color="#c99a3e"/><stop offset="1" stop-color="#76511a"/></linearGradient>
      <linearGradient id="v1aP" x1="0" x2="1"><stop offset="0" stop-color="#99a274"/><stop offset="1" stop-color="#4b5331"/></linearGradient></defs><g stroke="none">` +
      [[12, 2, 10, 21.6, 2.6], [7, 6, 12.6, 22.2, 2.35], [17, 6, 12.6, 22.2, 2.35]].map(([x, t, c, b, w]) =>
        `<path d="M${x - w} ${c - .9} L${x - w} ${c - 3} Q${x - w} ${t + 1.6} ${x} ${t} Q${x + w} ${t + 1.6} ${x + w} ${c - 3} L${x + w} ${c - .9} Z" fill="url(#v1aP)"/>` +
        `<circle cx="${x}" cy="${t + .9}" r=".85" fill="#3c3f42"/><rect x="${x - w}" y="${c - 1}" width="${2 * w}" height=".9" fill="#b5652e"/>` +
        `<rect x="${x - w}" y="${c - .1}" width="${2 * w}" height="${b - c}" fill="url(#v1aB)"/><rect x="${x - w - .3}" y="${b - .9}" width="${2 * w + .6}" height=".9" fill="#8a6420"/>` +
        `<path d="M${x - w} ${b} L${x - w} ${c - 3} Q${x - w} ${t + 1.6} ${x} ${t} Q${x + w} ${t + 1.6} ${x + w} ${c - 3} L${x + w} ${b} Z" fill="none" stroke="#2a1e0c" stroke-width=".5"/>`).join('') + '</g>',
    map: `<g stroke="none"><path d="M2.5 6 L8.5 4 L15.5 6.5 L21.5 4.5 V18 L15.5 20 L8.5 17.5 L2.5 19.5 Z" fill="#dccfac"/><path d="M8.5 4 V17.5 L15.5 20 V6.5 Z" fill="#bfb089"/>
      <path d="M3.5 9 Q6 8 8.5 9.5 M15.5 12 Q18 10.5 21 11.5" stroke="#7d9a6a" stroke-width="1.6" fill="none"/>
      <path d="M4 16 Q8 11.5 11 13.5 T19 8" fill="none" stroke="#b2412c" stroke-width="1.15" stroke-dasharray="1.7 1.1"/>
      <path d="M18.4 3 a2.4 2.4 0 0 1 2.4 2.4 c0 1.8 -2.4 4.4 -2.4 4.4 s-2.4 -2.6 -2.4 -4.4 a2.4 2.4 0 0 1 2.4 -2.4 Z" fill="#c4473b"/><circle cx="18.4" cy="5.4" r=".9" fill="#f2efe6"/>
      <path d="M2.5 6 L8.5 4 L15.5 6.5 L21.5 4.5 V18 L15.5 20 L8.5 17.5 L2.5 19.5 Z" fill="none" stroke="#3a2f1c" stroke-width=".6" stroke-linejoin="round"/></g>`
  };
  function v100InstallIcons(map) {
    Object.entries(map).forEach(([n, body]) => {
      const sym = document.getElementById('ic-' + n);
      if (sym) sym.innerHTML = body; else document.querySelector('#ic-sprite defs').insertAdjacentHTML('beforeend', `<symbol id="ic-${n}" viewBox="0 0 24 24">${body}</symbol>`);
      if (!ICON_DEFS[n]) ICON_DEFS[n] = ['', ''];
      const im = new Image(); im.onload = () => { const c = TankBaker.mkCanvas(96, 96); c.getContext('2d').drawImage(im, 0, 0, 96, 96); V100.icoCv[n] = c; if (mapReady) render(); };
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96">${body}</svg>`);
    });
  }
  
  /* drawIco: layer moved to js/chains/drawIco.js */
  v100InstallIcons(V100_ICONS);

  // ---------- fonts on the canvas: generic sans-serif → Oswald (Latin / digits) + Do Hyeon (Hangul) ----------
  { const D = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'font'), STK = "Oswald, 'Do Hyeon', sans-serif";
    if (D && D.set) Object.defineProperty(ctx, 'font', { configurable: true, get() { return D.get.call(this); }, set(v) { D.set.call(this, typeof v === 'string' ? v.replace(/(^|\s)sans-serif\s*$/, '$1' + STK) : v); } });
    if (document.fonts && document.fonts.load) Promise.all(['Oswald', 'Do Hyeon', 'Saira Stencil One', 'Black Han Sans'].map(f => document.fonts.load(`16px "${f}"`, 'A1가'))).then(() => { if (mapReady) render(); }).catch(() => {}); }

  // ---------- brushed-metal texture for the plates ----------
  { const W = 192, H = 96, c = TankBaker.mkCanvas(W, H), g = c.getContext('2d'), id = g.createImageData(W, H), d = id.data;
    const row = Array.from({ length: H }, (_, y) => v99h(y, 3, 7));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const n = row[y] * .55 + v99N(x * .05, y * 1.7) * .25 + v99h(x, y, 9) * .2 - .5, o = (y * W + x) * 4, v = n > 0 ? 255 : 0;
      d[o] = d[o + 1] = d[o + 2] = v; d[o + 3] = Math.min(255, Math.abs(n) * 46); }
    g.putImageData(id, 0, 0); document.documentElement.style.setProperty('--tex', `url("${c.toDataURL()}")`); }

  // ---------- operation briefing (recon-photo minimap) ----------
  const V100_CLS = { vp: ['star', '승리 거점'], manpower: ['gold', '군자금'], fuel: ['fuel', '연료'], fuel_minor: ['fuel', '연료(소)'], mun: ['ammo', '탄약'] };
  const v100Yield = cp => { const y = cp.yield || YIELD[cp.cls] || {}; return cp.cls === 'vp' ? 'VP' : '+' + (cp.cls === 'manpower' ? (y.g || 0) : (y.f || y.m || y.g || 0)); };
  const v100Ctr = cp => { const cs = (cp.cores || [[cp.c, cp.r]]).map(k => getHexCenter(k[0], k[1])); return { x: cs.reduce((s, q) => s + q.x, 0) / cs.length, y: cs.reduce((s, q) => s + q.y, 0) / cs.length }; };
  document.getElementById('app').insertAdjacentHTML('beforeend', `<div id="v100-brief" role="dialog" aria-label="작전 브리핑"><div class="bf-card">
    <div class="bf-head"><i class="fl" id="bf-fl"></i><b id="bf-title"></b><small id="bf-sub"></small></div>
    <div class="bf-map"><canvas id="bf-cv"></canvas><span class="stamp" id="bf-stamp"></span></div>
    <div class="bf-side" id="bf-side"></div>
    <div class="bf-foot"><small id="bf-hint">거점을 누르면 위치와 정보를 보여 줍니다 · 한 번 더 누르면 그 위치로 이동</small><button class="bf-go" id="bf-go">작전 개시</button></div></div></div>`);
  document.getElementById('top-bar').insertAdjacentHTML('beforeend', `<button id="brief-btn" class="icon-btn" aria-label="작전 브리핑">${ico('map')}</button>`);
  function v100BriefPhoto(W, H) {   // the painted ground of the whole map at minimap scale, graded like a period recon print
    const G = v99G, key = G.key + '|' + G.ver + '|' + W + 'x' + H;
    if (V100.brief.cache && V100.brief.cache.key === key) return V100.brief.cache;
    const s = Math.min(W / WORLD_W, H / WORLD_H), ox = (W - WORLD_W * s) / 2, oy = (H - WORLD_H * s) / 2, tw = Math.ceil(WORLD_W * s), th = Math.ceil(WORLD_H * s), tmp = TankBaker.mkCanvas(tw, th);
    const sv = { cv: G.cv, gs: G.gs }; G.cv = tmp; G.gs = s;
    try { v99Repaint(0, 0, tw, th); } finally { G.cv = sv.cv; G.gs = sv.gs; }
    const out = TankBaker.mkCanvas(W, H), g = out.getContext('2d'); g.fillStyle = '#15191e'; g.fillRect(0, 0, W, H); g.drawImage(tmp, ox, oy);
    const img = g.getImageData(0, 0, W, H), d = img.data, warm = v100Theme().grade === 'warm';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4, L = .3 * d[o] + .59 * d[o + 1] + .11 * d[o + 2], dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2), vg = 1 - .32 * Math.min(1, (dx * dx + dy * dy) * .55), gr = (v99h(x, y, 5) - .5) * 16;
      const k = (v, t) => Math.max(0, Math.min(255, ((L + (v - L) * .32 - 128) * 1.12 + 128 + t + gr) * vg));
      d[o] = k(d[o], warm ? 8 : -3); d[o + 1] = k(d[o + 1], warm ? 3 : 0); d[o + 2] = k(d[o + 2], warm ? -8 : 6);
    }
    g.putImageData(img, 0, 0);
    return V100.brief.cache = { key, cv: out, s, ox, oy };
  }
  function v100BriefDraw() {
    const cv = document.getElementById('bf-cv'), box = cv.parentElement, dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.max(50, Math.round(box.clientWidth * dpr)), H = Math.max(50, Math.round(box.clientHeight * dpr));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    try { v99Ensure(); } catch (e) { }
    const P = v100BriefPhoto(W, H), g = cv.getContext('2d'), s = P.s, u = 1 / s * dpr;   // u = world units per CSS pixel
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(P.cv, 0, 0);
    g.setTransform(s, 0, 0, s, P.ox, P.oy); g.lineCap = 'round'; g.lineJoin = 'round';
    capturePoints.forEach((cp, i) => {   // grease-pencil zone rings
      const k = v99G.ver + '|' + cp.zoneList.length; if (!cp._v99 || cp._v99.k !== k) cp._v99 = { k, loops: v99Loops2(cp.zone) };
      const col = cp.owner === 'blue' ? '#5f93e6' : cp.owner === 'red' ? '#e0574a' : '#f1e9d2', sel = i === V100.brief.sel;
      g.beginPath(); cp._v99.loops.forEach(l => v99PathOn(g, l.sp, l.closed));
      g.fillStyle = cp.owner ? (cp.owner === 'blue' ? 'rgba(95,147,230,.16)' : 'rgba(224,87,74,.16)') : 'rgba(241,233,210,.08)'; g.fill('evenodd');
      g.setLineDash(cp.owner ? [] : [4 * u, 3 * u]); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 3.2 * u; g.stroke(); g.strokeStyle = sel ? '#e2c47e' : col; g.lineWidth = (sel ? 2.4 : 1.6) * u; g.stroke(); g.setLineDash([]);
    });
    buildings.filter(b => b.type === 'hq' && b.hp > 0).forEach(b => {   // HQ flags
      const q = getHexCenter(b.c, b.r), F = V100_FLAGS[v100FlagId(b.team)], w = 16 * u, h = w * F.h / F.w;
      g.strokeStyle = '#1a1c1e'; g.lineWidth = 1.2 * u; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(q.x, q.y - 22 * u); g.stroke();
      v100DrawFlag(g, v100FlagId(b.team), q.x + .6 * u, q.y - 22 * u, w, h, 1.2);
      g.font = `600 ${10 * u}px Oswald, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'top'; g.lineWidth = 3 * u; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText('HQ', q.x, q.y + 3 * u); g.fillStyle = '#f1e9d2'; g.fillText('HQ', q.x, q.y + 3 * u);
    });
    capturePoints.forEach((cp, i) => {   // objective medallions + yields
      const q = v100Ctr(cp), sel = i === V100.brief.sel, R = (cp.cls === 'vp' ? 9.5 : 7.5) * u * (sel ? 1.2 : 1);
      g.beginPath(); g.arc(q.x, q.y, R, 0, 6.3); g.fillStyle = 'rgba(16,20,26,.88)'; g.fill(); g.lineWidth = 1.3 * u; g.strokeStyle = sel ? '#e2c47e' : cp.owner === 'blue' ? '#5f93e6' : cp.owner === 'red' ? '#e0574a' : '#d6cfbb'; g.stroke();
      drawIco(g, (V100_CLS[cp.cls] || ['star'])[0], q.x, q.y, R * 1.45);
      const t = v100Yield(cp); g.font = `600 ${(cp.cls === 'vp' ? 10 : 9) * u}px Oswald, sans-serif`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.lineWidth = 2.6 * u; g.strokeStyle = 'rgba(0,0,0,.8)';
      g.strokeText(t, q.x + R + 2 * u, q.y); g.fillStyle = cp.cls === 'vp' ? '#e2c47e' : '#e9e3d0'; g.fillText(t, q.x + R + 2 * u, q.y);
      if (sel) { const nm = cp.name; g.font = `500 ${10 * u}px Oswald, 'Do Hyeon', sans-serif`; const tw = g.measureText(nm).width + 10 * u, bx = q.x - tw / 2, by = q.y - R - 17 * u;
        g.fillStyle = 'rgba(16,20,26,.9)'; g.fillRect(bx, by, tw, 13 * u); g.strokeStyle = '#e2c47e'; g.lineWidth = .8 * u; g.strokeRect(bx, by, tw, 13 * u); g.fillStyle = '#f1e9d2'; g.textAlign = 'center'; g.fillText(nm, q.x, by + 6.8 * u); }
    });
    // north arrow (map rows grow southward)
    g.setTransform(dpr, 0, 0, dpr, 0, 0); const n = isoD(0, -1), nl = Math.hypot(n.x, n.y), ax = W / dpr - 22, ay = H / dpr - 26;
    g.strokeStyle = '#f1e9d2'; g.fillStyle = '#f1e9d2'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(ax - n.x / nl * 9, ay - n.y / nl * 9); g.lineTo(ax + n.x / nl * 9, ay + n.y / nl * 9); g.stroke();
    g.beginPath(); g.arc(ax + n.x / nl * 9, ay + n.y / nl * 9, 2.2, 0, 6.3); g.fill(); g.font = "600 10px Oswald, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', ax + n.x / nl * 17, ay + n.y / nl * 17);
  }
  function v100BriefList() {
    const el = document.getElementById('bf-side'), hq = buildings.find(b => b.team === currentTurn && b.type === 'hq'), dist = cp => hq ? getDistance(hq.c, hq.r, cp.c, cp.r) : 0;
    const idx = capturePoints.map((cp, i) => i), vps = idx.filter(i => capturePoints[i].cls === 'vp'), res = idx.filter(i => capturePoints[i].cls !== 'vp').sort((a, b) => dist(capturePoints[a]) - dist(capturePoints[b]));
    const row = i => { const cp = capturePoints[i], c = V100_CLS[cp.cls] || ['star', '']; const ow = cp.owner ? `<i class="ow" style="background-image:url('${v100FlagUrl(v100FlagId(cp.owner))}')"></i>` : '<i class="ow n"></i>';
      return `<button class="bf-row${i === V100.brief.sel ? ' sel' : ''}" data-i="${i}">${ico(c[0])}<span class="nm">${cp.name}</span><span class="yd">${v100Yield(cp)}</span>${ow}</button>`; };
    el.innerHTML = (vps.length ? `<h4>승리 거점</h4>${vps.map(row).join('')}` : '') + (res.length ? `<h4>자원 거점</h4>${res.map(row).join('')}` : '') +
      `<h4>승리 조건</h4><div class="bf-note">양측 티켓 ${VM_START}. 승리 거점을 더 많이 확보한 쪽이 매 턴 상대 티켓을 깎습니다. 티켓이 0이 되면 패배합니다. 보병만 거점을 점령할 수 있고, 차량은 점령을 막기만 합니다.</div>`;
  }
  function v100BriefSel(i) {
    if (i === V100.brief.sel && i >= 0) { const q = v100Ctr(capturePoints[i]); v100BriefClose(); camX = q.x - VIEW_W / 2; camY = q.y - VIEW_H / 2; clampCam(); render(); return; }
    V100.brief.sel = i; v100BriefList(); v100BriefDraw();
    const cp = capturePoints[i]; if (cp) { const c = V100_CLS[cp.cls] || ['', '']; document.getElementById('bf-hint').textContent = `${cp.name} · ${c[1]} ${v100Yield(cp)} · ${cp.owner ? v100Theme().sides[cp.owner].name : '중립'} — 한 번 더 누르면 그 위치로 이동`; }
  }
  function v100BriefOpen() {
    const th = v100Theme(), el = document.getElementById('v100-brief'); const ms = document.getElementById('menu-sheet'); if (ms) ms.classList.remove('open');
    document.getElementById('bf-fl').style.backgroundImage = `url("${v100FlagUrl(v100FlagId(currentTurn))}")`;
    document.getElementById('bf-title').textContent = `작전 브리핑 · ${th.title}`; document.getElementById('bf-sub').textContent = `${th.place} · ${th.date}`;
    document.getElementById('bf-stamp').textContent = `항공 정찰 · ${th.date}`;
    V100.brief.sel = -1; el.classList.add('open'); v100BriefList();
    requestAnimationFrame(() => requestAnimationFrame(v100BriefDraw));
  }
  function v100BriefClose() { document.getElementById('v100-brief').classList.remove('open'); }
  document.getElementById('bf-go').addEventListener('click', v100BriefClose);
  document.getElementById('brief-btn').addEventListener('click', v100BriefOpen);
  document.getElementById('bf-side').addEventListener('click', e => { const b = e.target.closest('.bf-row'); if (b) v100BriefSel(+b.dataset.i); });
  document.getElementById('bf-cv').addEventListener('click', e => {
    const P = V100.brief.cache; if (!P) return; const cv = e.currentTarget, r = cv.getBoundingClientRect(), k = cv.width / r.width, wx = ((e.clientX - r.left) * k - P.ox) / P.s, wy = ((e.clientY - r.top) * k - P.oy) / P.s;
    let best = -1, bd = 40; capturePoints.forEach((cp, i) => { const q = v100Ctr(cp), d = Math.hypot(q.x - wx, q.y - wy); if (d < bd) { bd = d; best = i; } });
    if (best >= 0) v100BriefSel(best);
  });
  window.addEventListener('resize', () => { if (document.getElementById('v100-brief').classList.contains('open')) requestAnimationFrame(v100BriefDraw); });
  { const KEY = 'coh1944.brief', bb = document.getElementById('v100-brief-btn');
    try { V100.autoBrief = localStorage.getItem(KEY) !== 'off'; } catch (e) { V100.autoBrief = true; }
    if (bb) { const lab = () => bb.textContent = '시작 브리핑: ' + (V100.autoBrief ? '켜짐' : '꺼짐'); lab(); bb.addEventListener('click', () => { V100.autoBrief = !V100.autoBrief; try { localStorage.setItem(KEY, V100.autoBrief ? 'on' : 'off'); } catch (e) { } lab(); }); } }
  
  /* resetGame: layer moved to js/chains/resetGame.js */
  v100FlagCss();

