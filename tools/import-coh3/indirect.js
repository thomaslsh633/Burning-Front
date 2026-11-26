// Indirect fire for turn-based play: cadence (one volley every usage_turns), shells per volley, range cap and spread.
// Settings: data/balance/indirect.json. SPEC §10.
//   normal fire  shells = ceil(CoH3 shells per turn × usage_turns), reload_turns = usage_turns − 1,
//                accuracy_scale = exact ÷ shells, so expected damage per turn equals CoH3; shell damage unchanged.
//   barrage      shells = ceil(CoH3 shells × usage_turns × 10 s ÷ CoH3 recharge), never more than CoH3 fires;
//                accuracy_scale carries the rounding; shell damage unchanged.
//   range        round(CoH3 metres ÷ 7), capped per class.   spread  each shell lands on a random hex within spread_hex.

const r2 = x => Math.round(x * 100) / 100;
export const TURN_SECONDS = 10;

/** Indirect class of a weapon / ability / squad id, or null. */
export function classOf(id, cfg) {
  for (const [cls, c] of Object.entries(cfg.classes)) if (c.patterns.some(p => id.includes(p))) return { id: cls, ...c };
  return null;
}

export const rangeHex = (metres, cls) => Math.min(Math.round((metres ?? 0) / 7), cls?.range_cap_hex ?? Infinity);

export function normalFire(rawPerTurn, cls) {
  const exact = rawPerTurn * cls.usage_turns;
  const shells = Math.max(1, Math.ceil(exact - 0.02));
  return { usage_turns: cls.usage_turns, reload_turns: cls.usage_turns - 1, shells, accuracy_scale: r2(Math.min(1, exact / shells)), spread_hex: cls.spread_hex };
}

export function barrageUse({ shells, recharge_s }, cls) {
  const exact = recharge_s > 0 ? (shells * cls.usage_turns * TURN_SECONDS) / recharge_s : shells;
  const n = Math.min(shells, Math.max(1, Math.ceil(exact - 0.02)));
  return { usage_turns: cls.usage_turns, shells: n, accuracy_scale: r2(Math.min(1, exact / n)), spread_hex: cls.spread_hex };
}
