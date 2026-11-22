  // [chain:vmRefreshHud] 1 layer over vmRefreshHud__base ([17c]).
  //   Call order, outermost first: vmRefreshHud → vmRefreshHud__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // vmRefreshHud: from [19], calls vmRefreshHud__base
  function vmRefreshHud() {
      const r = vmRefreshHud__base.apply(this, arguments); if (shMode() !== 'annihilation') return r;
      const x = goldBoxEl.querySelector('.vmx'); if (!x) return r;
      const nb = shAlive('blue').length, nr = shAlive('red').length, vb = shValue('blue'), vr = shValue('red'), mx = Math.max(1, vb, vr), cap = SHELL.cfg.roundCap | 0;
      x.setAttribute('aria-label', '섬멸전 현황');
      x.innerHTML = `<b class="n b">${nb}</b><span class="vs b"><i style="width:${100 * vb / mx}%"></i></span><span class="pips sh-ann">${cap ? 'R' + roundCount + '/' + cap : '섬멸'}</span><span class="vs r"><i style="width:${100 * vr / mx}%"></i></span><b class="n r">${nr}</b><span class="bl">${vm.winner ? (vm.winner === 'draw' ? '=' : 'WIN') : ''}</span>`;
      return r;
    }


