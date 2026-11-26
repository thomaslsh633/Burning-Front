  // [chain:v105Icon] 1 layer over v105Icon__base ([17m]).
  //   Call order, outermost first: v105Icon → v105Icon__base
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // v105Icon: from [17p], calls v105Icon__base
  function v105Icon(team, key) {
      const id = team + ':' + key, g = V115_GUN[id] || (id === 'blue:priest' ? { mk: 'm7', iS: 30 } : null);   // the M7 without its crew
      if (!g) return v105Icon__base(team, key);
      if (V105.ico.has(id)) return V105.ico.get(id);
      let c = null; try { c = v105MeshSil(g.mk + '_v', 'olive', g.sq ? 96 : 192, 96, g.iS || 30); } catch (e) { c = null; }
      V105.ico.set(id, c); return c;
    }


