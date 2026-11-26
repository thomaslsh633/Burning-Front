import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as status from '../../../src/logic/status/index.js';
import { table } from '../../../src/logic/fsm/index.js';
import { apply } from '../../../src/logic/commands/index.js';
import { distance } from '../../../src/logic/hex/index.js';
import { testMatch, tweak } from '../../helpers/match.js';
import { assertOwnsOnly } from '../../helpers/ownership.js';

const H = (c, r) => ({ c, r });
const rifles = (x = {}) => testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(5, 5), ...x }, { team: 'red', sbps: 'grenadier_ger', pos: H(8, 5) }]);

test('morale transition table (thresholds 30 / 80, recover below 20)', () => {
  const { data } = rifles();
  const at = p => ({ suppression: p });
  const rows = s => table(status.MORALE, at(s), { data }).map(r => `${r.state} ${r.event} → ${r.to}`);
  assert.deepEqual(rows(85), ['NORMAL SuppressionChanged → PINNED', 'NORMAL Retreat → RETREATING', 'SUPPRESSED Retreat → RETREATING',
    'SUPPRESSED SuppressionChanged → PINNED', 'PINNED Retreat → RETREATING', 'PINNED SuppressionChanged → null', 'RETREATING Arrived → NORMAL']);
  assert.deepEqual(rows(40).filter(r => r.includes('SuppressionChanged')), ['NORMAL SuppressionChanged → SUPPRESSED', 'SUPPRESSED SuppressionChanged → null', 'PINNED SuppressionChanged → SUPPRESSED']);
  assert.deepEqual(rows(10).filter(r => r.includes('SuppressionChanged')), ['NORMAL SuppressionChanged → null', 'SUPPRESSED SuppressionChanged → NORMAL', 'PINNED SuppressionChanged → NORMAL']);
});

test('suppression adds up to the cap and moves the morale state; decay is faster in cover', () => {
  const { state, data } = rifles();
  const a = status.applySuppression(state, 'u1', 45, data);
  assert.equal(a.state.units.u1.fsm.morale, 'SUPPRESSED');
  const b = status.applySuppression(a.state, 'u1', 90, data);
  assert.equal(b.state.units.u1.suppression, 100);
  assert.equal(b.state.units.u1.fsm.morale, 'PINNED');
  assertOwnsOnly('status', state, b.state);
  assert.equal(status.decaySuppression(b.state, 'u1', data).state.units.u1.suppression, 65);
  const cover = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(5, 5) }], { terrain: { '5,5': { object: 'crater' } } });
  const inCrater = status.applySuppression(cover.state, 'u1', 100, cover.data).state;
  assert.equal(status.decaySuppression(inCrater, 'u1', cover.data).state.units.u1.suppression, 50);
});

test('pinned units cannot move; retreat is still allowed; retreat moves ×1.6 toward the rally point and ends the turn', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(11, 9) }, { team: 'red', sbps: 'grenadier_ger', pos: H(8, 9) }]);
  const pinned = status.applySuppression(state, 'u1', 90, data).state;
  assert.equal(apply(pinned, { type: 'Move', side: 'blue', unit: 'u1', to: H(10, 9) }, data, null).error, 'pinned');
  const r = apply(pinned, { type: 'Retreat', side: 'blue', unit: 'u1' }, data, null);
  const u = r.state.units.u1;
  assert.equal(u.fsm.morale, 'RETREATING');
  assert.equal(distance(u.pos, H(11, 9)), 6, '4 move points × 1.6 = 6 hexes');
  assert.deepEqual(u.retreatTo, H(0, 0));
  assert.equal(u.fsm.action, 'EXHAUSTED');
  assert.equal(apply(r.state, { type: 'Attack', side: 'blue', unit: 'u1', target: 'u2' }, data, null).error, 'retreating');
  const fired = tweak(state, 'u1', { budget: { ...state.units.u1.budget, fired: true } });
  assert.equal(apply(fired, { type: 'Retreat', side: 'blue', unit: 'u1' }, data, null).error, 'already_fired');
});

test('veterancy: XP from damage dealt × victim price, ranks at the CoH3 thresholds; rank modifiers', () => {
  const { state, data } = rifles();
  const g = state.units.u2;
  const full = g.members.reduce((s, m) => s + m.hp, 0);
  assert.equal(status.xpFor(g, full, data), status.unitValue(g, data));
  const r = status.gainXp(state, 'u1', 1000, data);
  assert.equal(r.state.units.u1.rank, 1);
  assert.deepEqual(r.events, [{ type: 'RankGained', unit: 'u1', rank: 1 }]);
  assert.deepEqual(status.rankMods(r.state.units.u1, data), { received_accuracy: 0.9 });
  assert.equal(status.gainXp(state, 'u1', 6000, data).state.units.u1.rank, 3);
});

test('ammo state', () => {
  const { state, data } = rifles();
  const u = state.units.u1;
  assert.equal(status.ammoState(u, data), 'ok');
  assert.equal(status.ammoState({ ...u, ammo: 5 }, data), 'low');
  assert.equal(status.ammoState({ ...u, ammo: 0 }, data), 'out');
});
