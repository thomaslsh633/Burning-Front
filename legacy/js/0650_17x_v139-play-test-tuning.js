  // ══════════════════════════════════════════════════════════════
  // [17+] v139 — play-test tuning
  //   · movement: move 1–4 → +1 (infantry 4 → 5), 5–7 → +2, 8+ → +3 · capturing a point takes one more turn
  //   · Faymonville at 0.75 scale: 48×48 map, 36 × 48 playable, HQs 32 hexes apart; VP zones radius 2
  //   · manpower: HQ base 150, manpower points 80, munition / fuel points +15 manpower
  //   · light vehicles (jeep, Weasel, Kettenkrad): damage to vehicles ×4 · infantry and tanks +20 % HP
  //   · veterancy: XP for damage dealt (+1 per 10 % of the target's HP) and +1 for surviving a hit; thresholds −30 %
  //   · retreat: straight to the nearest rally point (HQ, or an outpost in a supplied sector) in one turn; the unit sits out
  //     its next turn; outposts reinforce within 2 hexes
  //   · heavy weapons dropped off by a vehicle cannot fire that turn (setting up) · Flak 36 / 38: no firing arc, no turning
  // ══════════════════════════════════════════════════════════════
  var V139 = { capT: 2 }, FS = { c0: 6, kx: .045, ky: .0495, r0: 0, s: 1 };
