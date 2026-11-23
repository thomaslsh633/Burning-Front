  // [chain:uskPay] 2 layers over uskPay__base ([13]).
  //   Call order, outermost first: uskPay → uskPay__v47 → uskPay__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // uskPay: from [17*], calls uskPay__v47
  function uskPay(u, d, id) { if (u && id !== 'retreat') { u.skT = turnNo; if (d && d.act) v158Engage(u); } return uskPay__v47.apply(this, arguments); }

  // uskPay__v47: from [17b], calls uskPay__base
  function uskPay__v47(u, d, id, msg) { if (d.noatk) u.hasAttacked = true; return uskPay__base(u, d, id, msg); }


