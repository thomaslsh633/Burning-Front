// Fire rate: CoH3 weapon timings → whole shots per turn per range band (docs/data-labels.md §2.2).
//
// One CoH3 "magazine": n = frequency + 1 shots (a burst counts every bullet);
// time = n × (aim × aim multiplier + wind-up + wind-down + burst duration) + (n − 1) × cooldown + reload.
// raw = shots in a magazine / magazine time × fire window (6 s). Ready-aim time is not counted (sustained rate).
//
// Rules (groups in data/balance/fire-rate.json):
//   volley       small arms and every weapon not in another group: whole damage per shot d (≤ CoH3 damage, ≥ damage / 6)
//                and shots = round(raw × damage / d); the largest d within the tolerance; suppression per shot × d / damage.
//   single_shot  tank guns, AT guns, infantry AT (and any volley weapon slower than one shot per turn):
//                1 shot per turn, damage = round(CoH3 damage × raw) (`decimals` in the settings, 0 = whole numbers).
//   artillery    howitzers, heavy artillery, mortars: CoH3 damage per shell kept. The rate is rounded up
//                (raw ≥ 1 → ceil(raw) shells; raw < 1 → 1 shell then reload_turns = floor(1 / raw) − 1) and the hit rate
//                carries the rest: accuracy_scale = raw / game rate (≤ 1), so expected damage per turn equals CoH3.
//                Further balance through reload, scatter and accuracy overrides.
//   ability      artillery slower than min_raw or needing more than max_reload_turns: fired by abilities only.
//   per_use      grenades, mines: 1 shot per use, CoH3 damage.

import { classOf, normalFire, minRangeHex } from './indirect.js';
import { avg, isTrue, r2 } from '../lib/coh3.js';

const mult = (m, band) => (m && typeof m[band] === 'number' ? m[band] : 1);
const roundTo = (x, d) => Math.round(x * 10 ** d) / 10 ** d;

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

const worstError = (raw, damage, d, shots) =>
  Math.max(...Object.keys(raw).map(b => (raw[b] > 0 ? Math.abs((shots[b] * d) / (raw[b] * damage) - 1) : 0)));

/**
 * Whole damage per shot d and whole shots per band: d goes from round(damage) down to damage / maxMultiplier;
 * shots = round(raw × damage / d). The largest d whose worst band is within the tolerance wins; if none is,
 * the d with the smallest worst error. Damage per turn (shots × d) stays as close to CoH3 as whole numbers allow.
 */
export function volley(raw, damage, tolerance, maxMultiplier) {
  const bands = Object.keys(raw);
  const shotsFor = d => Object.fromEntries(bands.map(b => [b, Math.max(1, Math.round((raw[b] * damage) / d))]));
  if (!(damage > 0)) return { damage: 0, shots: Object.fromEntries(bands.map(b => [b, Math.max(1, Math.round(raw[b]))])) };
  const top = Math.max(1, Math.round(damage)), low = Math.max(1, Math.ceil(damage / maxMultiplier - 1e-9));
  let best = null;
  for (let d = top; d >= low; d--) {
    const shots = shotsFor(d), err = worstError(raw, damage, d, shots);
    if (err <= tolerance + 1e-9) return { damage: d, shots };
    if (!best || err < best.err - 1e-9) best = { damage: d, shots, err };
  }
  return { damage: best.damage, shots: best.shots };
}

/** Whole shots, damage per shot and reload for one CoH3 weapon_bag in subcategory `category`. */
export function fireRate(bag, category, cfg, id = '') {
  const damage = avg(bag.damage);
  const bands = cfg.bands;
  const raw = Object.fromEntries(bands.map(b => [b, rawShots(bag, b, cfg.window_seconds)]));
  const each = f => Object.fromEntries(bands.map(b => [b, f(b)]));
  let rule = ruleOf(category, cfg);
  const out = { rule, raw: each(b => r2(raw[b])), multiplier: 1, suppression_scale: 1, reload_turns: 0, accuracy_scale: each(() => 1) };

  if (rule === 'per_use') return { ...out, raw: each(() => null), shots_per_turn: each(() => 1), damage_per_shot: each(() => damage) };

  if (rule === 'artillery') {
    const a = cfg.artillery;
    const minRaw = Math.min(...bands.map(b => raw[b]));
    const reload = minRaw > 0 && minRaw < 1 ? Math.max(0, Math.floor(1 / minRaw) - 1) : 0;
    if (minRaw < a.min_raw || reload > a.max_reload_turns) {
      return { ...out, rule: 'ability', shots_per_turn: each(() => 1), damage_per_shot: each(() => damage) };
    }
    // indirect class cadence (data/balance/indirect.json): one volley every usage_turns, spread, range cap
    const cls = cfg.indirect ? classOf(id, cfg.indirect) : null;
    if (cls) {
      const per = each(b => normalFire(raw[b], cls));
      return { ...out, indirect_class: cls.id, shots_per_turn: each(b => per[b].shells), damage_per_shot: each(() => damage),
        reload_turns: cls.usage_turns - 1, accuracy_scale: each(b => per[b].accuracy_scale), spread_hex: cls.spread_hex,
        range_hex: Math.min(Math.round((bag.range?.max ?? 0) / cls.metres_per_hex), cls.range_cap_hex),
        min_range_hex: minRangeHex(bag.range?.min ?? 0, bag.range?.max ?? 0, cls) };
    }
    const shells = each(b => (minRaw < 1 ? 1 : Math.max(1, Math.ceil(raw[b] - 0.02))));
    const game = b => shells[b] / (reload + 1);
    return { ...out, shots_per_turn: shells, damage_per_shot: each(() => damage), reload_turns: reload,
      accuracy_scale: each(b => r2(Math.min(1, raw[b] / game(b)))) };
  }

  if (rule === 'volley' && bands.some(b => raw[b] < 1)) { rule = 'single_shot'; out.rule = rule; out.slower_than_one = true; }

  if (rule === 'single_shot') {
    return { ...out, shots_per_turn: each(() => 1), damage_per_shot: each(b => roundTo(damage * raw[b], cfg.decimals ?? 0)) };
  }

  const v = volley(raw, damage, cfg.volley.tolerance, cfg.volley.max_multiplier);
  const scale = damage > 0 ? v.damage / damage : 1;
  return { ...out, multiplier: damage > 0 ? r2(damage / v.damage) : 1, suppression_scale: r2(scale), shots_per_turn: v.shots,
    damage_per_shot: each(() => v.damage) };
}
