// Indirect fire for turn-based play: cadence (one volley every usage_turns), shells per volley, range cap and spread.
// Settings: data/balance/indirect.json. SPEC §10.
//   normal fire  shells = ceil(CoH3 shells per turn × usage_turns), reload_turns = usage_turns − 1,
//                accuracy_scale = exact ÷ shells, so expected damage per turn equals CoH3; shell damage unchanged.
//   barrage      shells = ceil(CoH3 shells × usage_turns × seconds_per_turn ÷ CoH3 recharge), never more than CoH3 fires;
//                accuracy_scale carries the rounding; shell damage unchanged.
//   range        round(CoH3 metres ÷ metres_per_hex), capped per class (scale from data/balance/scale.json).   spread  each shell lands on a random hex within spread_hex.
//   min range    round(CoH3 min ÷ CoH3 max × our range), at least the class floor (ranges are compressed, so is the minimum).
//   max_shells   caps a normal-fire volley (rockets); damage per turn then falls below CoH3 (accuracy cannot exceed 1).
//   blind fire   target hex not seen by the firing side: accuracy ÷ (CoH3 fow_angle × fow_distance multipliers),
//                spread + blind.extra_spread_hex. A sound-ranged hex (an enemy indirect weapon fired from it) is not blind.
import { r2 } from '../lib/coh3.js';

/** Indirect class of a weapon / ability / squad id, or null. */
export function classOf(id, cfg) {
  for (const [cls, c] of Object.entries(cfg.classes)) if (c.patterns.some(p => id.includes(p))) {
    return { id: cls, ...c, metres_per_hex: cfg.scale.metres_per_hex, seconds_per_turn: cfg.scale.seconds_per_turn };
  }
  return null;
}

export const rangeHex = (metres, cls) => Math.min(Math.round((metres ?? 0) / cls.metres_per_hex), cls.range_cap_hex ?? Infinity);

export function minRangeHex(minMetres, maxMetres, cls) {
  const max = rangeHex(maxMetres, cls);
  const scaled = maxMetres > 0 ? Math.round(((minMetres ?? 0) / maxMetres) * max) : 0;
  return Math.max(scaled, cls?.min_range_floor_hex ?? 0);
}

export function normalFire(rawPerTurn, cls) {
  const exact = rawPerTurn * cls.usage_turns;
  const shells = Math.min(cls.max_shells ?? Infinity, Math.max(1, Math.ceil(exact - 0.02)));
  return { usage_turns: cls.usage_turns, reload_turns: cls.usage_turns - 1, shells, accuracy_scale: r2(Math.min(1, exact / shells)), spread_hex: cls.spread_hex };
}

export function barrageUse({ shells, recharge_s }, cls) {
  const exact = recharge_s > 0 ? (shells * cls.usage_turns * cls.seconds_per_turn) / recharge_s : shells;
  const n = Math.min(shells, Math.max(1, Math.ceil(exact - 0.02)));
  return { usage_turns: cls.usage_turns, shells: n, accuracy_scale: r2(Math.min(1, exact / n)), spread_hex: cls.spread_hex };
}

/** Accuracy and spread when firing at a hex the firing side does not see; soundRanged = counter-battery mark on that hex. */
export function blindFire(bag, cls, cfg, soundRanged) {
  if (soundRanged) return { accuracy_scale: 1, spread_hex: cls.spread_hex };
  const d = cfg.blind?.default_fow_multiplier ?? 1;
  const a = bag?.scatter?.fow_angle_multiplier || d, b = bag?.scatter?.fow_distance_multiplier || d;
  return { accuracy_scale: r2(1 / (a * b)), spread_hex: cls.spread_hex + (cfg.blind?.extra_spread_hex ?? 0) };
}
