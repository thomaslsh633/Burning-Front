// Who a unit's members are changes only by damage (attack.js) or by a crew change: a crew leaving its gun (abandon) or a
// squad taking it over (recrew). Writes only members.
import { putUnit } from '../state/index.js';
import { ev } from '../events/index.js';

/** Replace a unit's members: [{ ebps, hp }]. */
export function setMembers(state, unitId, members) {
  const u = state.units[unitId];
  return { state: putUnit(state, { ...u, members: members.map(m => ({ ebps: m.ebps, hp: m.hp })) }), events: [] };
}

/** A bought upgrade (weapon kit) is fitted: its weapons replace models' main weapons (firingWeapons). */
export function addUpgrade(state, unitId, upgradeId) {
  const u = state.units[unitId];
  return { state: putUnit(state, { ...u, upgrades: [...u.upgrades, upgradeId] }), events: [ev('UpgradeFitted', { unit: unitId, upgrade: upgradeId })] };
}
