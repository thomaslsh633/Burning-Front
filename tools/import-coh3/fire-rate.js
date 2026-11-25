// Fire rate: CoH3 weapon timings → whole shots per turn per range band (docs/data-labels.md §2.2).
//
// One CoH3 "magazine": n = frequency + 1 shots (a burst counts every bullet);
// time = n × (aim × aim multiplier + wind-up + wind-down + burst duration) + (n − 1) × cooldown + reload.
// raw = shots in a magazine / magazine time × fire window (6 s). Ready-aim time is not counted (sustained rate).
//
// Rules (groups in data/balance/fire-rate.json):
//   volley       small arms and every weapon not in another group: shots = round(raw × m), with the smallest whole
//                multiplier m that brings every band within the tolerance; damage and suppression per shot ÷ m.
//   single_shot  tank guns, AT guns, infantry AT (and any volley weapon slower than one shot per turn):
//                1 shot per turn, damage = round(CoH3 damage × raw).
//   artillery    howitzers, heavy artillery, mortars: CoH3 damage per shell kept. The rate is rounded up
//                (raw ≥ 1 → ceil(raw) shells; raw < 1 → 1 shell then reload_turns = floor(1 / raw) − 1) and the hit rate
//                carries the rest: accuracy_scale = raw / game rate (≤ 1), so expected damage per turn equals CoH3.
//                Further balance through reload, scatter and accuracy overrides.
//   ability      artillery slower than min_raw or needing more than max_reload_turns: fired by abilities only.
//   per_use      grenades, mines: 1 shot per use, CoH3 damage.

const avg = r => ((r?.min ?? 0) + (r?.max ?? 0)) / 2;
const mult = (m, band) => (m && typeof m[band] === 'number' ? m[band] : 1);
const isTrue = v => v === 'True' || v === true;
const round2 = x => Math.round(x * 100) / 100;

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

export function ruleOf(category, cfg) {
  for (const [rule, cats] of Object.entries(cfg.groups)) if (cats.includes(category)) return rule;
  return 'volley';
}

const worstError = (raw, m) => Math.max(...Object.values(raw).map(r => (r > 0 ? Math.abs(Math.round(r * m) / (r * m) - 1) : 0)));

/** Smallest whole multiplier m (≤ max) with every band's rounding error ≤ tolerance; else the m with the least error. */
export function volley(raw, tolerance, maxMultiplier) {
  let best = 1;
  for (let m = 1; m <= maxMultiplier; m++) {
    if (worstError(raw, m) <= tolerance + 1e-9) { best = m; break; }
    if (worstError(raw, m) < worstError(raw, best) - 1e-9) best = m;
  }
  return { m: best, shots: Object.fromEntries(Object.entries(raw).map(([b, r]) => [b, Math.round(r * best)])) };
}

/** Whole shots, damage per shot and reload for one CoH3 weapon_bag in subcategory `category`. */
export function fireRate(bag, category, cfg) {
  const damage = avg(bag.damage);
  const bands = cfg.bands;
  const raw = Object.fromEntries(bands.map(b => [b, rawShots(bag, b, cfg.window_seconds)]));
  const each = f => Object.fromEntries(bands.map(b => [b, f(b)]));
  let rule = ruleOf(category, cfg);
  const out = { rule, raw: each(b => round2(raw[b])), multiplier: 1, suppression_scale: 1, reload_turns: 0, accuracy_scale: each(() => 1) };

  if (rule === 'per_use') return { ...out, raw: each(() => null), shots_per_turn: each(() => 1), damage_per_shot: each(() => damage) };

  if (rule === 'artillery') {
    const a = cfg.artillery;
    const minRaw = Math.min(...bands.map(b => raw[b]));
    const reload = minRaw > 0 && minRaw < 1 ? Math.max(0, Math.floor(1 / minRaw) - 1) : 0;
    if (minRaw < a.min_raw || reload > a.max_reload_turns) {
      return { ...out, rule: 'ability', shots_per_turn: each(() => 1), damage_per_shot: each(() => damage) };
    }
    const shells = each(b => (minRaw < 1 ? 1 : Math.max(1, Math.ceil(raw[b] - 0.02))));
    const game = b => shells[b] / (reload + 1);
    return { ...out, shots_per_turn: shells, damage_per_shot: each(() => damage), reload_turns: reload,
      accuracy_scale: each(b => round2(Math.min(1, raw[b] / game(b)))) };
  }

  if (rule === 'volley' && bands.some(b => raw[b] < 1)) { rule = 'single_shot'; out.rule = rule; out.slower_than_one = true; }

  if (rule === 'single_shot') {
    return { ...out, shots_per_turn: each(() => 1), damage_per_shot: each(b => Math.round(damage * raw[b])) };
  }

  const v = volley(raw, cfg.volley.tolerance, cfg.volley.max_multiplier);
  return { ...out, multiplier: v.m, suppression_scale: Math.round(1000 / v.m) / 1000, shots_per_turn: v.shots,
    damage_per_shot: each(() => round2(damage / v.m)) };
}
