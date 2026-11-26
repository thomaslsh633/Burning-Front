// Who a unit's members are changes only by damage (attack.js) or by a crew change: a crew leaving its gun (abandon) or a
// squad taking it over (recrew). Writes only members.
import { putUnit } from '../state/index.js';

/** Replace a unit's members: [{ ebps, hp }]. */
export function setMembers(state, unitId, members) {
  const u = state.units[unitId];
  return { state: putUnit(state, { ...u, members: members.map(m => ({ ebps: m.ebps, hp: m.hp })) }), events: [] };
}
