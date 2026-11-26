  // [v162] Unit stat reset to CoH3 raw values. 1 hex = 7 m, 1 turn = 10 s.
  //   Rate of fire: shots in 6 s per turn. Whole shots are fired; the fraction carries over to the next turn.
  //   Movement is relative to infantry: 3.6 m/s = 4 hexes per turn, every other unit by its speed ratio.
  //   Ratios are CoH3's exactly; the engine keeps one internal scale so buildings, skills and healing stay tuned:
  //   HP / damage x RAW.HPK, penetration / armour x RAW.PENK. Stat screens show the raw values.
  //   A hit lands on one squad member and never carries over to the next (no overkill); HE adds splash on the others.
  const RAW = { HPK: 0.36, PENK: 0.12, HEX_M: 7, TURN_S: 10, FIRE_S: 6, MISS_AOE: 0.5, INF_SPD: 3.6, INF_MOVE: 4 };   // movement: infantry (3.6 m/s) = 4 hexes, others by speed ratio
  const rawR2 = x => Math.round(x * 100) / 100;
