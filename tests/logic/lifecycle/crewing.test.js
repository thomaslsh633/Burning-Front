import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as life from '../../../src/logic/lifecycle/index.js';
import { checkUnit } from '../../../src/logic/state/index.js';
import { exhaust } from '../../../src/logic/turn/index.js';
import { testMatch, tweak } from '../../helpers/match.js';
import { assertOwnsOnly } from '../../helpers/ownership.js';

const H = (c, r) => ({ c, r });
const killCrew = (state, id) => tweak(state, id, { members: state.units[id].members.map(m => (m.ebps.startsWith('crew_') ? { ...m, hp: 0 } : m)) });
const fiveMen = (state, id) => tweak(state, id, { members: state.units[id].members.map((m, i) => (i === 0 ? { ...m, hp: 0 } : m)) });

/** A red 75 mm gun whose crew died at (4, 4), a blue rifle squad beside it. */
function decrewed(squad = {}) {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(3, 4), ...squad }, { team: 'red', sbps: 'at_gun_75mm_ger', pos: H(4, 4) }]);
  const s = life.checkDeaths(killCrew(state, 'u2'), 'u2', data).state;
  return { state: s, data };
}

test('Recrew check: a decrewed gun next to a squad of the right size; captured as the squad\'s faction blueprint', () => {
  const { state, data } = decrewed();
  assert.equal(life.validateRecrew(state, { unit: 'u1', target: 'u2' }, data), 'wrong_squad_size', 'six riflemen: above max_squad 5');
  const five = fiveMen(state, 'u1');
  assert.equal(life.validateRecrew(five, { unit: 'u1', target: 'u2' }, data), null);
  const one = tweak(five, 'u1', { members: five.units.u1.members.map((m, i) => (i > 1 ? { ...m, hp: 0 } : m)) });
  assert.equal(life.validateRecrew(one, { unit: 'u1', target: 'u2' }, data), 'wrong_squad_size', 'one man: below min_crew 2');
  const far = tweak(five, 'u1', { pos: H(1, 4) });
  assert.equal(life.validateRecrew(far, { unit: 'u1', target: 'u2' }, data), 'too_far');
  const { state: active, data: d2 } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(3, 4) }, { team: 'red', sbps: 'at_gun_75mm_ger', pos: H(4, 4) }]);
  assert.equal(life.validateRecrew(fiveMen(active, 'u1'), { unit: 'u1', target: 'u2' }, d2), 'not_recrewable', 'a crewed gun');
});

test('only men on foot recrew: squads, or a crew that lost its gun', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'sherman_us', pos: H(3, 4) }, { team: 'red', sbps: 'at_gun_75mm_ger', pos: H(4, 4) }]);
  const s = life.checkDeaths(killCrew(state, 'u2'), 'u2', data).state;
  assert.equal(life.validateRecrew(s, { unit: 'u1', target: 'u2' }, data), 'cannot_recrew');
});

test('recrew: the gun turns ACTIVE for the squad\'s side as its blueprint, the squad becomes the crew', () => {
  const { state: s0, data } = decrewed();
  const state = fiveMen(s0, 'u1');
  const members = life.recrewMembers(state, 'u2', 'u1', data);
  assert.equal(members[0].ebps, 'tw_at_gun_75mm_ger');
  assert.deepEqual(members.slice(1).map(m => m.ebps), Array(5).fill('crew_at_gun_75mm_ger'));
  assert.ok(members.slice(1).every(m => m.hp <= data.units.ebps.crew_at_gun_75mm_ger.hp));
  const r = life.recrew(state, 'u2', 'u1', data), gun = r.state.units.u2;
  assert.deepEqual([gun.team, gun.sbps, gun.fsm.life], ['blue', 'at_gun_75mm_ger', 'ACTIVE']);
  assert.equal(r.state.units.u1, undefined);
  assert.deepEqual(r.events.map(e => e.type), ['Recrewed', 'StateChanged', 'UnitRemoved']);
  assertOwnsOnly('lifecycle', state, r.state);
});

test('abandon: a towed gun with crew and room beside it; the gun is left DECREWED', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'at_gun_57mm_us', pos: H(4, 4) }, { team: 'blue', sbps: 'hmg_30cal_us', pos: H(1, 1) }]);
  assert.equal(life.validateAbandon(state, { unit: 'u1' }, data), null);
  assert.equal(life.validateAbandon(state, { unit: 'u2' }, data), 'cannot_abandon', 'carried MG: nothing to leave');
  const { gun, crew } = life.splitCrew(state, 'u1', data);
  assert.deepEqual([gun.length, crew.length], [1, 5]);
  const spent = exhaust(state, 'u1').state;
  const r = life.abandon(spent, 'u1'), u = r.state.units.u1;
  assert.deepEqual([u.fsm.life, u.team], ['DECREWED', null]);
  assert.deepEqual(checkUnit(u), []);
  assert.equal(r.events[0].type, 'Abandoned');
  assertOwnsOnly('lifecycle', spent, r.state);
});

test('abandon needs a free hex for the crew', () => {
  const ring = [H(5, 4), H(4, 5), H(3, 5), H(3, 4), H(3, 3), H(4, 3)].map(pos => ({ team: 'blue', sbps: 'riflemen_us', pos }));
  const { state, data } = testMatch([{ team: 'blue', sbps: 'at_gun_57mm_us', pos: H(4, 4) }, ...ring]);
  assert.equal(life.freeNeighbour(state, data, 'u1'), null);
  assert.equal(life.validateAbandon(state, { unit: 'u1' }, data), 'no_room');
});

test('wreck clearing: units of a clearing role, on or next to a wreck', () => {
  const { state, data: d0 } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(3, 4) }, { team: 'blue', sbps: 'sherman_us', pos: H(4, 4) }]);
  const s = life.checkDeaths(tweak(state, 'u2', { members: state.units.u2.members.map(m => ({ ...m, hp: 0 })) }), 'u2', d0).state;
  assert.equal(life.validateClearWreck(s, { unit: 'u1', hex: H(4, 4) }, d0), 'cannot_clear', 'riflemen are not engineers');
  const data = { ...d0, units: { ...d0.units, sbps: { ...d0.units.sbps, riflemen_us: { ...d0.units.sbps.riflemen_us, role: 'engineer' } } } };
  assert.equal(life.validateClearWreck(s, { unit: 'u1', hex: H(4, 4) }, data), null);
  assert.equal(life.validateClearWreck(s, { unit: 'u1', hex: H(6, 4) }, data), 'too_far');
  assert.equal(life.validateClearWreck(s, { unit: 'u1', hex: H(3, 5) }, data), 'no_wreck');
});

test('a crew shock that cost a turn\'s action is cleared at that turn end', () => {
  const { state } = testMatch([{ team: 'blue', sbps: 'sherman_us', pos: H(3, 4) }]);
  const shocked = tweak(state, 'u1', { criticals: ['crew_shocked', 'engine_damaged'] });
  assert.equal(life.lifeTurnEnd(shocked, 'u1').state, shocked, 'shocked after its turn started: kept for the next one');
  const served = tweak(shocked, 'u1', { budget: { ...shocked.units.u1.budget, shocked: true } });
  const r = life.lifeTurnEnd(served, 'u1');
  assert.deepEqual(r.state.units.u1.criticals, ['engine_damaged']);
  assertOwnsOnly('lifecycle', served, r.state);
});

test('a crew without its gun dies without leaving a wreck', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'at_gun_57mm_us', pos: H(4, 4) }]);
  const crewOnly = tweak(state, 'u1', { members: state.units.u1.members.filter(m => m.ebps.startsWith('crew_')).map(m => ({ ...m, hp: 0 })) });
  const r = life.checkDeaths(crewOnly, 'u1', data);
  assert.equal(r.state.units.u1, undefined);
  assert.equal(r.state.map.changes.hexes['4,4'], undefined);
});

test('convert writes the blueprint only', () => {
  const { state } = testMatch([{ team: 'blue', sbps: 'hmg_30cal_us', pos: H(3, 4) }]);
  const r = life.convert(state, 'u1', 'mortar_81mm_us');
  assert.equal(r.state.units.u1.sbps, 'mortar_81mm_us');
  assertOwnsOnly('lifecycle', state, r.state);
});
