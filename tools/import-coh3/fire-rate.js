// Fire rate: CoH3 weapon timings → whole shots per turn per range band (decision K, docs/data-labels.md §2.2).
//
// One CoH3 "magazine": n = frequency + 1 shots (each shot is one burst for burst weapons);
// time = n × (aim × aim multiplier + wind-up + wind-down + burst duration) + (n − 1) × cooldown + reload.
// Raw shots per turn = shots in a magazine / magazine time × fire window (6 s, data/balance/fire-rate.json).
// Ready-aim time (first shot at a new target) is not counted: the rate is the sustained rate.
//
// Applied to the game as whole numbers:
//   ordinary weapons   shots = round(raw), damage unchanged
//   single-shot        (tank guns, AT guns, infantry AT, or any weapon slower than one shot per turn)
//                      shots = 1, damage = round(CoH3 damage × raw), so damage per turn keeps the CoH3 rate.
//   per use            (grenades, mines: fired by an ability or a trigger) shots = 1, damage unchanged.

const avg = r => ((r?.min ?? 0) + (r?.max ?? 0)) / 2;
const mult = (m, band) => (m && typeof m[band] === 'number' ? m[band] : 1);
const isTrue = v => v === 'True' || v === true;

export function magazineTime(bag, band) {
  const n = avg(bag.reload?.frequency) + 1;
  const burst = isTrue(bag.burst?.can_burst) ? avg(bag.burst.duration) * mult(bag.burst.duration_multiplier, band) : 0;
  const perShot = avg(bag.aim?.fire_aim_time) * mult(bag.aim?.aim_time_multiplier, band)
    + (bag.fire?.wind_up ?? 0) + (bag.fire?.wind_down ?? 0) + burst;
  const cooldown = avg(bag.cooldown?.duration) * mult(bag.cooldown?.duration_multiplier, band);
  const reload = avg(bag.reload?.duration) * mult(bag.reload?.duration_multiplier, band);
  const bullets = isTrue(bag.burst?.can_burst) ? burst * avg(bag.burst.rate_of_fire) * mult(bag.burst.rate_of_fire_multiplier, band) : 1;
  return { shots: n * bullets, time: n * perShot + (n - 1) * cooldown + reload };
}

export function rawShots(bag, band, windowSeconds) {
  const { shots, time } = magazineTime(bag, band);
  return time > 0 ? (shots / time) * windowSeconds : 0;
}

const round2 = x => Math.round(x * 100) / 100;

export function applyRate(raw, damage, singleShot) {
  if (singleShot || raw < 1) return { shots: 1, correction: round2(raw), damage: Math.round(damage * raw) };
  return { shots: Math.round(raw), correction: 1, damage };
}

/** Whole shots and damage per band for one CoH3 weapon_bag in subcategory `category`. */
export function fireRate(bag, category, cfg) {
  const damage = avg(bag.damage);
  const single = cfg.single_shot_categories.includes(category);
  const perUse = (cfg.per_use_categories || []).includes(category);
  const out = { raw: {}, shots_per_turn: {}, damage_per_shot: {}, correction: {}, single_shot: single, auto_single_shot: false, per_use: perUse };
  for (const band of cfg.bands) {
    if (perUse) { out.raw[band] = null; out.shots_per_turn[band] = 1; out.damage_per_shot[band] = damage; out.correction[band] = 1; continue; }
    const raw = rawShots(bag, band, cfg.window_seconds);
    const r = applyRate(raw, damage, single);
    if (!single && raw < 1) out.auto_single_shot = true;
    out.raw[band] = round2(raw);
    out.shots_per_turn[band] = r.shots;
    out.damage_per_shot[band] = r.damage;
    out.correction[band] = r.correction;
  }
  return out;
}
