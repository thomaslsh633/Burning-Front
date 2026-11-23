  // [chain:showTileInfo] 3 layers over showTileInfo__base ([16]).
  //   Call order, outermost first: showTileInfo → showTileInfo__s16_2 → showTileInfo__s16 → showTileInfo__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // showTileInfo: from [17&], calls showTileInfo__s16_2
  function showTileInfo(c, r) { V147.sel = v147StructAt(c, r); V147.selTap = performance.now(); return showTileInfo__s16_2.apply(this, arguments); }

  // showTileInfo__s16_2: from [16], calls showTileInfo__s16
  function showTileInfo__s16_2(c, r, ter, pt) {
    showTileInfo__s16(c, r, ter, pt); unitInfoEl.style.display = 'none';
    if (pt) unitStrip.insertAdjacentHTML('beforeend', `<div class="us-row" style="color:#38bdf8">${cpTipText(pt)}</div>`);
    syncCard();
  }

  // showTileInfo__s16: from [16], calls showTileInfo__base
  function showTileInfo__s16(c, r, ter, pt) {
    showTileInfo__base(c, r, ter, pt); renderTileStrip(ter, c, r); syncBuildTray(null);
    
  }


