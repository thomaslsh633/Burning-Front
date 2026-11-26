// Combat numbers (SPEC §1, §4, §10). Pure functions of numbers and records; no state.
import { angle } from '../hex/index.js';

/** Range band from distance and max range: thirds of the range (6 → 1-2 / 3-4 / 5-6; 7 → 1-3 / 4-5 / 6-7). */
export function band(distance, maxRange) {
  if (distance <= Math.ceil(maxRange / 3)) return 'near';
  if (distance <= Math.ceil((2 * maxRange) / 3)) return 'mid';
  return 'far';
}

/** Which armour face a shot from `fromHex` meets: angle off the target's hull facing (hit zones follow the hull, SPEC §6). */
export function armorFace(target, fromHex, arcs) {
  const diff = Math.abs(((angle(target.pos, fromHex) - target.facing * 60 + 540) % 360) - 180);
  return diff <= arcs.front ? 'front' : diff <= arcs.side ? 'side' : 'rear';
}

/** CoH3 penetration: chance = penetration ÷ armour, at most 1. */
export const penChance = (pen, armor) => (armor > 0 ? Math.min(1, pen / armor) : 1);

/** AoE damage share at `metres` from the impact, interpolated on the weapon's near / mid / far falloff. */
export function splashFactor(aoe, metres) {
  if (!aoe?.damage) return 0;
  const d = aoe.distance_m, f = aoe.damage;
  const pts = [[d.near, f.near], [d.mid, f.mid], [d.far, f.far]];
  if (metres <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x0, y0] = pts[i - 1];
    if (metres <= x1) return x1 === x0 ? y1 : y0 + ((y1 - y0) * (metres - x0)) / (x1 - x0);
  }
  return 0;
}

/** Modifiers for the target type: the first of the weapon's vs_target keys found in the member's tags. */
export function targetMods(weapon, ebps) {
  for (const [type, mods] of Object.entries(weapon.vs_target || {})) if ((ebps.tags || []).includes(type)) return mods;
  return {};
}

/** Hit chance: product of factors, at most 1. */
export const hitChance = factors => Math.min(1, factors.reduce((a, f) => a * f, 1));

/** Whole damage, at least 1 when there is any. */
export const wholeDamage = x => (x <= 0 ? 0 : Math.max(1, Math.round(x)));
