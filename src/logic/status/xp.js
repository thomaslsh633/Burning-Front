// Veterancy (CoH3 ranks, data/units veterancy sets): XP = share of the victim's HP destroyed × its price, then ranks at
// the CoH3 thresholds. Owns xp and rank. Rank modifiers are read by combat (received / weapon accuracy, attack speed).
import { putUnit } from '../state/index.js';
import { ev } from '../events/index.js';

/** Price used as XP value: manpower + munitions + fuel of the squad. */
export const unitValue = (unit, data) => Object.values(data.units.sbps[unit.sbps]?.price?.cost || {}).reduce((a, b) => a + b, 0);

/** XP an attacker earns for `damage` HP taken from the victim. */
export function xpFor(victim, damage, data) {
  const full = data.units.sbps[victim.sbps].members.reduce((s, m) => s + m.count * (data.units.ebps[m.entity]?.hp ?? 0), 0);
  return full ? Math.round((damage / full) * unitValue(victim, data) * data.balance.status.xp.per_value_destroyed) : 0;
}

export function gainXp(state, unitId, xp, data) {
  const u = state.units[unitId];
  if (!u || xp <= 0) return { state, events: [] };
  const set = data.units.veterancy[data.units.sbps[u.sbps]?.veterancy?.set];
  const total = u.xp + xp, rank = set ? set.xp.filter(t => total >= t).length : 0;
  const events = rank > u.rank ? [ev('RankGained', { unit: unitId, rank })] : [];
  return { state: putUnit(state, { ...u, xp: total, rank }), events };
}

/** Modifiers of the unit's current rank, multiplied together ({ received_accuracy, weapon_accuracy, attack_speed, … }). */
export function rankMods(unit, data) {
  const set = data.units.veterancy[data.units.sbps[unit.sbps]?.veterancy?.set];
  const out = {};
  for (const r of (set?.ranks || []).slice(0, unit.rank)) for (const [k, v] of Object.entries(r)) out[k] = k.endsWith('_add') ? (out[k] ?? 0) + v : (out[k] ?? 1) * v;
  return out;
}
