import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as mv from '../../../src/logic/movement/index.js';
import { apply } from '../../../src/logic/commands/index.js';
import { edgeKey } from '../../../src/logic/hex/index.js';
import { testMatch, tweak } from '../../helpers/match.js';
import { assertOwnsOnly } from '../../helpers/ownership.js';

const H = (c, r) => ({ c, r });
const rifle = (pos, extra = {}) => ({ team: 'blue', sbps: 'riflemen_us', pos, ...extra });
const tank = (pos, extra = {}) => ({ team: 'blue', sbps: 'sherman_us', pos, ...extra });
const far = reach => Math.max(...[...reach.values()].map(v => v.cost));

test('move points: slowest member, then suppression, retreat, engine damage, immobilised', () => {
  const { state, data } = testMatch([rifle(H(1, 1)), tank(H(5, 5)), { team: 'blue', sbps: 'hmg_fighting_position_us', pos: H(8, 8) }]);
  const [r, t, bunker] = ['u1', 'u2', 'u3'].map(id => state.units[id]);
  assert.equal(mv.movePoints(r, data), 4);
  assert.equal(mv.movePoints(t, data), 6);
  assert.equal(mv.movePoints({ ...r, fsm: { ...r.fsm, morale: 'SUPPRESSED' } }, data), 2);
  assert.equal(mv.movePoints({ ...r, fsm: { ...r.fsm, morale: 'RETREATING' } }, data), 6);
  assert.equal(mv.movePoints({ ...t, criticals: ['engine_damaged'] }, data), 3);
  assert.equal(mv.movePoints({ ...t, criticals: ['immobilised'] }, data), 0);
  assert.equal(mv.movePoints(bunker, data), 0);
  assert.equal(mv.moveClass(bunker, data), null);
  assert.equal(mv.moveClass(t, data), 'vehicle');
});

test('terrain costs: infantry 1 on plains, vehicles 2 off road, 1 on road', () => {
  const road = Object.fromEntries(Array.from({ length: 12 }, (_, c) => [`${c},5`, { ground: 'road' }]));
  const { state, data } = testMatch([rifle(H(5, 2)), tank(H(0, 5))], { terrain: road });
  assert.equal(far(mv.reachable(state, data, 'u1')), 4);
  const tankReach = mv.reachable(state, data, 'u2');
  assert.ok(tankReach.has('6,5'), 'six hexes along the road');
  assert.equal(tankReach.get('0,7')?.cost, 4, 'two hexes off road cost 2 each');
});

test('impassable terrain and edges', () => {
  const { state, data } = testMatch([tank(H(2, 2))], {
    terrain: { '3,2': { object: 'building' }, '2,3': { ground: 'deep_water' } },
    edges: { [edgeKey(H(2, 2), 3)]: 'stone_wall', [edgeKey(H(2, 2), 4)]: 'hedge' } });
  const reach = mv.reachable(state, data, 'u1');
  assert.equal(reach.has('3,2'), false, 'vehicles cannot enter buildings');
  assert.equal(reach.has('2,3'), false, 'deep water');
  assert.equal(reach.get('1,2').cost, 4, 'stone wall: the tank goes round it (1,3), not over it');
  assert.equal(reach.get('1,2').prev, '1,3');
  assert.equal(reach.get('1,1').cost, 3, 'hedge adds 1 to a plains step');
  const inf = testMatch([rifle(H(2, 2))], { terrain: { '3,2': { object: 'building' } }, edges: { [edgeKey(H(2, 2), 3)]: 'stone_wall' } });
  assert.equal(mv.reachable(inf.state, inf.data, 'u1').get('3,2').cost, 1, 'infantry enters buildings');
  assert.equal(mv.reachable(inf.state, inf.data, 'u1').get('1,2').cost, 2, 'infantry climbs the wall');
});

test('units block: enemies always, friends only as a final hex', () => {
  const { state, data } = testMatch([rifle(H(2, 2)), rifle(H(3, 2)), { team: 'red', sbps: 'grenadier_ger', pos: H(2, 3) }]);
  const reach = mv.reachable(state, data, 'u1');
  assert.equal(reach.get('3,2').stop, false, 'friend: pass through, not stop');
  assert.ok(reach.get('4,2').stop);
  assert.equal(reach.has('2,3'), false, 'enemy hex');
  assert.equal(mv.validateMove(state, { unit: 'u1', to: H(3, 2) }, data), 'hex_occupied');
});

test('reverse: only behind the hull, +1 per hex, facing kept', () => {
  const { state, data } = testMatch([tank(H(5, 5), { facing: 0 })]);
  const reach = mv.reachable(state, data, 'u1', { reverse: true });
  assert.ok(reach.has('4,5'), 'straight back (west)');
  assert.equal(reach.get('4,5').cost, 3);
  assert.equal(reach.has('6,5'), false, 'forward is not reverse');
  const r = mv.applyMove(state, { unit: 'u1', to: H(4, 5), reverse: true }, data);
  assert.equal(r.state.units.u1.facing, 0);
  assert.equal(mv.validateMove(testMatch([rifle(H(1, 1))]).state, { unit: 'u1', to: H(0, 1), reverse: true }, data), 'cannot_reverse');
});

test('applyMove walks hex by hex, faces the way it goes; an aimed turret holds; reactions can stop it', () => {
  const { state, data } = testMatch([tank(H(2, 5), { facing: 3 })]);
  const before = tweak(state, 'u1', { turretFacing: 1 });
  const r = mv.applyMove(before, { unit: 'u1', to: H(4, 5) }, data);
  assert.deepEqual(r.events.map(e => [e.type, e.to.c]), [['Moved', 3], ['Moved', 4]]);
  assert.equal(r.state.units.u1.facing, 0);
  assert.equal(r.state.units.u1.turretFacing, 1, 'aimed turret holds its aim');
  assert.equal(r.cost, 4);
  assertOwnsOnly('movement', before, r.state);
  const stopped = mv.applyMove(before, { unit: 'u1', to: H(4, 5) }, data, s => ({ state: s, events: [], stop: true }));
  assert.deepEqual(stopped.state.units.u1.pos, H(3, 5));
  assert.equal(stopped.events.at(-1).type, 'MoveInterrupted');
  assert.equal(stopped.cost, 2);
});

test('turn cost: vehicles 1 up to 120°, 2 for 180°; team weapons free; infantry has no hull', () => {
  const { state, data } = testMatch([tank(H(2, 2), { facing: 0 }), rifle(H(5, 5)), { team: 'blue', sbps: 'at_gun_57mm_us', pos: H(8, 8) }]);
  assert.deepEqual([1, 2, 3].map(f => mv.turnCost(state.units.u1, data, f)), [1, 1, 2]);
  assert.equal(mv.turnCost(state.units.u2, data, 3), null);
  assert.equal(mv.turnCost(state.units.u3, data, 3), 0);
});

test('Move command: path cost leaves the budget; nothing left → EXHAUSTED only when the action is spent too', () => {
  const { state, data } = testMatch([rifle(H(1, 1)), { team: 'red', sbps: 'grenadier_ger', pos: H(9, 8) }]);
  const r = apply(state, { type: 'Move', side: 'blue', unit: 'u1', to: H(5, 1) }, data, null);
  assert.equal(r.undoable, true);
  assert.deepEqual(r.state.units.u1.pos, H(5, 1));
  assert.equal(r.state.units.u1.budget.move, 0);
  assert.equal(r.state.units.u1.budget.moved, true);
  assert.equal(r.state.units.u1.fsm.action, 'IDLE', 'the action is still there');
  assert.equal(apply(r.state, { type: 'Move', side: 'blue', unit: 'u1', to: H(6, 1) }, data, null).error, 'out_of_reach');
  assert.equal(apply(state, { type: 'Move', side: 'blue', unit: 'u2', to: H(8, 8) }, data, null).error, 'not_your_unit');
  assert.equal(apply(state, { type: 'Move', side: 'blue', unit: 'u1', to: H(9, 1) }, data, null).error, 'out_of_reach');
});

test('Turn command spends move points', () => {
  const { state, data } = testMatch([tank(H(2, 2), { facing: 0 })]);
  const r = apply(state, { type: 'Turn', side: 'blue', unit: 'u1', facing: 3 }, data, null);
  assert.equal(r.state.units.u1.facing, 3);
  assert.equal(r.state.units.u1.budget.move, 4);
  assert.equal(r.events[0].type, 'Turned');
  assert.equal(apply(state, { type: 'Turn', side: 'blue', unit: 'u1', facing: 0 }, data, null).error, 'already_facing');
});
