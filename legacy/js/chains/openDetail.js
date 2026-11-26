  // [chain:openDetail] 1 layer over openDetail__base ([16]).
  //   Call order, outermost first: openDetail → openDetail__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // openDetail: from [17b], calls openDetail__base
  function openDetail() {
    openDetail__base.apply(this, arguments);
    const u = selectedUnit, rows = u ? pasRows(u) : []; if (!rows.length) return;
    document.getElementById('detail-body').insertAdjacentHTML('beforeend', `<div class="set-group"><h3>패시브</h3><dl class="kv">${rows.map(({ P, on }) => `<dt>${P.ico} ${P.n}</dt><dd>${P.d} · ${on ? '적용 중' : '대기'}</dd>`).join('')}</dl></div>`);
  }


