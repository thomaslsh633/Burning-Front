import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as vision from '../../../src/logic/vision/index.js';
import { edgeKey } from '../../../src/logic/hex/index.js';
import { apply } from '../../../src/logic/commands/index.js';
import { testMatch, tweak } from '../../helpers/match.js';
import { assertOwnsOnly } from '../../helpers/ownership.js';

const H = (c, r) => ({ c, r });
const blue = (sbps, pos, x = {}) => ({ team: 'blue', sbps, pos, ...x });
const red = (sbps, pos, x = {}) => ({ team: 'red', sbps, pos, ...x });

test('sight line: forests block, rubble obscures, low objects beside the viewer are ignored, neighbours always see', () => {
  const { state, data } = testMatch([blue('riflemen_us', H(1, 5))], { terrain: { '3,5': { object: 'forest' }, '2,4': { object: 'rubble' }, '2,5': { object: 'bush' } } });
  assert.deepEqual(vision.sightLine(state, data, H(1, 5), H(5, 5), 1.5), { block: true, obscured: false });
  assert.equal(vision.sightLine(state, data, H(1, 5), H(4, 2), 1.5).block, false);
  assert.equal(vision.sightLine(state, data, H(1, 5), H(2, 5), 1.5).block, false);
});

test('ridges block; height lets a viewer see over a forest', () => {
  const { state, data } = testMatch([], { terrain: { '3,5': { elev: 2 }, '4,2': { object: 'forest' }, '2,2': { elev: 3 } } });
  assert.equal(vision.sightLine(state, data, H(1, 5), H(6, 5), 1.5).block, true, 'ridge between');
  assert.equal(vision.sightLine(state, data, H(1, 2), H(6, 2), 1.5).block, true, 'forest in the way');
  assert.equal(vision.sightLine(state, data, H(2, 2), H(6, 2), 1.5).block, false, 'from the hill: over the trees');
});

test('edges: a stone wall in the middle blocks, a hedge obscures', () => {
  const { state, data } = testMatch([], { edges: { [edgeKey(H(3, 5), 0)]: 'stone_wall', [edgeKey(H(3, 2), 0)]: 'hedge' } });
  assert.equal(vision.sightLine(state, data, H(1, 5), H(6, 5), 1.5).block, true);
  assert.deepEqual(vision.sightLine(state, data, H(1, 2), H(6, 2), 1.5), { block: false, obscured: true });
});

test('sight range, visible hexes and pinned penalty', () => {
  const { state, data } = testMatch([blue('riflemen_us', H(5, 5))]);
  const u = state.units.u1;
  assert.equal(vision.sightRange(u, state, data), 6);
  assert.equal(vision.sightRange({ ...u, fsm: { ...u.fsm, morale: 'PINNED' } }, state, data), 5);
  const seen = vision.visibleHexes(state, data, 'blue');
  assert.ok(seen.has('11,5'));
  assert.equal(seen.has('5,5') && !seen.has('0,0'), true);
});

test('concealment: a unit in bush is seen only from 2 hexes; firing reveals it until its next turn', () => {
  const { state, data } = testMatch([blue('riflemen_us', H(2, 5)), red('grenadier_ger', H(6, 5))], { terrain: { '6,5': { object: 'bush' } } });
  const g = state.units.u2;
  assert.equal(vision.canSee(state, data, 'blue', g), false);
  const near = { ...state, units: { ...state.units, u1: { ...state.units.u1, pos: H(4, 5) } } };
  assert.equal(vision.canSee(near, data, 'blue', near.units.u2), true);
  const fired = vision.revealOnFire(state, 'u2', data);
  assert.equal(fired.state.units.u2.timers.revealedUntil, state.match.turn + 2);
  assert.equal(vision.canSee(fired.state, data, 'blue', fired.state.units.u2), true);
  assertOwnsOnly('vision', state, fired.state);
});

test('emplaced crew in cover that held fire conceals at turn end; moving or firing reveals', () => {
  const { state, data } = testMatch([blue('at_gun_57mm_us', H(3, 3), { stance: 'EMPLACED' }), blue('riflemen_us', H(8, 8))], { terrain: { '3,3': { object: 'crater' } } });
  const r = vision.visibilityTurnEnd(state, 'u1', data);
  assert.equal(r.state.units.u1.fsm.visibility, 'CONCEALED');
  assert.equal(vision.detectionRange(r.state, data, r.state.units.u1), 2);
  assert.equal(vision.visibilityTurnEnd(state, 'u2', data).state.units.u2.fsm.visibility, 'REVEALED', 'infantry has no camouflage');
  const fired = tweak(state, 'u1', { budget: { ...state.units.u1.budget, fired: true } });
  assert.equal(vision.visibilityTurnEnd(fired, 'u1', data).state.units.u1.fsm.visibility, 'REVEALED');
  assert.equal(vision.revealOnFire(r.state, 'u1', data).state.units.u1.fsm.visibility, 'REVEALED');
});

test('cover per shot: hex object, directional edge, garrison, vehicles none, water negative', () => {
  const { state, data } = testMatch([red('grenadier_ger', H(5, 5)), red('panzer_iv_ger', H(8, 5)), red('grenadier_ger', H(5, 2))], {
    terrain: { '8,5': { object: 'crater' }, '5,2': { ground: 'shallow_water' } }, edges: { [edgeKey(H(5, 5), 3)]: 'sandbag_row' } });
  const g = state.units.u1;
  assert.equal(vision.coverAgainst(state, data, g, H(2, 5)), 'heavy', 'shot crosses the sandbag edge (west)');
  assert.equal(vision.coverAgainst(state, data, g, H(8, 5)), 'none', 'from the east the sandbags do nothing');
  assert.equal(vision.coverAgainst(state, data, state.units.u2, H(2, 5)), 'none', 'vehicles take no terrain cover');
  assert.equal(vision.coverAgainst(state, data, state.units.u3, H(2, 2)), 'negative');
  assert.equal(vision.coverAgainst(state, data, { ...g, fsm: { ...g.fsm, location: 'GARRISONED' } }, H(2, 5)), 'garrison');
});

test('moving reveals a concealed unit (Move route)', () => {
  const { state, data } = testMatch([blue('riflemen_us', H(2, 2))]);
  const hidden = tweak(state, 'u1', { fsm: { ...state.units.u1.fsm, visibility: 'CONCEALED' } });
  const r = apply(hidden, { type: 'Move', side: 'blue', unit: 'u1', to: H(3, 2) }, data, null);
  assert.equal(r.state.units.u1.fsm.visibility, 'REVEALED');
});

test('unitSees: one viewer\'s own sight range and line of sight, concealment respected', () => {
  const { state, data } = testMatch([blue('hmg_30cal_us', H(1, 5)), red('grenadier_ger', H(4, 5)), red('grenadier_ger', H(11, 5))]);
  assert.equal(vision.unitSees(state, data, state.units.u1, state.units.u2), true);
  assert.equal(vision.unitSees(state, data, state.units.u1, state.units.u3), false, 'beyond sight range');
  const hidden = tweak(state, 'u2', { fsm: { ...state.units.u2.fsm, visibility: 'CONCEALED' } });
  assert.equal(vision.unitSees(hidden, data, hidden.units.u1, hidden.units.u2), vision.detectionRange(hidden, data, hidden.units.u2) >= 3);
});
