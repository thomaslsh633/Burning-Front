import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as economy from '../../../src/logic/economy/index.js';
import { testMatch } from '../../helpers/match.js';
import { gameData } from '../../helpers/game-data.js';

const H = (c, r) => ({ c, r });
const MAP = {
  points: [{ id: 'f', kind: 'fuel', hex: '5,5', radius: 0 }, { id: 'm', kind: 'munition', hex: '7,5', radius: 0 }, { id: 'v', kind: 'vp', hex: '9,5', radius: 0 }],
  production: [{ id: 'bx', type: 'barracks', team: 'blue', hexes: ['2,2'] }, { id: 'tx', type: 'tank_depot', team: 'red', hexes: ['9,8'] }],
};
const owned = (state, ids) => ({ ...state, points: state.points.map(p => (ids.includes(p.id) ? { ...p, owner: 'blue' } : p)) });

test('every squad in data/rules/production.json exists in the unit data', () => {
  const d = gameData();
  for (const byFaction of Object.values(d.rules.production.buildings)) for (const ids of Object.values(byFaction)) for (const id of ids) assert.ok(d.units.sbps[id], id);
});

test('gross income: HQ base plus supplied points; VPs pay nothing', () => {
  const { state, data } = testMatch([], MAP);
  assert.deepEqual(economy.grossIncome(state, data, 'blue'), { manpower: 60, munition: 10, fuel: 5 });
  assert.deepEqual(economy.grossIncome(owned(state, ['f', 'm', 'v']), data, 'blue'), { manpower: 80, munition: 21, fuel: 17 });
});

test('upkeep: 2 % of each active unit\'s manpower price, at most 20 per unit, the excess in fuel', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(1, 1) }, { team: 'blue', sbps: 'sherman_us', pos: H(3, 3) }, { team: 'red', sbps: 'grenadier_ger', pos: H(9, 9) }], MAP);
  assert.deepEqual(economy.upkeep(state, data, 'blue'), { manpower: Math.round(0.02 * 270 + 0.02 * 340), fuel: 0 });
  const dear = { ...data, units: { ...data.units, sbps: { ...data.units.sbps, riflemen_us: { ...data.units.sbps.riflemen_us, price: { cost: { manpower: 1300 } } } } } };
  assert.deepEqual(economy.upkeep(state, dear, 'blue'), { manpower: 20 + 7, fuel: 2 }, '26 → 20 MP + 6 / 3 fuel');
});

test('collect income: net manpower never below a quarter of gross; resources never below zero', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(1, 1) }], MAP);
  const r = economy.collectIncome(state, data, 'blue');
  assert.deepEqual(r.state.teams.blue.resources, { manpower: 600 + 60 - 5, munition: 20, fuel: 25 });
  assert.deepEqual(r.events.map(e => e.type), ['IncomeReceived', 'UpkeepPaid']);
  const greedy = { ...data, balance: { ...data.balance, economy: { ...data.balance.economy, upkeep: { ...data.balance.economy.upkeep, share_of_price: 1, max_manpower: 1000 } } } };
  assert.equal(economy.collectIncome(state, greedy, 'blue').state.teams.blue.resources.manpower, 600 + 15);
  assert.deepEqual(r.state.units, state.units);
});

test('Produce check: own building that offers the squad, money in hand, a free hex beside it', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(3, 2) }], MAP);
  const cmd = (x = {}) => ({ type: 'Produce', side: 'blue', building: 'bx', sbps: 'riflemen_us', hex: H(1, 2), ...x });
  assert.deepEqual(economy.offers(state, data, 'bx'), ['riflemen_us']);
  assert.equal(economy.validateProduce(state, cmd(), data), null);
  assert.equal(economy.validateProduce(state, cmd({ building: 'tx' }), data), 'no_such_building');
  assert.equal(economy.validateProduce(state, cmd({ sbps: 'sherman_us' }), data), 'not_offered');
  assert.equal(economy.validateProduce(state, cmd({ hex: H(5, 5) }), data), 'bad_hex');
  assert.equal(economy.validateProduce(state, cmd({ hex: H(3, 2) }), data), 'hex_occupied');
  const poor = { ...state, teams: { ...state.teams, blue: { ...state.teams.blue, resources: { manpower: 100, munition: 0, fuel: 0 } } } };
  assert.equal(economy.validateProduce(poor, cmd(), data), 'cannot_afford');
});

test('pay', () => {
  const { state } = testMatch([], MAP);
  assert.equal(economy.canAfford(state, 'red', { manpower: 340, fuel: 90 }), false, 'red has 20 fuel');
  assert.deepEqual(economy.pay(state, 'blue', { manpower: 270 }).state.teams.blue.resources, { manpower: 330, munition: 10, fuel: 20 });
});
