  // [chain:v99BldTop] 2 layers over v99BldTop__base ([17g]).
  //   Call order, outermost first: v99BldTop → v99BldTop__v133 → v99BldTop__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v99BldTop: from [v168], calls v99BldTop__v133
  function v99BldTop(b) { const t = v99BldTop__v133.apply(this, arguments); return b && BLD[b.type] && V99 && V99.on ? t * v151Geo(b).k : t; }

  // v99BldTop__v133: from [17v], calls v99BldTop__base
  function v99BldTop__v133(b) {
    if (V99 && V99.on && b && b.team) { const e = V133.cache.get(b.team + ':' + b.type + '|' + v133Face(b)); if (e) return e.top / HZ + 3; }
    return v99BldTop__base(b);
  }


