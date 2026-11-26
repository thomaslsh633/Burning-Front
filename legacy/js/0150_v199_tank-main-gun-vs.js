  // [v199] Tank main gun vs infantry / crews: one attack value, damage decided by how many men a shell reaches.
  //   - each man reached takes the weapon's attack (capped at his remaining HP), expected value per shell = hit chance x sum over reached men
  //   - persons are capped by the men left in the squad, and cover removes persons (not attack): yellow x0.7, hard x0.45
  //   - hit chance against soft targets is one shared table (near / mid / far) x target size, not the per-gun vehicle accuracy
  //   - lob = curved-fire support half-tracks: cover never reduces persons, minimum range 2
  const V199 = {
    ACC: [0.75, 0.60, 0.45],
    LOB_MOVED_MUL: 1,   // persons multiplier for a lob unit that moved this turn (1 = no penalty; 0.7 was proposed)
    PERSONS: {
      blue: { sherman: 2.0, chaffee: 1.5, easyeight: 1.25, pershing: 2.5, bulldozer: 3.5, m3gmc: 2.5, tank_dest: 0.75 },
      red: { panzer4: 2.0, pz4cmd: 2.0, panther: 1.25, tiger: 2.0, brummbar: 3.5, stummel: 3.0, stug: 1.25, tank_dest: 0.75 }
    },
    LOB: { blue: ['m3gmc'], red: ['stummel'] }
  };
  ['blue', 'red'].forEach(tm => {
    Object.keys(V199.PERSONS[tm]).forEach(k => { const t = UNIT_ROSTER[tm][k]; if (t && t.raw) t.persons = V199.PERSONS[tm][k]; });
    V199.LOB[tm].forEach(k => {
      const t = UNIT_ROSTER[tm][k]; if (!t) return;
      t.lob = true; t.role = 'AI'; t.className = '곡사 화력지원 하프트랙'; t.minR = Math.max(t.minR || 0, 2);
    });
  });

