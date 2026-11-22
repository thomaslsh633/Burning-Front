  // [chain:showAttackPreview] 1 layer over showAttackPreview__base ([16]).
  //   Call order, outermost first: showAttackPreview → showAttackPreview__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // showAttackPreview: from [17s], calls showAttackPreview__base
  function showAttackPreview(att, def) {
    const out = showAttackPreview__base.apply(this, arguments);
    try {
      V130.pv = v130PreviewList(att, def);
      const nc = V130.pv.filter(i => i.cone).length;
      if (nc) combatPreviewBanner.insertAdjacentHTML('beforeend', `<div style="font-size:10px;color:#fbbf24">🔫 부채꼴 사격: 주변 적 ${nc}기에 피해 ${Math.round(V130.coneK * 100)}% · 제압</div>`);
      v129Kick();
    } catch (e) { V130.pv = null; }
    return out;
  }


