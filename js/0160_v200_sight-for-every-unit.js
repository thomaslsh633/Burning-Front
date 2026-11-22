  // [v200] sight +1 for every unit; legacy (non-raw) direct-fire weapons get the range bonus here (raw weapons got it in rawWeapon)
  ['blue', 'red'].forEach(tm => Object.keys(UNIT_ROSTER[tm]).forEach(k => {
    const t = UNIT_ROSTER[tm][k];
    if (t.sight !== undefined) t.sight += V200.SIGHT_BONUS;
    const direct = !(t.isHeavy || t.isMortar || t.isArtillery || t.isNebel);
    if (!t.raw && direct && t.range > 0) t.range += V200.RANGE_BONUS;
    if (t.sub && !t.sub.raw && !t.isHeavy && t.sub.range > 0) t.sub.range += V200.RANGE_BONUS;
  }));
