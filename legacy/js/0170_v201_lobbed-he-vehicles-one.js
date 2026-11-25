  // [v201] lobbed-HE vehicles: one multiplier over the whole range (band edges pushed past any range, so veterancy / research range never opens a far band)
  ['blue', 'red'].forEach(tm => V200.FLAT[tm].forEach(k => { const t = UNIT_ROSTER[tm][k]; if (t && t.raw) { t.closeEnd = 99; t.midEnd = 99; } }));

