  // [chain:v105Status] 1 layer over v105Status__base ([17m]).
  //   Call order, outermost first: v105Status → v105Status__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v105Status: from [19], calls v105Status__base
  function v105Status(u, own) {
      const r = v105Status__base.apply(this, arguments); if (!r || r[0] !== 'nofire') return r;
      if (own && u.maxAmmo > 0 && u.ammo / u.maxAmmo <= .2) return ['amm', u.ammo <= 0 ? '#ef4444' : '#fb923c'];
      if (own && u.hasFuel && u.maxFuel > 0 && u.fuel / u.maxFuel <= .2) return ['fue', u.fuel <= 0 ? '#ef4444' : '#fb923c'];
      return null;
    }


