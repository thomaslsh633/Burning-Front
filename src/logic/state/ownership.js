// Which logic system may write each field of a unit's runtime state (docs/unit-state.md §7).
// Every other system reads the field, sends an event, or calls the owner's public function.
// A field with no owner here may not be written yet: the system that needs it adds its row (and the §7 row) first.

/** Unit field path → owning system (folder under src/logic/). A path owns everything below it. */
export const UNIT_FIELD_OWNERS = {
  'fsm.action': 'turn', budget: 'turn', overwatch: 'turn',
  'fsm.stance': 'crew', 'timers.stance': 'crew',
  'fsm.location': 'transport', container: 'transport',
  'fsm.morale': 'status', suppression: 'status', retreatTo: 'status',
  'fsm.life': 'lifecycle', criticals: 'lifecycle', crew: 'lifecycle', team: 'lifecycle',
  'fsm.visibility': 'vision', 'timers.revealedUntil': 'vision',
  pos: 'movement', facing: 'movement', turretFacing: 'movement',
  members: 'combat', ammo: 'combat',
};

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Dotted paths whose values differ between two plain objects; arrays and leaves compare as a whole. */
export function changedPaths(a, b, prefix = '') {
  const out = [];
  for (const k of new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])) {
    const p = prefix + k, x = a?.[k], y = b?.[k];
    if (isObject(x) && isObject(y)) out.push(...changedPaths(x, y, `${p}.`));
    else if (JSON.stringify(x) !== JSON.stringify(y)) out.push(p);
  }
  return out;
}

/** Owner of a field path: the longest owned prefix, or null. */
export function ownerOf(path) {
  const parts = path.split('.');
  for (let i = parts.length; i > 0; i--) {
    const owner = UNIT_FIELD_OWNERS[parts.slice(0, i).join('.')];
    if (owner) return owner;
  }
  return null;
}

/** Changes `system` made to a unit that it does not own → [{ path, owner }] (owner null: nobody owns it yet). */
export function foreignWrites(system, before, after) {
  return changedPaths(before, after).map(path => ({ path, owner: ownerOf(path) })).filter(w => w.owner !== system);
}
