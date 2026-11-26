  // ══════════════════════════════════════════════════════════════
  // [17d] v61 — Unified icon set (replaces pictograph emoji everywhere)
  //   · ICON_DEFS  : 24×24 grid, ONE stroke style (2px, miter joins, butt caps), single colour (currentColor)
  //   · ico(name)  : inline <svg> markup for templates      · drawIco(...) : the same glyphs on the canvas
  //   · EMO2ICO    : every emoji / pictograph that still reaches the DOM text, canvas fillText, native
  //                  dialogs or attributes is mapped here. To re-map a glyph, edit this table only.
  //   · iconize()  : swaps matching characters in DOM text for <svg>. The original character stays in the DOM
  //                  inside a zero-size <u class="ict"> so textContent-based parsing (action-tile builder,
  //                  notes collector, …) keeps seeing the same text as before.
  //   · attributes (title / placeholder / aria-label), <option> text and alert()/confirm() are stripped of
  //     pictographs because they cannot hold markup.
  // ══════════════════════════════════════════════════════════════
  const ICON_DEFS = {
    gold: ['M8.2 3 L15.8 3 L21 8.2 L21 15.8 L15.8 21 L8.2 21 L3 15.8 L3 8.2 Z M12 7 L17 12 L12 17 L7 12 Z', ''],
    fuel: ['M5 21 V8 L8 5 H19 V21 Z M11 8 V11 H16 V8 M5 15 H19', 'M6 2.5 H9 V5 H6 Z'],
    ammo: ['M12 3 L16 8 V18 H8 V8 Z M8 14 H16 M7 21 H17', ''],
    medal: ['M5 9 L12 4 L19 9 M5 15 L12 10 L19 15 M5 21 L12 16 L19 21', ''],
    star: ['', 'M12 2.6 L14.5 9.1 L21.5 9.5 L16.1 13.9 L17.9 20.7 L12 16.9 L6.1 20.7 L7.9 13.9 L2.5 9.5 L9.5 9.1 Z'],
    blast: ['M12 1.5 L13.9 7.4 L19.4 4.6 L16.6 10.1 L22.5 12 L16.6 13.9 L19.4 19.4 L13.9 16.6 L12 22.5 L10.1 16.6 L4.6 19.4 L7.4 13.9 L1.5 12 L7.4 10.1 L4.6 4.6 L10.1 7.4 Z', ''],
    target: ['M8.6 4 L15.4 4 L20 8.6 L20 15.4 L15.4 20 L8.6 20 L4 15.4 L4 8.6 Z M12 1.5 V6.5 M12 17.5 V22.5 M1.5 12 H6.5 M17.5 12 H22.5', 'M10.5 10.5 H13.5 V13.5 H10.5 Z'],
    crate: ['M12 3 L21 7.5 V16.5 L12 21 L3 16.5 V7.5 Z M3 7.5 L12 12 L21 7.5 M12 12 V21', ''],
    flame: ['M12 2 L17 10 L19 15 L15 21 H9 L5 15 L8 10 L10 13 Z', 'M12 12 L14.5 16 L12 19 L9.5 16 Z'],
    shield: ['M12 3 L20 6 V12 L12 21 L4 12 V6 Z', 'M12 3 L4 6 V12 L12 21 Z'],
    burst: ['M3 7 H15 M3 12 H15 M3 17 H15', 'M15 4.5 L21 7 L15 9.5 Z M15 9.5 L21 12 L15 14.5 Z M15 14.5 L21 17 L15 19.5 Z'],
    track: ['M7 6 H17 L22 12 L17 18 H7 L2 12 Z', 'M5.5 11 H8.5 V13 H5.5 Z M10.5 11 H13.5 V13 H10.5 Z M15.5 11 H18.5 V13 H15.5 Z'],
    bolt: ['', 'M13.5 2 L5 13.5 H11 L10 22 L19 10 H13 Z'],
    swords: ['M4 3 L16 15 M20 3 L8 15 M12.7 16.3 L17.3 11.7 M11.3 16.3 L6.7 11.7 M15 14 L19 18 M9 14 L5 18', ''],
    smoke: ['M3 7 L7 5 L11 7 L15 5 L19 7 L21 6 M3 13 L7 11 L11 13 L15 11 L19 13 L21 12 M3 19 L7 17 L11 19 L15 17 L19 19 L21 18', ''],
    spark: ['', 'M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z'],
    cycle: ['M5 10 V6 H19 M16 3 L19 6 L16 9 M19 14 V18 H5 M8 15 L5 18 L8 21', ''],
    gear: ['M18.9 10.1 L21.9 10.3 L21.9 13.7 L18.9 13.9 L18.3 15.6 L20.2 17.8 L17.8 20.2 L15.6 18.3 L13.9 18.9 L13.7 21.9 L10.3 21.9 L10.1 18.9 L8.4 18.3 L6.2 20.2 L3.8 17.8 L5.7 15.6 L5.1 13.9 L2.1 13.7 L2.1 10.3 L5.1 10.1 L5.7 8.4 L3.8 6.2 L6.2 3.8 L8.4 5.7 L10.1 5.1 L10.3 2.1 L13.7 2.1 L13.9 5.1 L15.6 5.7 L17.8 3.8 L20.2 6.2 L18.3 8.4 Z M10.6 8.6 L13.4 8.6 L15.4 10.6 L15.4 13.4 L13.4 15.4 L10.6 15.4 L8.6 13.4 L8.6 10.6 Z', ''],
    lock: ['M5 11 H19 V21 H5 Z M8 11 V7 L10 4 H14 L16 7 V11', 'M11 14.5 H13 V18.5 H11 Z'],
    hidden: ['M2 12 L7 7 H17 L22 12 L17 17 H7 Z M4 3 L20 21', 'M10 10 H14 V14 H10 Z'],
    charge: ['M4 9 H16 V19 H4 Z M8 9 V19 M12 9 V19 M16 14 H19 L21 10', 'M19 5.5 L21.5 8 L19 10.5 L16.5 8 Z'],
    rocket: ['M4 9 H15 L21 12 L15 15 H4 Z M4 9 L2 6 H7 L8 9 M4 15 L2 18 H7 L8 15', ''],
    warn: ['M12 3 L22 20 H2 Z M12 9 V14', 'M11 16 H13 V18.5 H11 Z'],
    hammer: ['M3.3 18.4 L12.5 9.2 L8.7 5.4 L12.9 1.2 L22.8 11.1 L18.6 15.3 L14.8 11.5 L5.6 20.7 Z', ''],
    wrench: ['M2.9 18 L11.4 9.5 L10.4 5.8 L14.3 1.9 L16.9 4.5 L14.1 7.3 L16.7 9.9 L19.5 7.1 L22.1 9.7 L18.2 13.6 L14.5 12.6 L6 21.1 Z', ''],
    medic: ['M9 3 H15 V9 H21 V15 H15 V21 H9 V15 H3 V9 H9 Z', ''],
    hp: ['M4 4 H20 V20 H4 Z M12 8 V16 M8 12 H16', ''],
    dash: ['M2 7 H10 M4 12 H13 M2 17 H10 M14 6 L21 12 L14 18', ''],
    scope: ['M3 9 H16 V15 H3 Z M16 7 H21 V17 H16 M7 15 L5 21 M12 15 L14 21', ''],
    radar: ['M12 12 V21 M8 21 H16 M8 6 L5 9.5 L8 13 M16 6 L19 9.5 L16 13 M5 3.5 L1.5 9.5 L5 15.5 M19 3.5 L22.5 9.5 L19 15.5', 'M10.5 8.5 H13.5 V11.5 H10.5 Z'],
    plus: ['M12 4 V20 M4 12 H20', ''],
    arrow: ['M3 12 H19 M13 6 L19 12 L13 18', ''],
    gunx: ['M3 10 H15 V14 H3 Z M15 8 H19 V16 H15 M4 21 L20 3', ''],
    flask: ['M9 3 H15 M10 3 V10 L4 20 H20 L14 10 V3', 'M7 16 H17 L20 20 H4 Z'],
    plane: ['', 'M12 2 L14 9 L22 14 V16 L14 13 L13 19 L16 21 V22 H8 V21 L11 19 L10 13 L2 16 V14 L10 9 Z'],
    chute: ['M2 11 L6 5 H18 L22 11 Z M2 11 L12 20 M22 11 L12 20 M12 11 V20', 'M10.5 20 H13.5 V23 H10.5 Z'],
    flare: ['M12 2 V8 M12 16 V22 M2 12 H8 M16 12 H22 M5 5 L9 9 M15 15 L19 19 M19 5 L15 9 M9 15 L5 19', ''],
    dozer: ['M3 6 V18 M3 12 H8 M8 8 H15 V14 H8 Z M7 17 H21 V20 H7 Z', ''],
    helmet: ['M4 15 L6 8 L10 4 H14 L18 8 L20 15 M2 15 H22 L20 19 H4 Z', ''],
    jeep: ['M3 15 L5 9 H14 L17 12 H21 V17 H3 Z', 'M6 17 H10 V20 H6 Z M14 17 H18 V20 H14 Z'],
    wheel: ['M8.2 3 L15.8 3 L21 8.2 L21 15.8 L15.8 21 L8.2 21 L3 15.8 L3 8.2 Z M10.7 8.8 L13.3 8.8 L15.2 10.7 L15.2 13.3 L13.3 15.2 L10.7 15.2 L8.8 13.3 L8.8 10.7 Z', ''],
    undo: ['M4 10 H17 V20 M9 5 L4 10 L9 15', ''],
    pin: ['M7 3 H17 L16 9 L19 13 H5 L8 9 Z M12 13 V21', ''],
    deny: ['M8.2 3 L15.8 3 L21 8.2 L21 15.8 L15.8 21 L8.2 21 L3 15.8 L3 8.2 Z M5.8 5.8 L18.2 18.2', ''],
    crane: ['M5 21 V3 H11 V21 M5 9 L11 3 M5 15 L11 9 M5 21 L11 15 M11 5 H22 M22 5 V11 M2 5 H5', ''],
    caret: ['', 'M4 7 H20 L12 20 Z'],
    down: ['M12 4 V19 M6 13 L12 19 L18 13', ''],
    step: ['M4 3 H9 L10 10 H4 Z M4.5 12.5 H9.5 V17 H4.5 Z M14 7 H19 L20 14 H14 Z M14.5 16.5 H19.5 V21 H14.5 Z', ''],
    dot: ['M8.4 3.5 L15.6 3.5 L20.5 8.4 L20.5 15.6 L15.6 20.5 L8.4 20.5 L3.5 15.6 L3.5 8.4 Z', 'M10 10 H14 V14 H10 Z'],
    check: ['M4 12 L10 18 L20 6', ''],
    x: ['M5 5 L19 19 M19 5 L5 19', ''],
    info: ['M4 4 H20 V20 H4 Z M12 11 V17', 'M11 7 H13 V9.2 H11 Z'],
    flag: ['M5 3 V21 M5 4 H19 L16 8 L19 12 H5', ''],
    chart: ['M4 20 V12 H8 V20 M10 20 V5 H14 V20 M16 20 V9 H20 V20 M3 21 H21', ''],
    trophy: ['M7 3 H17 V10 L12 14 L7 10 Z M7 5 H4 V8 L7 10 M17 5 H20 V8 L17 10 M12 14 V18 M8 21 H16 M9 18 H15', ''],
    clip: ['M6 5 H18 V21 H6 Z M9 3 H15 V7 H9 Z M9 12 H15 M9 16 H15', ''],
    square: ['M4 4 V20 H20 Z', 'M7 12 V17 H12 Z'],
    snow: ['M12 2 V22 M3.3 7 L20.7 17 M3.3 17 L20.7 7', ''],
    pine: ['M12 2 L18 11 H15 L20 18 H13 V22 H11 V18 H4 L9 11 H6 Z', ''],
    house: ['M3 11 L12 3 L21 11 M5 10 V21 H19 V10 M10 21 V14 H14 V21', ''],
    ruin: ['M4 21 V12 L9 8 L12 11 L16 6 L20 11 V21 Z M4 21 L9 15 L12 21', ''],
    door: ['M6 3 H18 V21 H6 Z', 'M14 11 H16 V13 H14 Z'],
    squad: ['M5 4 H9 V8 H5 Z M3 20 V15 L7 12 L11 15 V20 M15 4 H19 V8 H15 Z M13 20 V15 L17 12 L21 15 V20', ''],
    horn: ['M3 9 H8 L18 4 V20 L8 15 H3 Z M8 15 L9 21 H12 L11 16', ''],
    fwd: ['', 'M3 5 L11 12 L3 19 Z M12 5 L20 12 L12 19 Z'],
    pick: ['M2 11 L7 6 H17 L22 11 L17 9.5 H7 Z M12 9.5 V22', ''],
    kit: ['M3 8 H21 V20 H3 Z M9 8 V5 H15 V8 M3 13 H21', 'M11 12 H13 V15 H11 Z'],
    trench: ['M2 8 H8 V16 H16 V8 H22', ''],
    sandbag: ['M3 6 H21 V11 H3 Z M3 11 H21 V16 H3 Z M3 16 H21 V21 H3 Z M9 6 V11 M15 11 V16 M9 16 V21', ''],
    mine: ['M12 2.5 V6.5 M12 17.5 V21.5 M2.5 12 H6.5 M17.5 12 H21.5 M5.5 5.5 L8.5 8.5 M15.5 15.5 L18.5 18.5 M18.5 5.5 L15.5 8.5 M8.5 15.5 L5.5 18.5', 'M10 7.2 L14 7.2 L16.8 10 L16.8 14 L14 16.8 L10 16.8 L7.2 14 L7.2 10 Z'],
    bunker: ['M3 20 V9 H21 V20 Z M7 13 H17 V16 H7 Z', ''],
    inf: ['M7 8.5 L9.5 3.5 H14.5 L17 8.5 Z M4 21 V15 L8 11.5 H16 L20 15 V21 Z', ''],
    mortar: ['M6 18 L14 4 L18 6.5 L10 20.5 Z M3 21 H14', ''],
    atgun: ['M2 11 H15 V14 H2 Z M15 6 H18 V19 H15 Z M18 13 L22 20', ''],
    howitzer: ['M3 5 L5.5 2.5 L17 11 L14 15 Z M9 16 H21 V20 H9 Z', ''],
    tank: ['M2 14 H22 V20 H2 Z M7 8 H15 V14 H7 Z M15 10.5 H23', ''],
    td: ['M2 19 H21 V15 L10 9 L2 14 Z M13 12 H23', ''],
    flak: ['M10.5 2 H13.5 V13 H10.5 Z M7 13 H17 L19 21 H5 Z', ''],
  };
  const EMO2ICO = {
    '💣': 'ammo',
    '⛽': 'fuel',
    '🔧': 'wrench',
    '💰': 'gold',
    '✊': 'gold',
    '❌': 'x',
    '✕': 'x',
    '💥': 'blast',
    '✴': 'blast',
    '♨': 'flame',
    '🎯': 'target',
    '📦': 'crate',
    '🔥': 'flame',
    '🛡': 'shield',
    '🔫': 'burst',
    '⛓': 'track',
    '🎖': 'medal',
    '⚡': 'bolt',
    '⚔': 'swords',
    '🌫': 'smoke',
    '✨': 'spark',
    '♻': 'cycle',
    '🔁': 'cycle',
    '↻': 'cycle',
    '⚙': 'gear',
    '🔒': 'lock',
    '🫥': 'hidden',
    '🧨': 'charge',
    '🚀': 'rocket',
    '⚠': 'warn',
    '😨': 'warn',
    '⚒': 'hammer',
    '🔨': 'hammer',
    '🛠': 'hammer',
    '🏥': 'medic',
    '✚': 'medic',
    '🩹': 'medic',
    '💨': 'dash',
    '🏃': 'dash',
    '🏎': 'dash',
    '🔭': 'scope',
    '📡': 'radar',
    '🛰': 'radar',
    '➕': 'plus',
    '＋': 'plus',
    '➡': 'arrow',
    '➔': 'arrow',
    '🔇': 'gunx',
    '🔬': 'flask',
    '🛩': 'plane',
    '✈': 'plane',
    '🪂': 'chute',
    '🎆': 'flare',
    '🚜': 'dozer',
    '🪖': 'helmet',
    '🚙': 'jeep',
    '🛞': 'wheel',
    '↩': 'undo',
    '📌': 'pin',
    '🤫': 'deny',
    '⛔': 'deny',
    '🏗': 'crane',
    '🔻': 'caret',
    '⬇': 'down',
    '⇩': 'down',
    '↘': 'down',
    '❤': 'hp',
    '👣': 'step',
    '🔘': 'dot',
    '✔': 'check',
    '✅': 'check',
    'ⓘ': 'info',
    '🏴': 'flag',
    '🏳': 'flag',
    '🚩': 'flag',
    '📊': 'chart',
    '🏆': 'trophy',
    '📋': 'clip',
    '📐': 'square',
    '❄': 'snow',
    '🌲': 'pine',
    '🏠': 'house',
    '🏚': 'ruin',
    '🚪': 'door',
    '👥': 'squad',
    '📣': 'horn',
    '⏩': 'fwd',
    '⛏': 'pick',
    '🧰': 'kit',
    '⭐': 'star',
    '★': 'star',
    '〰': 'trench',
    '▦': 'sandbag',
    '✸': 'mine',
    '⛫': 'bunker',
  };
  const ICON_ALT = Object.keys(EMO2ICO).sort((a, b) => b.length - a.length).join('|');
  const ICON_RE_CAP = new RegExp('(' + ICON_ALT + ')[\\uFE0E\\uFE0F]?', 'gu');          // split() keeps the capture group
  const ICON_TEST = new RegExp(ICON_ALT, 'u');
  const ICON_STRIP = new RegExp('(?:' + ICON_ALT + ')[\\uFE0E\\uFE0F]?[ \\u00a0]?', 'gu');
  const stripIcons = s => String(s).replace(ICON_STRIP, '');
  const ico = (name, cls) => ICON_DEFS[name] ? `<svg class="ic ic-${name}${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-${name}"/></svg>` : '';

  // sprite (one <symbol> per icon; <use> instances inherit stroke / colour from CSS)
  document.body.insertAdjacentHTML('afterbegin',
    '<svg id="ic-sprite" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>' +
    Object.entries(ICON_DEFS).map(([n, [s, f]]) => `<symbol id="ic-${n}" viewBox="0 0 24 24">${s ? `<path d="${s}"/>` : ''}${f ? `<path d="${f}" fill="currentColor" stroke="none"/>` : ''}</symbol>`).join('') +
    '</defs></svg>');

  // ---- DOM: text nodes → <svg> (+ hidden original character) ----
  const SVGNS = 'http://www.w3.org/2000/svg';
  const ICON_SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'TITLE', 'NOSCRIPT']);
  const ICON_ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];
  function mkIco(name) {
    const s = document.createElementNS(SVGNS, 'svg'), u = document.createElementNS(SVGNS, 'use');
    s.setAttribute('class', 'ic ic-' + name); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
    u.setAttribute('href', '#ic-' + name); s.appendChild(u); return s;
  }
  function iconizeText(tn) {
    const p = tn.parentNode; if (!p || ICON_SKIP.has(p.nodeName) || (p.classList && p.classList.contains('ict'))) return;
    const v = tn.nodeValue; if (!v || !ICON_TEST.test(v)) return;
    if (p.nodeName === 'OPTION') { tn.nodeValue = stripIcons(v); return; }
    const frag = document.createDocumentFragment();
    v.split(ICON_RE_CAP).forEach((s, i) => {
      if (i % 2 === 0) { if (s) frag.appendChild(document.createTextNode(s)); return; }
      frag.appendChild(mkIco(EMO2ICO[s]));
      const g = document.createElement('u'); g.className = 'ict'; g.textContent = s; frag.appendChild(g);
    });
    p.replaceChild(frag, tn);
  }
  function stripAttrs(el) {
    if (!el.getAttribute) return;
    ICON_ATTRS.forEach(a => { const v = el.getAttribute(a); if (v && ICON_TEST.test(v)) el.setAttribute(a, stripIcons(v).trim()); });
  }
  function iconize(root) {
    if (!root) return;
    if (root.nodeType === 3) { iconizeText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1 && (ICON_SKIP.has(root.nodeName) || root.classList.contains('ict'))) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [];
    while (w.nextNode()) if (ICON_TEST.test(w.currentNode.nodeValue)) list.push(w.currentNode);
    list.forEach(iconizeText);
    if (root.nodeType === 1) { stripAttrs(root); root.querySelectorAll('[title],[placeholder],[aria-label],[alt]').forEach(stripAttrs); }
  }
  new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'childList') m.addedNodes.forEach(n => { if (n.isConnected) iconize(n); });
      else if (m.type === 'characterData') { if (m.target.isConnected) iconizeText(m.target); }
      else stripAttrs(m.target);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ICON_ATTRS });
  iconize(document.body);
  if (ICON_TEST.test(document.title)) document.title = stripIcons(document.title).trim();

  // ---- native dialogs cannot show markup ----
  ['alert', 'confirm', 'prompt'].forEach(k => { const f = window[k] && window[k].bind(window); if (f) window[k] = (m, ...a) => f(stripIcons(m), ...a); });

  // ---- canvas: same glyphs drawn from Path2D; fillText() is wrapped so text containing mapped characters
  //      (unit codes, rank stars, ✕MN, 🎯 / 🫥 markers, flag star …) is drawn as text runs + icons ----
  const ICON_P2D = {};
  function drawIco__base(c, name, cx, cy, size) {
    const d = ICON_DEFS[name]; if (!d) return;
    const P = ICON_P2D[name] || (ICON_P2D[name] = { s: d[0] ? new Path2D(d[0]) : null, f: d[1] ? new Path2D(d[1]) : null });
    c.save(); c.translate(cx - size / 2, cy - size / 2); c.scale(size / 24, size / 24);
    c.strokeStyle = c.fillStyle; c.lineWidth = Math.max(2, 22 / size); c.lineJoin = 'miter'; c.lineCap = 'butt'; c.setLineDash([]);
    if (P.f) c.fill(P.f); if (P.s) c.stroke(P.s);
    c.restore();
  }
  const _fillText = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (text, x, y) {
    if (typeof text !== 'string' || !ICON_TEST.test(text)) return _fillText.apply(this, arguments);
    const px = parseFloat((/(\d+(?:\.\d+)?)px/.exec(this.font) || [])[1]) || 10, isz = px * 1.02;
    const parts = text.split(ICON_RE_CAP).map((s, i) => i % 2 ? { ic: EMO2ICO[s] } : { t: s }).filter(p => p.ic || p.t);
    const ws = parts.map(p => p.ic ? isz : this.measureText(p.t).width), total = ws.reduce((a, b) => a + b, 0);
    const al = this.textAlign, bl = this.textBaseline;
    let sx = al === 'center' ? x - total / 2 : (al === 'right' || al === 'end') ? x - total : x;
    const cy = bl === 'middle' ? y : (bl === 'top' || bl === 'hanging') ? y + px * .5 : (bl === 'bottom' || bl === 'ideographic') ? y - px * .5 : y - px * .36;
    this.textAlign = 'left';
    parts.forEach((p, i) => { if (p.ic) drawIco(this, p.ic, sx + isz / 2, cy, isz); else _fillText.call(this, p.t, sx, y); sx += ws[i]; });
    this.textAlign = al;
  };

  // top plate resource glyphs now come from the shared set
  Object.assign(HUD_ICO, { g: ico('gold'), f: ico('fuel'), m: ico('ammo') });

  // unit-type pictograms: roster `code` strings are built from these glyphs (⤫ rifle infantry, ⎔ tank hull, ▷ gun …)
  const UNIT_GLYPH = { '⤫': 'inf', '⚒': 'hammer', '⌖': 'target', '▲': 'chute', '♨': 'flame', '⫶': 'burst', '⌒': 'mortar', '▷': 'atgun', '▰': 'howitzer', '◇': 'jeep', '⎔': 'tank', '◫': 'track', '✚': 'crate', '⚡': 'td', '⌃': 'flak', '🏥': 'medic', '🔧': 'wrench', '★': 'star', '✠': 'medal', '💥': 'blast' };
  const unitIco = code => {
    const g = [...String(code || '')].filter(ch => ch !== '\uFE0F'), n = g.filter(ch => UNIT_GLYPH[ch]).length;
    return `<u class="uc uc${Math.min(n, 3)}">` + g.map(ch => UNIT_GLYPH[ch] ? ico(UNIT_GLYPH[ch]) : `<b>${ch}</b>`).join('') + '</u>';   // <u>, not <span>: the tile CSS hides spans
  };

