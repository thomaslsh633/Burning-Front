import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as capture from '../../../src/logic/capture/index.js';
import { testMatch, tweak } from '../../helpers/match.js';

const H = (c, r) => ({ c, r });
const POINT = { points: [{ id: 'p', kind: 'fuel', hex: '5,5', radius: 1 }] };
const kill = (state, id, n) => tweak(state, id, { members: state.units[id].members.map((m, i) => (i >= n ? { ...m, hp: 0 } : m)) });
const point = s => s.points[0];

test('capture power: the squad\'s CoH3 capture rate, whatever its size; not pinned, retreating, unarmed or vehicles', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(5, 5) }, { team: 'blue', sbps: 'sherman_us', pos: H(1, 1) }], POINT);
  assert.equal(capture.capturePower(state.units.u1, data), 1.25, 'riflemen');
  assert.equal(capture.capturePower(kill(state, 'u1', 1).units.u1, data), 1.25, 'one man left: still the squad\'s rate');
  assert.equal(capture.capturePower({ ...state.units.u1, fsm: { ...state.units.u1.fsm, morale: 'PINNED' } }, data), 0);
  assert.equal(capture.capturePower(state.units.u2, data), 0);
  assert.equal(capture.contests(state.units.u2, data), true, 'an armed vehicle contests');
  assert.equal(capture.contests({ ...state.units.u1, fsm: { ...state.units.u1.fsm, morale: 'PINNED' } }, data), true, 'pinned infantry contests');
});

test('every map point starts neutral', () => {
  const { state } = testMatch([], POINT);
  assert.deepEqual(state.points, [{ id: 'p', owner: null, progress: 0, by: null }]);
});

test('one squad takes 2 ticks for a neutral point, two squads 1; at most one step per tick', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(5, 5) }], POINT);
  const t1 = capture.captureTick(state, data, 'blue');
  assert.deepEqual(point(t1.state), { id: 'p', owner: null, progress: 1.25, by: 'blue' });
  assert.deepEqual(t1.events, [{ type: 'PointProgress', point: 'p', team: 'blue', progress: 1.25, of: 2 }]);
  const t2 = capture.captureTick(t1.state, data, 'blue');
  assert.deepEqual([point(t2.state).owner, t2.events[0].type], ['blue', 'PointCaptured']);
  const { state: two } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(5, 5) }, { team: 'blue', sbps: 'riflemen_us', pos: H(5, 4) }, { team: 'blue', sbps: 'riflemen_us', pos: H(4, 5) }], POINT);
  assert.equal(point(capture.captureTick(two, data, 'blue').state).owner, 'blue', 'two or more squads: one turn');
  const enemy = { ...two, points: [{ id: 'p', owner: 'red', progress: 0, by: null }] };
  const n = capture.captureTick(enemy, data, 'blue');
  assert.deepEqual([point(n.state).owner, n.events[0].type], [null, 'PointNeutralised'], 'three squads: one step, not two');
});

test('contested: an armed enemy in the zone freezes progress; leaving the zone loses it', () => {
  const { state: s0, data } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(5, 5) }, { team: 'red', sbps: 'grenadier_ger', pos: H(5, 4) }], POINT);
  const started = { ...s0, points: [{ id: 'p', owner: null, progress: 1, by: 'blue' }] };
  assert.deepEqual(point(capture.captureTick(started, data, 'blue').state), point(started));
  const left = tweak(started, 'u1', { pos: H(1, 1) });
  assert.deepEqual(point(capture.captureTick(left, data, 'blue').state), { id: 'p', owner: null, progress: 0, by: null });
});

test('supply: without sectors every owned point pays; with sectors only those linked to the HQ through own sectors', () => {
  const map = {
    cols: 12, rows: 4,
    structures: [{ id: 'hq', kind: 'hq', team: 'blue', hexes: ['0,1'] }],
    points: [{ id: 'a', kind: 'fuel', hex: '4,1', radius: 0 }, { id: 'b', kind: 'fuel', hex: '8,1', radius: 0 }],
    sectors: [0, 1, 2].map(i => ({ id: `s${i}`, hexes: [0, 1, 2, 3].flatMap(c => [0, 1, 2, 3].map(r => `${i * 4 + c},${r}`)) })),
  };
  const { state, data } = testMatch([], map);
  const both = { ...state, points: [{ id: 'a', owner: 'blue', progress: 0, by: null }, { id: 'b', owner: 'blue', progress: 0, by: null }] };
  assert.deepEqual([...capture.suppliedPoints(both, data, 'blue')].sort(), ['a', 'b']);
  const cut = { ...both, points: [{ id: 'a', owner: 'red', progress: 0, by: null }, both.points[1]] };
  assert.deepEqual([...capture.suppliedPoints(cut, data, 'blue')], [], 'b is cut off from the HQ');
  const { state: plain, data: d2 } = testMatch([], { points: map.points });
  assert.deepEqual([...capture.suppliedPoints({ ...plain, points: cut.points }, d2, 'blue')], ['b']);
});
