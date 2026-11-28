// A unit's runtime state (docs/unit-state.md §4): plain, serialisable, changed only by its owning systems.
// Definitions (HP, weapons, move points …) stay in the data and are looked up by `sbps` / `members[].ebps`.

export const AXES = Object.freeze(['life', 'location', 'stance', 'morale', 'action', 'visibility']);

/**
 * spec: { id, team, sbps, pos, facing?, stance?, members? } · data: { units: { sbps, ebps } } (services/data indexUnits).
 * members: carried-over members with their HP (a crew leaving its gun); default the blueprint's, at full HP.
 * A new unit has spent its turn (EXHAUSTED, empty budget); the turn system gives it a budget at its side's turn start.
 * Team weapons may start EMPLACED (game start, SPEC §5); everything else starts MOBILE.
 */
export function createUnit(spec, data) {
  const def = data.units.sbps[spec.sbps];
  if (!def) throw new Error(`unknown squad ${spec.sbps}`);
  const members = spec.members ? spec.members.map(m => ({ ebps: m.ebps, hp: m.hp })) : def.members.flatMap(m => {
    const e = data.units.ebps[m.entity];
    if (!e) throw new Error(`squad ${spec.sbps}: unknown entity ${m.entity}`);
    return Array.from({ length: m.count }, () => ({ ebps: m.entity, hp: e.hp }));
  });
  const facing = spec.facing ?? 0;
  return {
    id: spec.id, team: spec.team, sbps: spec.sbps, kind: def.kind,
    pos: { c: spec.pos.c, r: spec.pos.r }, facing, turretFacing: facing,
    members, ammo: def.supply?.ammo ?? 0, xp: 0, rank: 0,
    fsm: { life: 'ACTIVE', location: 'ON_MAP', stance: def.kind === 'team_weapon' ? spec.stance ?? 'MOBILE' : 'MOBILE',
      morale: 'NORMAL', action: 'EXHAUSTED', visibility: 'REVEALED' },
    budget: { move: 0, action: 0, counter: 0, moved: false, fired: false },
    suppression: 0, engaged: false, upgrades: [], criticals: [], timers: { stance: 0, smoke: 0, revealedUntil: 0, reload: 0, build: 0 },
    overwatch: null, container: null, crew: null, retreatTo: null, marks: {},
  };
}

/** Invariant violations of one unit (docs/unit-state.md §4); empty when consistent. */
export function checkUnit(u) {
  const bad = [];
  const inside = ['GARRISONED', 'LOADED'].includes(u.fsm.location);
  if ((u.container != null) !== inside) bad.push('container set ⇔ location GARRISONED or LOADED');
  if (u.fsm.stance !== 'MOBILE' && u.kind !== 'team_weapon') bad.push('only team weapons leave stance MOBILE');
  if ((u.overwatch != null) !== (u.fsm.action === 'OVERWATCH')) bad.push('overwatch set ⇔ action OVERWATCH');
  if (u.fsm.life !== 'ACTIVE' && (u.fsm.action !== 'EXHAUSTED' || u.budget.move || u.budget.action || u.budget.counter)) {
    bad.push('a unit that is not ACTIVE is EXHAUSTED with no budget');
  }
  if (u.members.some(m => m.hp < 0)) bad.push('member HP is never negative');
  if (u.ammo < 0) bad.push('ammo is never negative');
  return bad;
}
