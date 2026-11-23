  // [chain:calcDamage] 4 layers over calcDamage__base ([11]).
  //   Call order, outermost first: calcDamage → calcDamage__v159 → calcDamage__v47 → calcDamage__v46 → calcDamage__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // calcDamage: from [v179], calls calcDamage__v159
  function calcDamage(att, def, preview) {
      const r = calcDamage__v159.apply(this, arguments);
      if (!preview && att && def && att.id !== undefined && def.id !== undefined && r) V179.res.set(att.id + '>' + def.id, r);
      return r;
    }

  // calcDamage__v159: from [17+6], calls calcDamage__v47
  function calcDamage__v159(att, def) {
      const r = calcDamage__v47.apply(this, arguments);
      if (r && v159Crew(def) && v159Emplaced(def) && att && att.team !== def.team) {
        const m = x => x > 0 ? Math.max(1, Math.round(x * V159.dmg)) : x;
        r.damage = m(r.damage); if (r.mainDmg !== undefined) r.mainDmg = m(r.mainDmg); if (r.subDmg !== undefined) r.subDmg = m(r.subDmg);
        r.penDmgOut = m(r.penDmgOut); r.deflDmgOut = m(r.deflDmgOut); r.specialNote = (r.specialNote || '') + ' [거치 −10%]';
      }
      return r;
    }

  // calcDamage__v47: from [17b], calls calcDamage__v46
  function calcDamage__v47(att, def, preview = false) { pasSync(att); pasSync(def); return calcDamage__v46(att, def, preview); }

  // calcDamage__v46: from [17b], calls calcDamage__base
  function calcDamage__v46(att, def, preview = false) { return calcDamage__base(att, def, preview); }


