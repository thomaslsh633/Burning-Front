  // [chain:tileOf] 1 layer over tileOf__base ([16]).
  //   Call order, outermost first: tileOf → tileOf__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // tileOf: from [19], calls tileOf__base
  function tileOf(b) {   // the price shows on the ability tile like munition does
      const r = tileOf__base.apply(this, arguments); if (b && b.dataset && b.dataset.shc) { r[1].insertAdjacentHTML('beforeend', `<b class="tc sh-price">${b.dataset.shc}</b>`); r[1].dataset.shc = b.dataset.shc; }
      return r; }


