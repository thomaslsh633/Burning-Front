  // ══════════════════════════════════════════════════════════════
  // [17)] v151 — continuous roads · straight wall runs · player buildings and emplacements at the hex scale
  //   · roads (Faymonville): drawn from the map's road polylines (FAY2.roads) as one smoothed ribbon each — dirt shoulder,
  //     gravel bed, two wheel ruts, a grassy crown on the lanes — instead of per-hex stubs; road cells keep their rules and
  //     the ground under them keeps its natural colour
  //   · walls: low walls and balustrades from the yellow cover lines are drawn as one straight run along the original line,
  //     cut into 4 m pieces (exact angle, sorted per piece); each piece shows the damage stage of its nearest edge
  //   · player buildings: footprint by size (HQ 3 hexes, production 2, outpost / doctrine 1) and drawn at the map scale over
  //     the footprint; multi-hex buildings are placed from the engineer's 2nd ring outward, never on the engineer's hex;
  //     construction needs an engineer within 2 hexes of the footprint
  //   · bunkers and emplacements: sprites limited to one hex
  // ══════════════════════════════════════════════════════════════
  const V151 = { roadCol: { road: [170, 154, 122], roadEdge: [124, 108, 82], rut: [132, 114, 86], roadMid: [188, 176, 146], dirt: [128, 110, 82], crown: [104, 116, 66] },
    FP: { hq: 3, barracks: 2, support_center: 2, motor_pool: 2, air_coy: 2, tank_depot: 2, outpost: 1, doc_inf: 1, doc_mech: 1, doc_air: 1 },
    LEN: { 1: 6.4, 2: 12.5, 3: 15.5 }, emplPx: 1.2, emplBigPx: 3, runs: [], runEdges: new Set(), pend: null };
  Object.assign(V149.gravel, V151.roadCol);
