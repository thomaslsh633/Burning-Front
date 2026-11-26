import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settle } from '../../../src/logic/victory/index.js';
import { damageStructure, hqDestroyed } from '../../../src/logic/terrain/index.js';
import { testMatch } from '../../helpers/match.js';

const H = (c, r) => ({ c, r });
const VPS = { points: [{ id: 'v1', kind: 'vp', hex: '3,3', radius: 0 }, { id: 'v2', kind: 'vp', hex: '6,3', radius: 0 }, { id: 'f', kind: 'fuel', hex: '8,8', radius: 0 },
  { id: 'm', kind: 'munition', hex: '9,8', radius: 0 }] };
const own = (state, owners) => ({ ...state, points: state.points.map(p => ({ ...p, owner: owners[p.id] ?? null })) });
const tickets = s => [s.teams.blue.tickets, s.teams.red.tickets];

test('capture: the side behind on VPs bleeds by the lead; momentum builds over consecutive settlements', () => {
  const { state, data } = testMatch([], VPS);
  assert.deepEqual(tickets(state), [350, 350]);
  const one = own(state, { v1: 'blue' });
  const r = settle(one, data, 'blue');
  assert.deepEqual(tickets(r.state), [350, 348]);
  assert.deepEqual(r.events, [{ type: 'TicketsLost', team: 'red', amount: 2, left: 348 }]);
  assert.deepEqual(tickets(settle(own(state, { v1: 'red', v2: 'red' }), data, 'red').state), [345, 350]);
  let s = one;
  for (let i = 0; i < 7; i++) s = settle(s, data, 'blue').state;
  assert.deepEqual([s.victory.streak, tickets(s)[1]], [7, 350 - 2 * 6 - 3], 'the 7th settlement bleeds 3');
});

test('capture: at VP parity a resource-control gap of 4 bleeds 1; 0 tickets ends the match', () => {
  const { state, data } = testMatch([], VPS);
  assert.deepEqual(tickets(settle(own(state, { f: 'blue', m: 'blue' }), data, 'blue').state), [350, 349]);
  assert.deepEqual(tickets(settle(own(state, { f: 'blue' }), data, 'blue').state), [350, 350], 'gap 2: no bleed');
  const low = { ...own(state, { v1: 'blue' }), teams: { ...state.teams, red: { ...state.teams.red, tickets: 1 } } };
  const r = settle(low, data, 'red');
  assert.deepEqual(r.state.match.over, { winner: 'blue', reason: 'tickets' });
  assert.equal(r.events.at(-1).type, 'MatchEnded');
  assert.equal(settle(r.state, data, 'blue').state, r.state, 'over: nothing more');
});

test('annihilation: a side with no units left loses at once, money or not; both at once: the side that did not act wins', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(1, 1) }], { mode: 'annihilation' });
  assert.deepEqual(settle(state, data, 'blue').state.match.over, { winner: 'blue', reason: 'annihilation' });
  assert.deepEqual(settle({ ...state, units: {} }, data, 'red').state.match.over, { winner: 'red', reason: 'annihilation' });
});

test('annihilation: destroying the enemy HQ wins; in capture mode it does not (VPs decide)', () => {
  const hqs = { structures: [{ id: 'hq_b', kind: 'hq', team: 'blue', hexes: ['1,1'] }, { id: 'hq_r', kind: 'hq', team: 'red', hexes: ['10,8'] }] };
  const units = [{ team: 'blue', sbps: 'riflemen_us', pos: H(3, 3) }, { team: 'red', sbps: 'grenadier_ger', pos: H(8, 8) }];
  const shell = { weapon: { damage_type: 'explosive', category: 'tank_gun' }, amount: 99999, pen: 999 };
  const { state, data } = testMatch(units, { ...hqs, mode: 'annihilation' });
  const hit = damageStructure(state, data, 'hq_r', shell);
  assert.equal(hqDestroyed(hit.state, data, 'red'), true);
  assert.deepEqual(settle(hit.state, data, 'blue').state.match.over, { winner: 'blue', reason: 'hq_destroyed' });
  const { state: cap, data: d2 } = testMatch(units, hqs);
  const down = damageStructure(cap, d2, 'hq_r', shell);
  assert.equal(down.collapsed, true);
  assert.equal(settle(down.state, d2, 'blue').state.match.over, null);
});

test('annihilation round cap: after it the higher surviving value wins, equal is a draw', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'sherman_us', pos: H(1, 1) }, { team: 'red', sbps: 'grenadier_ger', pos: H(9, 9) }], { mode: 'annihilation' });
  const capped = { ...state, match: { ...state.match, roundCap: 3, turn: 4 } };
  assert.deepEqual(settle(capped, data, 'blue').state.match.over, { winner: 'blue', reason: 'round_cap' });
  assert.equal(settle({ ...capped, match: { ...capped.match, turn: 3 } }, data, 'blue').state.match.over, null);
});
