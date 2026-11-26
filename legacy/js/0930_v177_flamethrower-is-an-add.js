  // ══════════════════════════════════════════════════════════════
  // [v177] Flamethrower is an add-on weapon, not a unit: units carrying the flame kit (u.sub, e.g. the engineer's flame_kit)
  //   play the flame motion for the kit on top of their normal fire. Only when the target is inside the kit's reach.
  // ══════════════════════════════════════════════════════════════
  const v177Kit = u => !!(u.sub && !u.isFlamer && (u.sub.noCover || /화염|Flammenwerfer|flame/i.test(u.sub.n || '')));
  {  /* v174Attack: layer moved to js/chains/v174Attack.js */ }


  // flame jet: a thick stream of soft blobs (white-yellow at the nozzle, orange, then dark red) that widens along the way
  /* v174Flame: layer moved to js/chains/v174Flame.js */

