  // [chain:getTerrainFillColor] 1 layer over getTerrainFillColor__base ([v162]).
  //   Call order, outermost first: getTerrainFillColor → getTerrainFillColor__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // getTerrainFillColor: from [17f], calls getTerrainFillColor__base
  function getTerrainFillColor(ter) {
    const c = getTerrainFillColor__base(ter); if (typeof c !== 'string' || c[0] !== '#') return c; let v = _tf98.get(c);
    if (!v) { const [r, g, b] = v98Rgb(c), L = .299 * r + .587 * g + .114 * b, k = .85; v = '#' + [r, g, b].map(q => Math.round(L + (q - L) * k).toString(16).padStart(2, '0')).join(''); _tf98.set(c, v); }
    return v;
  }


