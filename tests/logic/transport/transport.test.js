import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as transport from '../../../src/logic/transport/index.js';
import { apply } from '../../../src/logic/commands/index.js';
import { canAttack, firingWeapons } from '../../../src/logic/combat/index.js';
import { coverAgainst } from '../../../src/logic/vision/index.js';
import { checkUnit } from '../../../src/logic/state/index.js';
import { createRng } from '../../../src/services/rng/index.js';
import { testMatch, tweak } from '../../helpers/match.js';
import { assertOwnsOnly } from '../../helpers/ownership.js';

const H = (c, r) => ({ c, r });
const blue = (sbps, pos, x = {}) => ({ team: 'blue', sbps, pos, ...x });
const red = (sbps, pos, x = {}) => ({ team: 'red', sbps, pos, ...x });
const HOUSE = { structures: [{ id: 'h', kind: 'house', hexes: ['5,5'] }] };
const run = (s, d, cmd) => { const r = apply(s, cmd, d, createRng(1)); if (r.error) throw new Error(`${cmd.type}: ${r.error}`); for (const u of Object.values(r.state.units)) assert.deepEqual(checkUnit(u), [], u.id); return r; };

test('slots: a squad 1, a carried (small) team weapon 1, towed guns and vehicles none', () => {
  const { state, data } = testMatch([blue('riflemen_us', H(1, 1)), blue('hmg_30cal_us', H(2, 1)), blue('at_gun_57mm_us', H(3, 1)), blue('sherman_us', H(4, 1))]);
  assert.deepEqual(['u1', 'u2', 'u3', 'u4'].map(id => transport.slotsOf(state.units[id], data)), [1, 1, null, null]);
});

test('Garrison: next to a house, room for one squad; inside: garrison cover, fires all round, cannot be entered by the enemy', () => {
  const { state, data } = testMatch([blue('riflemen_us', H(4, 5), { facing: 3 }), blue('riflemen_us', H(6, 5)), red('grenadier_ger', H(5, 6)), red('grenadier_ger', H(8, 5))], HOUSE);
  const r = run(state, data, { type: 'Garrison', side: 'blue', unit: 'u1', building: 'h' });
  const u = r.state.units.u1;
  assert.deepEqual([u.fsm.location, u.container, u.pos, u.budget.move], ['GARRISONED', 'h', H(5, 5), 0]);
  assert.equal(coverAgainst(r.state, data, u, H(8, 5)), 'garrison');
  assert.equal(canAttack(r.state, data, 'u1', 'u4'), null, 'facing west, firing east from the windows');
  assert.equal(apply(r.state, { type: 'Garrison', side: 'blue', unit: 'u2', building: 'h' }, data, createRng(1)).error, 'full');
  assert.equal(apply(r.state, { type: 'Move', side: 'blue', unit: 'u1', to: H(4, 4) }, data, createRng(1)).error, 'garrisoned');
  assert.equal(transport.validateEnter({ ...r.state, match: { ...r.state.match, side: 'red' } }, { unit: 'u3', into: 'h' }, data), 'held_by_enemy');
  assertOwnsOnly('transport', state, transport.enter(state, 'u1', 'h', data).state);
});

test('buildings take squads and MG teams, not mortars; an MG sets up inside', () => {
  const { state, data } = testMatch([blue('hmg_30cal_us', H(4, 5)), blue('mortar_81mm_us', H(6, 5))], HOUSE);
  assert.equal(transport.validateEnter(state, { unit: 'u2', into: 'h' }, data), 'cannot_go_inside');
  const r = run(state, data, { type: 'Garrison', side: 'blue', unit: 'u1', building: 'h' });
  assert.equal(r.state.units.u1.container, 'h', 'an MG team takes one slot: a house holds it');
  assert.equal(apply(r.state, { type: 'Emplace', side: 'blue', unit: 'u1' }, data, createRng(1)).error, undefined);
});

test('Board, ride, Exit, Unload: passengers move with the transport, cannot fire and cannot be shot', () => {
  const { state, data } = testMatch([blue('halftrack_us', H(4, 4)), blue('riflemen_us', H(3, 4)), blue('hmg_30cal_us', H(5, 4)), red('grenadier_ger', H(6, 7)), blue('riflemen_us', H(4, 3))]);
  const a = run(state, data, { type: 'Board', side: 'blue', unit: 'u2', vehicle: 'u1' });
  assert.deepEqual([a.state.units.u2.fsm.location, a.state.units.u2.container], ['LOADED', 'u1']);
  const full = run(a.state, data, { type: 'Board', side: 'blue', unit: 'u3', vehicle: 'u1' }).state;
  assert.equal(apply(full, { type: 'Board', side: 'blue', unit: 'u5', vehicle: 'u1' }, data, createRng(1)).error, 'full', 'a squad and an MG team fill 2 slots');
  assert.equal(canAttack({ ...a.state, match: { ...a.state.match, side: 'red' } }, data, 'u4', 'u2'), 'not_a_target');
  assert.equal(apply(a.state, { type: 'Attack', side: 'blue', unit: 'u2', target: 'u4' }, data, createRng(1)).error, 'loaded');
  const b = run(a.state, data, { type: 'Move', side: 'blue', unit: 'u1', to: H(4, 6) });
  assert.deepEqual(b.state.units.u2.pos, H(4, 6), 'rides along');
  const own = run(run(b.state, data, { type: 'EndTurn', side: 'blue' }).state, data, { type: 'EndTurn', side: 'red' }).state;
  const c = run(own, data, { type: 'Exit', side: 'blue', unit: 'u2', hex: H(3, 6) });
  assert.deepEqual([c.state.units.u2.fsm.location, c.state.units.u2.pos, c.state.units.u2.budget.move], ['ON_MAP', H(3, 6), 3]);
  const d = run(run(state, data, { type: 'Board', side: 'blue', unit: 'u3', vehicle: 'u1' }).state, data, { type: 'Unload', side: 'blue', unit: 'u1' });
  assert.equal(d.state.units.u3.fsm.location, 'ON_MAP', 'an MG team rides in a half-track');
  assert.equal(apply(d.state, { type: 'Unload', side: 'blue', unit: 'u1' }, data, createRng(1)).error, 'empty');
});

test('a destroyed transport: its passengers get out beside the wreck with half their models', () => {
  const { state: s0, data } = testMatch([blue('halftrack_us', H(4, 4)), blue('riflemen_us', H(3, 4)), red('sherman_us', H(7, 4), { facing: 3 })]);
  let s = run(s0, data, { type: 'Board', side: 'blue', unit: 'u2', vehicle: 'u1' }).state;
  s = tweak(s, 'u1', { members: s.units.u1.members.map(m => ({ ...m, hp: 1 })) });
  s = { ...s, match: { ...s.match, side: 'red' }, units: { ...s.units, u3: { ...s.units.u3, fsm: { ...s.units.u3.fsm, action: 'IDLE' }, budget: { ...s.units.u3.budget, action: 1 } } } };
  let r;
  for (let seed = 1; seed < 30 && (!r || r.state.units.u1); seed++) r = apply(s, { type: 'Attack', side: 'red', unit: 'u3', target: 'u1' }, data, createRng(seed));
  assert.equal(r.state.units.u1, undefined, 'the half-track is destroyed');
  const p = r.state.units.u2;
  assert.deepEqual([p.fsm.location, p.container], ['ON_MAP', null]);
  assert.equal(p.members.filter(m => m.hp > 0).length, 3, 'CoH3 percent_unload_on_death 0.5 of 6');
  assert.deepEqual(checkUnit(p), []);
});
