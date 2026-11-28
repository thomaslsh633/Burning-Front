// Which weapons a unit fires and whether one can reach a target.
import { distance, arcContains } from '../hex/index.js';
import { hasLineOfSight } from '../vision/index.js';

const SLOTS = ['main', 'secondary'];
const alive = m => m.hp > 0;

/**
 * Weapons that fire in an attack: [{ weapon (record), id }]. Squads: every living member's main / secondary weapon.
 * Carried team weapons (HMG, mortar): the crew's weapon once, while any crew lives (crew carbines stay quiet).
 * Towed guns: the gun entity's weapons while it and a crewman live; a crew whose gun is gone (destroyed or abandoned)
 * fights as a small infantry squad with its own small arms. A damaged main gun does not fire.
 */
export function firingWeapons(unit, data) {
  const sq = data.units.sbps[unit.sbps], tw = sq.team_weapon, c = data.balance.combat;
  const usable = id => {
    const w = data.units.weapon[id];
    return w && !c.no_fire_rules.includes(w.fire_rule) && !c.no_fire_categories.includes(w.category) ? { id, weapon: w } : null;
  };
  const fromEntity = (ebpsId, count = 1) => (data.units.ebps[ebpsId]?.weapons || [])
    .filter(w => SLOTS.includes(w.slot) && !(w.slot === 'main' && unit.criticals.includes('main_gun_damaged')))
    .flatMap(w => Array.from({ length: count }, () => usable(w.weapon))).filter(Boolean)
    .map(x => ({ ...x, mount: data.units.ebps[ebpsId].weapons.find(w => w.weapon === x.id)?.mount ?? 'hull' }));
  if (tw) {
    const crewAlive = unit.members.some(m => m.ebps === tw.crew_entity && alive(m));
    if (!crewAlive) return [];
    if (tw.weapon) { const x = usable(tw.weapon); return x ? [{ ...x, mount: 'fixed' }] : []; }
    if (unit.members.some(m => m.ebps === tw.weapon_entity && alive(m))) return fromEntity(tw.weapon_entity);
    return unit.members.filter(m => m.ebps === tw.crew_entity && alive(m)).flatMap(m => fromEntity(m.ebps));
  }
  // loadout weapons (CoH3 spawn-granted, e.g. a bazooka team's bazookas): the first `num` living models fire them instead of
  // their entity's main weapon, keeping their secondary
  const living = unit.members.filter(alive), out = [];
  let i = 0;
  const kits = (unit.upgrades || []).flatMap(id => (data.units.upgrade[id]?.effects || []).filter(e => e.type === 'add_weapon').map(e => ({ weapon: e.weapon, num: 1 })));
  for (const lw of [...kits, ...(sq.loadout_weapons || [])]) {   // a kit's weapon goes to one model, instead of its main weapon
    for (let k = 0; k < lw.num && i < living.length; k++, i++) {
      const x = usable(lw.weapon);
      if (x) out.push({ ...x, mount: 'hull' });
      out.push(...fromEntity(living[i].ebps).filter(w => data.units.ebps[living[i].ebps].weapons?.find(e => e.weapon === w.id)?.slot !== 'main'));
    }
  }
  return [...out, ...living.slice(i).flatMap(m => fromEntity(m.ebps))];
}

/** Can this weapon fire at that hex now? → reason or null. Range, minimum range, arc, line of sight, move and emplace rules. */
export function weaponReach(state, data, unit, w, targetHex) {
  const a = w.weapon.attack, d = distance(unit.pos, targetHex);
  if (d > a.range_hex.max) return 'out_of_range';
  if (d < (a.range_hex.min ?? 0)) return 'too_close';
  const facing = w.mount === 'turret' ? unit.turretFacing : unit.facing;
  if (unit.fsm.location !== 'GARRISONED' && !arcContains(unit.pos, facing, a.arc_deg ?? 360, targetHex)) return 'out_of_arc';   // a building's windows face every way
  if (unit.budget.moved && w.weapon.moving && !w.weapon.moving.can_fire) return 'cannot_fire_after_moving';
  if ((w.weapon.traits || []).includes('emplace_required') && unit.kind === 'team_weapon' && unit.fsm.stance !== 'EMPLACED') return 'must_emplace';
  const indirect = a.fire_mode === 'indirect' || (w.weapon.traits || []).includes('ignores_blockers');
  if (!indirect && !hasLineOfSight(state, data, unit, targetHex)) return 'no_line_of_sight';
  return null;
}
