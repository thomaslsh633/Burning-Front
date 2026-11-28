import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as economy from '../../../src/logic/economy/index.js';
import { skillReady } from '../../../src/logic/skills/index.js';
import { apply } from '../../../src/logic/commands/index.js';
import { createRng } from '../../../src/services/rng/index.js';
import { testMatch } from '../../helpers/match.js';

const H = (c, r) => ({ c, r });
const MAP = { production: [{ id: 'bx', type: 't1', team: 'blue', hexes: ['2,2'] }, { id: 'tx', type: 't3', team: 'blue', hexes: ['2,7'] }] };
const rich = s => ({ ...s, teams: { ...s.teams, blue: { ...s.teams.blue, resources: { manpower: 1000, munition: 200, fuel: 200 } } } });
const run = (s, d, cmd) => { const r = apply(s, cmd, d, createRng(1)); if (r.error) throw new Error(`${cmd.type}: ${r.error}`); return r; };
const nextOwnTurn = (s, d) => run(run(s, d, { type: 'EndTurn', side: 'blue' }).state, d, { type: 'EndTurn', side: 'red' }).state;

test('research a CoH3 upgrade: paid at once, one item per building, unlocked after its CoH3 time in turns', () => {
  const { state: s0, data } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(5, 5) }], MAP);
  const state = rich(s0), cmd = x => ({ type: 'Research', side: 'blue', building: 'bx', research: 'grenade_riflemen_us', ...x });
  assert.ok(economy.researchOffers(state, data, 'bx').includes('grenade_riflemen_us'), 'the CoH3 barracks researches Riflemen grenades');
  assert.deepEqual(economy.researchOf(state, data, 'bx', 'grenade_riflemen_us'), { unlocks: 'upgrade', cost: { manpower: 100, fuel: 10 }, turns: 3,
    coh3_ref: 'upgrade/american/research/barracks/grenade_riflemen_us' });
  const poor = { ...s0, teams: { ...s0.teams, blue: { ...s0.teams.blue, resources: { manpower: 600, munition: 0, fuel: 5 } } } };
  assert.equal(economy.validateResearch(poor, cmd(), data), 'cannot_afford', '10 fuel');
  assert.equal(economy.validateResearch(state, cmd({ side: 'red' }), data), 'no_such_building');
  const r = run(state, data, cmd());
  assert.deepEqual(r.state.teams.blue.resources, { manpower: 900, munition: 200, fuel: 190 });
  assert.ok(r.events.some(e => e.type === 'ResearchStarted'));
  assert.equal(economy.validateResearch(r.state, cmd(), data), 'not_offered', 'under way');
  assert.equal(economy.validateResearch(r.state, cmd({ research: 'bar_riflemen_global_us' }), data), 'busy');
  let s = r.state;
  for (let t = 0; t < 2; t++) s = nextOwnTurn(s, data);
  assert.equal(skillReady(s, s.units.u1, 'grenade_riflemen_us', data), 'needs_unlock', 'one turn to go');
  s = nextOwnTurn(s, data);
  assert.ok(s.teams.blue.unlocks.includes('grenade_riflemen_us'));
  assert.equal(skillReady(s, s.units.u1, 'grenade_riflemen_us', data), null, 'the ability is unlocked');
  assert.equal(economy.researchOffers(s, data, 'bx').includes('grenade_riflemen_us'), false, 'researched once');
});

test('research a unit: the building then produces it, and the conversion to it is open', () => {
  const { state: s0, data } = testMatch([{ team: 'blue', sbps: 'sherman_us', pos: H(5, 5) }], MAP);
  const state = rich(s0);
  assert.equal(economy.offers(state, data, 'tx').includes('sherman_76mm_us'), false);
  assert.equal(apply(state, { type: 'Convert', side: 'blue', unit: 'u1', to: 'sherman_76mm_us' }, data, createRng(1)).error, 'needs_research');
  const item = economy.researchOf(state, data, 'tx', 'sherman_76mm_us');
  assert.deepEqual([item.unlocks, item.turns], ['unit', 2], 'recommended: half the unit price, 2 turns');
  let s = run(state, data, { type: 'Research', side: 'blue', building: 'tx', research: 'sherman_76mm_us' }).state;
  s = nextOwnTurn(nextOwnTurn(s, data), data);
  assert.ok(economy.offers(s, data, 'tx').includes('sherman_76mm_us'));
  assert.equal(economy.validateConvert(s, { unit: 'u1', to: 'sherman_76mm_us' }, data), null);
});
