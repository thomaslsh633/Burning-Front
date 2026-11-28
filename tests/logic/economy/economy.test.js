import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as economy from '../../../src/logic/economy/index.js';
import { testMatch } from '../../helpers/match.js';
import { gameData } from '../../helpers/game-data.js';

const H = (c, r) => ({ c, r });
const MAP = {
  points: [{ id: 'f', kind: 'fuel', hex: '5,5', radius: 0 }, { id: 'm', kind: 'munition', hex: '7,5', radius: 0 }, { id: 'v', kind: 'vp', hex: '9,5', radius: 0 }],
  production: [{ id: 'bx', type: 't1', team: 'blue', hexes: ['2,2'] }, { id: 'tx', type: 't3', team: 'red', hexes: ['9,8'] }],
};
const owned = (state, ids) => ({ ...state, points: state.points.map(p => (ids.includes(p.id) ? { ...p, owner: 'blue' } : p)) });

test('production lists are generated for every mapped CoH3 building', () => {
  const p = gameData().rules.production;
  for (const f of Object.values(p.factions)) for (const b of Object.values(f.slots)) assert.ok(f.buildings[b], b);
  assert.ok(p.factions.american.buildings.barracks_us.base.includes('riflemen_us'));
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
  assert.deepEqual(economy.offers(state, data, 'bx'), data.rules.production.factions.american.buildings.barracks_us.base, 'T1: CoH3 barracks_us base list');
  assert.ok(economy.offers(state, data, 'bx').includes('riflemen_us'));
  assert.equal(economy.validateProduce(state, cmd(), data), null);
  assert.equal(economy.validateProduce(state, cmd({ building: 'tx' }), data), 'no_such_building');
  assert.equal(economy.validateProduce(state, cmd({ sbps: 'sherman_us' }), data), 'not_offered');
  assert.equal(economy.validateProduce(state, cmd({ hex: H(5, 5) }), data), 'bad_hex');
  assert.equal(economy.validateProduce(state, cmd({ hex: H(3, 2) }), data), 'hex_occupied');
  const poor = { ...state, teams: { ...state.teams, blue: { ...state.teams.blue, resources: { manpower: 100, munition: 0, fuel: 0 } } } };
  assert.equal(economy.validateProduce(poor, cmd(), data), 'cannot_afford');
});

test('the HQ produces too (its CoH3 HQ building list)', () => {
  const { state, data } = testMatch([], { structures: [{ id: 'hqb', kind: 'hq', team: 'blue', hexes: ['1,1'] }] });
  assert.deepEqual(economy.producers(state, data).map(b => [b.id, b.type]), [['hqb', 'hq']]);
  assert.deepEqual(economy.offers(state, data, 'hqb'), ['engineer_us', 'scout_us'], 'the HQ: base engineers and recon');
});

test('a map point may set its own yield', () => {
  const { state, data } = testMatch([], { points: [{ id: 'mp', kind: 'manpower', hex: '5,5', radius: 0, yield: { manpower: 50 } }] });
  assert.equal(economy.grossIncome(owned(state, ['mp']), data, 'blue').manpower, 60 + 50);
});

test('population cap: no production past it', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(8, 8) }], MAP);
  assert.equal(economy.population(state, data, 'blue'), 8);
  const capped = { ...data, balance: { ...data.balance, economy: { ...data.balance.economy, population_cap: 15 } } };
  assert.equal(economy.validateProduce(state, { side: 'blue', building: 'bx', sbps: 'riflemen_us', hex: H(1, 2) }, capped), 'population_cap');
});

test('pay', () => {
  const { state } = testMatch([], MAP);
  assert.equal(economy.canAfford(state, 'red', { manpower: 340, fuel: 90 }), false, 'red has 20 fuel');
  assert.deepEqual(economy.pay(state, 'blue', { manpower: 270 }).state.teams.blue.resources, { manpower: 330, munition: 10, fuel: 20 });
});

test('a destroyed HQ pays no base income and produces nothing; a destroyed production building produces nothing', () => {
  const map = { ...MAP, structures: [{ id: 'hqb', kind: 'hq', team: 'blue', hexes: ['1,1'] }] };
  const { state, data } = testMatch([], map);
  const down = { ...state, map: { ...state.map, changes: { ...state.map.changes, structures: { hqb: { hp: 0, collapsed: true }, bx: { hp: 0, collapsed: true } } } } };
  assert.deepEqual(economy.grossIncome(down, data, 'blue'), { manpower: 0, munition: 0, fuel: 0 });
  assert.deepEqual(economy.producers(down, data).filter(b => b.team === 'blue'), []);
  assert.equal(economy.validateProduce(down, { side: 'blue', building: 'bx', sbps: 'riflemen_us', hex: H(1, 2) }, data), 'no_such_building');
});

test('paradrop: a squad CoH3 flies in lands on any free hex the unit can stand on', () => {
  const map = { ...MAP, production: [...MAP.production, { id: 'rt1', type: 't1', team: 'red', hexes: ['9,1'] }] };
  const { state, data } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(3, 2) }], map);
  const s = { ...state, match: { ...state.match, side: 'red' } };
  assert.ok(economy.offers(s, data, 'rt1').includes('fallschirmjagers_ger'));
  const cmd = hex => ({ side: 'red', building: 'rt1', sbps: 'fallschirmjagers_ger', hex });
  assert.equal(economy.validateProduce(s, cmd(H(2, 7)), data), null, 'far from the building');
  assert.equal(economy.validateProduce(s, cmd(H(3, 2)), data), 'hex_occupied');
  assert.equal(economy.validateProduce(s, cmd(H(20, 2)), data), 'bad_hex', 'off the map');
  assert.equal(economy.validateProduce(s, { ...cmd(H(5, 1)), sbps: 'grenadier_ger' }, data), 'bad_hex', 'a squad that walks deploys beside the building');
});
