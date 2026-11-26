// Stance axis for team weapons (docs/unit-state.md §5.2, SPEC §5). Owns fsm.stance and timers.stance.
// Setup / teardown turns: the team weapon's weapon emplace data, else data/balance/scale.json emplace.
import { defineMachine, transition } from '../fsm/index.js';
import { putUnit } from '../state/index.js';
import { ev } from '../events/index.js';

const NOT_WHILE = reason => Object.fromEntries(['Move', 'Turn', 'Attack', 'AttackFeature', 'Emplace', 'Pack', 'Board', 'Hold'].map(c => [c, reason]));

export const STANCE = defineMachine('stance', 'MOBILE', {
  MOBILE: { denies: { Pack: 'not_emplaced', Hold: 'not_emplaced' } },
  SETTING_UP: { denies: NOT_WHILE('setting_up') },
  EMPLACED: { denies: { Move: 'emplaced', Turn: 'emplaced', Emplace: 'already_emplaced', Board: 'emplaced' } },
  PACKING_UP: { denies: NOT_WHILE('packing_up') },
});

/** The weapon that decides the team weapon's setup (its carried weapon, or the gun's main weapon). */
function crewWeapon(unit, data) {
  const tw = data.units.sbps[unit.sbps]?.team_weapon;
  if (!tw) return null;
  const id = tw.weapon ?? data.units.ebps[tw.weapon_entity]?.weapons?.find(w => w.slot === 'main')?.weapon;
  return data.units.weapon[id] ?? null;
}

export const setupTurns = (unit, data) => crewWeapon(unit, data)?.emplace?.setup_turns ?? data.balance.scale.emplace.setup_turns;
export const teardownTurns = (unit, data) => crewWeapon(unit, data)?.emplace?.teardown_turns ?? data.balance.scale.emplace.teardown_turns;
const needsEmplace = (unit, data) => (crewWeapon(unit, data)?.traits || []).includes('emplace_required');

export function validateEmplace(state, cmd) {
  return state.units[cmd.unit].kind === 'team_weapon' ? null : 'cannot_emplace';
}

/** Start setting up; EMPLACED at the own turn start after setup_turns (fires from the turn after emplacing, SPEC §5). */
export function emplace(state, unitId, data) {
  const u = state.units[unitId];
  const t = transition(STANCE, { ...u, timers: { ...u.timers, stance: setupTurns(u, data) } }, 'SETTING_UP');
  return { state: putUnit(state, t.unit), events: [ev('Emplacing', { unit: unitId }), ...t.events] };
}

/** A crew that fired this turn cannot pack up (SPEC §5). */
export function validatePack(state, cmd) {
  return state.units[cmd.unit].budget.fired ? 'fired_this_turn' : null;
}

export function pack(state, unitId, data) {
  const u = state.units[unitId];
  const t = transition(STANCE, { ...u, timers: { ...u.timers, stance: teardownTurns(u, data) } }, 'PACKING_UP');
  return { state: putUnit(state, t.unit), events: [ev('Packing', { unit: unitId }), ...t.events] };
}

/** Own turn start: count down setup / teardown. */
export function crewTurnStart(state, unitId) {
  const u = state.units[unitId];
  if (!['SETTING_UP', 'PACKING_UP'].includes(u.fsm.stance)) return { state, events: [] };
  const left = u.timers.stance - 1, done = left <= 0;
  const next = { ...u, timers: { ...u.timers, stance: Math.max(0, left) } };
  if (!done) return { state: putUnit(state, next), events: [] };
  const to = u.fsm.stance === 'SETTING_UP' ? 'EMPLACED' : 'MOBILE';
  const t = transition(STANCE, next, to);
  return { state: putUnit(state, t.unit), events: [ev(to === 'EMPLACED' ? 'Emplaced' : 'Packed', { unit: unitId }), ...t.events] };
}

/** Own turn end: teardown 0 finishes now; packed crews that must emplace to fire set up by themselves (SPEC §5). */
export function crewTurnEnd(state, unitId, data) {
  const u = state.units[unitId];
  if (u.kind !== 'team_weapon' || u.fsm.life !== 'ACTIVE') return { state, events: [] };
  if (u.fsm.stance === 'PACKING_UP' && u.timers.stance <= 0) {
    const t = transition(STANCE, u, 'MOBILE');
    return { state: putUnit(state, t.unit), events: [ev('Packed', { unit: unitId }), ...t.events] };
  }
  if (u.fsm.stance === 'MOBILE' && data.balance.crew.auto_emplace_at_turn_end && needsEmplace(u, data) && u.fsm.location === 'ON_MAP') return emplace(state, unitId, data);
  return { state, events: [] };
}
