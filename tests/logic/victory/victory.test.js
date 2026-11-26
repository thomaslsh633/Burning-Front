import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settle, canDeploy } from '../../../src/logic/victory/index.js';
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

test('annihilation: no units and nothing affordable loses; money and a building keep a side alive', () => {
  const map = { mode: 'annihilation', production: [{ id: 'rb', type: 'barracks', team: 'red', hexes: ['10,8'] }] };
  const { state, data } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(1, 1) }], map);
  assert.equal(canDeploy(state, data, 'red'), true);
  assert.equal(settle(state, data, 'blue').state.match.over, null);
  const broke = { ...state, teams: { ...state.teams, red: { ...state.teams.red, resources: { manpower: 100, munition: 0, fuel: 0 } } } };
  assert.equal(canDeploy(broke, data, 'red'), false);
  assert.deepEqual(settle(broke, data, 'blue').state.match.over, { winner: 'blue', reason: 'annihilation' });
  const bothOut = { ...broke, units: {}, teams: { ...broke.teams, blue: { ...broke.teams.blue, resources: { manpower: 0 } } } };
  assert.deepEqual(settle(bothOut, data, 'red').state.match.over, { winner: 'red', reason: 'annihilation' }, 'the side that did not act');
});

test('annihilation round cap: after it the higher surviving value wins, equal is a draw', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'sherman_us', pos: H(1, 1) }, { team: 'red', sbps: 'grenadier_ger', pos: H(9, 9) }], { mode: 'annihilation' });
  const capped = { ...state, match: { ...state.match, roundCap: 3, turn: 4 } };
  assert.deepEqual(settle(capped, data, 'blue').state.match.over, { winner: 'blue', reason: 'round_cap' });
  assert.equal(settle({ ...capped, match: { ...capped.match, turn: 3 } }, data, 'blue').state.match.over, null);
});
