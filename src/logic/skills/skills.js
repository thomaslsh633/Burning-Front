// Abilities (SPEC §10, 2026-11-28): an ability fires its own weapon `shells` times at a hex (each shell lands there or within
// the spread and hits whatever stands where it lands) or at a unit, paid in resources, once per cooldown. Owns cooldowns.
// Data: data.units.ability (CoH3 abilities that fire a weapon; buffs, toggles, smoke and off-map strikes are not built).
import { putUnit } from '../state/index.js';
import { inside, key } from '../hex/index.js';
import { canAttack, weaponReach } from '../combat/index.js';
import { visibleHexes } from '../vision/index.js';
import { canAfford, requirementsMet } from '../economy/index.js';

/** Ability ids the unit has that the rules can play (an ability record exists). */
export const abilitiesOf = (unit, data) => (data.units.sbps[unit.sbps].abilities || []).filter(id => data.units.ability[id]);

/** The ability's weapon as combat fires it: the CoH3 weapon with the ability's shells, accuracy, range and spread. */
export function abilityWeapon(unit, abilityId, data) {
  const ab = data.units.ability[abilityId], w = data.units.weapon[ab.weapon], per = v => ({ near: v, mid: v, far: v });
  const own = unit.members.flatMap(m => data.units.ebps[m.ebps]?.weapons || []).find(x => x.weapon === ab.weapon);
  return { id: ab.weapon, mount: own?.mount ?? 'hull', weapon: { ...w,
    attack: { fire_mode: ab.target === 'hex' ? 'indirect' : 'direct', accuracy: ab.accuracy, range_hex: ab.range_hex,
      shots_per_turn: per(ab.shells), damage_per_shot: per(w.damage), arc_deg: w.attack?.arc_deg ?? 360, ...(w.attack?.vs_cover ? { vs_cover: w.attack.vs_cover } : {}) },
    indirect: { ...(w.indirect || {}), spread_hex: ab.spread_hex } } };
}

/** What combat needs for this use: { weapons, hex? }. */
export const useOf = (state, cmd, data) => ({ weapons: [abilityWeapon(state.units[cmd.unit], cmd.ability, data)], ...(cmd.hex ? { hex: cmd.hex } : {}) });

/**
 * UseSkill command: { unit, ability, hex } (hex abilities) or { unit, ability, target } (unit abilities). The unit has the
 * ability, it is not cooling down, its CoH3 requirements are met (research, the squad's upgrades, veterancy rank), the cost
 * is in hand, and the weapon reaches: a hex in range (seen, unless the ability may fire into the fog), or an enemy it may
 * attack. → reason or null
 */
export function validateUseSkill(state, cmd, data) {
  const u = state.units[cmd.unit], ab = data.units.ability[cmd.ability];
  const notReady = skillReady(state, u, cmd.ability, data);
  if (notReady) return notReady;
  const use = useOf(state, cmd, data);
  if (ab.target === 'unit') return cmd.target ? canAttack(state, data, cmd.unit, cmd.target, use) : 'no_target';
  if (!cmd.hex || !inside(cmd.hex, state.map.cols, state.map.rows)) return 'bad_hex';
  if (!ab.fog && !visibleHexes(state, data, u.team).has(key(cmd.hex))) return 'hex_not_seen';
  return weaponReach(state, data, u, use.weapons[0], cmd.hex);
}

/** Can the unit use this ability now, before a target is chosen? → reason or null */
export function skillReady(state, u, abilityId, data) {
  const ab = data.units.ability[abilityId];
  if (!ab || !abilitiesOf(u, data).includes(abilityId)) return 'no_such_ability';
  if ((u.cooldowns[abilityId] ?? 0) > 0) return 'cooling_down';
  const r = ab.requires ?? {};
  if (!requirementsMet(state, data, u.team, { upgrades: r.upgrades }) || !(r.squad_upgrades || []).every(x => u.upgrades.includes(x))) return 'needs_unlock';
  if (u.rank < (r.rank ?? 0)) return 'needs_rank';
  return canAfford(state, u.team, ab.cost ?? {}) ? null : 'cannot_afford';
}

/** After a use: the ability waits its cooldown (own turns). */
export function startCooldown(state, unitId, abilityId, data) {
  const u = state.units[unitId];
  return { state: putUnit(state, { ...u, cooldowns: { ...u.cooldowns, [abilityId]: data.units.ability[abilityId].cooldown_turns } }), events: [] };
}

/** Own turn start: every cooldown one turn shorter (the one used last turn is ready after cooldown_turns turns). */
export function tickCooldowns(state, unitId) {
  const u = state.units[unitId], left = Object.entries(u.cooldowns).filter(([, t]) => t > 1).map(([id, t]) => [id, t - 1]);
  if (!Object.keys(u.cooldowns).length) return { state, events: [] };
  return { state: putUnit(state, { ...u, cooldowns: Object.fromEntries(left) }), events: [] };
}
