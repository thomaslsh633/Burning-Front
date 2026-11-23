  // [chain:v129Eject] 1 layer over v129Eject__base ([17r]).
  //   Call order, outermost first: v129Eject → v129Eject__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v129Eject: from [v181], calls v129Eject__base
  function v129Eject() {
      const pend = []; units.forEach(v => { if (v.hp <= 0 && v.cargo && v.cargo.length) v.cargo.forEach(q => pend.push({ q, a: { c: v.c, r: v.r }, fa: q.facingAngle })); });
      const r = v129Eject__base.apply(this, arguments);
      pend.forEach(x => { if (x.q.hp > 0 && !x.q.isLoaded && (x.q.c !== x.a.c || x.q.r !== x.a.r)) v181Walk(x.q, x.a, { fa0: x.fa, emerge: true }); });
      return r;
    }


