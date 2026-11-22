  // [chain:statusLineHtml] 1 layer over statusLineHtml__base ([11]).
  //   Call order, outermost first: statusLineHtml → statusLineHtml__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // statusLineHtml: from [11], calls statusLineHtml__base
  function statusLineHtml(u) { let s = statusLineHtml__base(u); const b = buffTxt(u); if (b) s += (s ? ' | ' : '<br>') + `<span style="color:#a5b4fc">✨ ${b}</span>`; return s; }


