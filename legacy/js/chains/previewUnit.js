  // [chain:previewUnit] 3 layers over previewUnit__base ([12]).
  //   Call order, outermost first: previewUnit → previewUnit__v48 → previewUnit__s16 → previewUnit__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // previewUnit: from [17i], calls previewUnit__v48
  function previewUnit(key) { const r = previewUnit__v48.apply(this, arguments); const i = document.querySelector('#buy-preview .pv-h i'), im = v101Img(key, currentTurn, 'pv'); if (i && im) i.innerHTML = im; return r; }

  // previewUnit__v48: from [17b], calls previewUnit__s16
  function previewUnit__v48(key) {
    previewUnit__s16(key);
    const tm = currentTurn, ids = Object.keys(VPKG).filter(id => VPKG[id].keys[tm].includes(key)); if (!ids.length) return;
    const ex = document.querySelector('#buy-preview .pv-ex'); if (!ex) return;
    ex.style.display = ''; ex.insertAdjacentHTML('beforeend', `${ex.innerHTML ? '<span class="dot">·</span>' : ''}🧰 업그레이드(택1) ${ids.map(id => vpN(id, tm)).join(' / ')}`);
  }

  // previewUnit__s16: from [16], calls previewUnit__base
  function previewUnit__s16(key) {
    previewUnit__base(key);
    const tm = currentTurn, box = document.getElementById('buy-preview'), w = (WPN3[tm] || {})[key];
    const sk = ((UNIT_SK[tm] || {})[key] || []).filter(id => USK[id]);
    const pk = Object.keys(PKG).filter(k => PKG[k].keys[tm].includes(key));
    const parts = [];
    if (w) parts.push(`🔫 <b>${w.n}</b>${SHELL_KEYS.includes(key) ? ' (탄종 전환)' : ''}`);
    { const t0 = UNIT_ROSTER[tm][key]; if (t0 && t0.sub) parts.push(`🔸 부무장 <b>${t0.sub.n}</b> (${t0.sub.raw ? '턴당 ' + rofTxt(t0.sub) : '연사×' + t0.sub.rof} · 사거리 ${t0.sub.range})`); }
    if (sk.length) parts.push(`✨ ${sk.map(id => `<b>${nm3(USK[id], tm)}</b>`).join(', ')}`);
    if (pk.length) parts.push(`🧰 ${pk.map(k => PKG[k].n).join(', ')}`);
    const ex = box.querySelector('.pv-ex'); if (ex) { ex.innerHTML = parts.join('<span class="dot">·</span>'); if (!parts.length) ex.style.display = 'none'; }
  }


