import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as build from '../../../src/logic/build/index.js';
import { apply } from '../../../src/logic/commands/index.js';
import { canAttack } from '../../../src/logic/combat/index.js';
import { checkUnit } from '../../../src/logic/state/index.js';
import { createRng } from '../../../src/services/rng/index.js';
import { testMatch } from '../../helpers/match.js';
import * as lifecycle from '../../../src/logic/lifecycle/index.js';
import { assertOwnsOnly } from '../../helpers/ownership.js';

const H = (c, r) => ({ c, r });
const run = (s, d, cmd) => { const r = apply(s, cmd, d, createRng(1)); if (r.error) throw new Error(`${cmd.type}: ${r.error}`); for (const u of Object.values(r.state.units)) assert.deepEqual(checkUnit(u), [], u.id); return r; };
const nextOwnTurn = (s, d) => run(run(s, d, { type: 'EndTurn', side: 'blue' }).state, d, { type: 'EndTurn', side: 'red' }).state;

test('an engineer builds a fighting position: a half-HP site for 2 turns, then a hold a squad can enter', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'engineer_us', pos: H(3, 3) }, { team: 'blue', sbps: 'riflemen_us', pos: H(5, 3) },
    { team: 'red', sbps: 'grenadier_ger', pos: H(4, 6) }], { points: [{ id: 'p', kind: 'fuel', hex: '2,3', radius: 0 }] });
  const cmd = x => ({ type: 'Build', side: 'blue', unit: 'u1', sbps: 'fighting_position_us', hex: H(4, 3), ...x });
  assert.ok(build.buildable(state.units.u1, data).includes('fighting_position_us'), 'on the CoH3 build menu');
  assert.equal(build.validateBuild(state, cmd({ sbps: 'bunker_ger' }), data), 'cannot_build');
  assert.equal(build.validateBuild(state, cmd({ hex: H(3, 3) }), data), 'too_far', 'never on its own hex');
  assert.equal(build.validateBuild(state, cmd({ hex: H(6, 3) }), data), 'too_far');
  assert.equal(build.validateBuild(state, cmd({ hex: H(2, 3) }), data), 'bad_hex', 'not on a capture point');
  assert.equal(build.validateBuild(state, cmd({ hex: H(5, 3) }), data), 'hex_occupied');
  const a = run(state, data, cmd());
  const site = a.state.units.u4;
  assert.deepEqual([site.sbps, site.team, site.fsm.life, site.timers.build, site.members[0].hp], ['fighting_position_us', 'blue', 'CONSTRUCTING', 1, 320]);
  assert.equal(a.state.teams.blue.resources.manpower, 500);
  assert.equal(apply(a.state, { type: 'Board', side: 'blue', unit: 'u2', vehicle: 'u4' }, data, createRng(1)).error, 'no_room_inside', 'not built yet');
  assert.equal(canAttack({ ...a.state, match: { ...a.state.match, side: 'red' } }, data, 'u3', 'u4'), null, 'a site can be shot');
  const b = run(nextOwnTurn(a.state, data), data, { type: 'Build', side: 'blue', unit: 'u1', site: 'u4' });
  assert.deepEqual([b.state.units.u4.fsm.life, b.state.units.u4.members[0].hp], ['ACTIVE', 640]);
  const c = run(b.state, data, { type: 'Board', side: 'blue', unit: 'u2', vehicle: 'u4' });
  assert.equal(c.state.units.u2.container, 'u4');
  assertOwnsOnly('build', a.state, build.work(a.state, 'u4').state);
});

test('a site shot to nothing is gone without a wreck', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'engineer_us', pos: H(3, 3) }]);
  const a = run(state, data, { type: 'Build', side: 'blue', unit: 'u1', sbps: 'fighting_position_us', hex: H(4, 3) }).state;
  const dead = { ...a, units: { ...a.units, u2: { ...a.units.u2, members: [{ ...a.units.u2.members[0], hp: 0 }] } } };
  const { checkDeaths } = lifecycle;
  assert.equal(checkDeaths(dead, 'u2', data).state.units.u2, undefined);
});
