import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as skills from '../../../src/logic/skills/index.js';
import { apply } from '../../../src/logic/commands/index.js';
import { checkUnit } from '../../../src/logic/state/index.js';
import { createRng } from '../../../src/services/rng/index.js';
import { testMatch } from '../../helpers/match.js';
import { assertOwnsOnly } from '../../helpers/ownership.js';

const H = (c, r) => ({ c, r });
const blue = (sbps, pos, x = {}) => ({ team: 'blue', sbps, pos, ...x });
const red = (sbps, pos, x = {}) => ({ team: 'red', sbps, pos, ...x });
const rich = (s, extra = {}) => ({ ...s, teams: { ...s.teams, blue: { ...s.teams.blue, resources: { manpower: 600, munition: 200, fuel: 20 }, ...extra } } });
const run = (s, d, cmd, seed = 1) => { const r = apply(s, cmd, d, createRng(seed)); if (r.error) throw new Error(`${cmd.type}: ${r.error}`); for (const u of Object.values(r.state.units)) assert.deepEqual(checkUnit(u), [], u.id); return r; };
const hp = u => u.members.reduce((n, m) => n + m.hp, 0);
const nextOwnTurn = (s, d) => run(run(s, d, { type: 'EndTurn', side: 'blue' }).state, d, { type: 'EndTurn', side: 'red' }).state;

test('a hex ability: a stick grenade thrown at a hex, paid in munitions, then cooling down for its CoH3 recharge in turns', () => {
  const { state: s0, data } = testMatch([blue('grenadier_ger', H(3, 5), { facing: 0 }), red('riflemen_us', H(5, 5))]);
  const state = rich(s0), cmd = x => ({ type: 'UseSkill', side: 'blue', unit: 'u1', ability: 'grenade_m24_stick_grenadier_ger', hex: H(5, 5), ...x });
  assert.ok(skills.abilitiesOf(state.units.u1, data).includes('grenade_m24_stick_grenadier_ger'));
  assert.equal(skills.validateUseSkill(state, cmd({ ability: 'grenade_riflemen_us' }), data), 'no_such_ability');
  assert.equal(skills.validateUseSkill(state, cmd({ hex: H(8, 5) }), data), 'out_of_range');
  assert.equal(skills.validateUseSkill(state, cmd({ hex: H(30, 5) }), data), 'bad_hex');
  assert.equal(skills.validateUseSkill(s0, cmd(), data), 'cannot_afford', '30 munitions; the side has 10');
  let r;
  for (let seed = 1; seed < 20 && (!r || hp(r.state.units.u2) === hp(state.units.u2)); seed++) r = run(state, data, cmd(), seed);
  assert.ok(hp(r.state.units.u2) < hp(state.units.u2), 'the grenade hurts the squad on the hex');
  assert.equal(r.state.teams.blue.resources.munition, 170);
  assert.equal(r.state.units.u1.ammo, state.units.u1.ammo, 'no ammo: the ability is paid in munitions');
  assert.ok(r.events.some(e => e.type === 'Fired' && e.hex && e.weapon === 'grenade_grenadier_ger'));
  assert.equal(r.state.units.u1.cooldowns.grenade_m24_stick_grenadier_ger, 3);
  assert.equal(apply(r.state, cmd(), data, createRng(1)).error, 'cooling_down');
  let s = r.state;
  for (let t = 0; t < 2; t++) s = nextOwnTurn(s, data);
  assert.equal(skills.validateUseSkill(s, cmd(), data), 'cooling_down', 'one turn still to wait');
  s = nextOwnTurn(s, data);
  assert.equal(skills.validateUseSkill(s, cmd(), data), null, 'ready again after 3 own turns');
  assertOwnsOnly('skills', state, skills.startCooldown(state, 'u1', 'grenade_m24_stick_grenadier_ger', data).state);
});

test('a unit ability: a Panzerfaust at a Sherman in sight; the Sherman fires back', () => {
  const { state: s0, data } = testMatch([blue('grenadier_ger', H(3, 5), { facing: 0 }), red('sherman_us', H(5, 5), { facing: 3 })]);
  const armed = { ...s0, units: { ...s0.units, u2: { ...s0.units.u2, budget: { ...s0.units.u2.budget, counter: 1 } } } };   // red's counter for blue's turn
  const state = rich(armed);
  const cmd = { type: 'UseSkill', side: 'blue', unit: 'u1', ability: 'panzerfaust_grenadier_ger', target: 'u2' };
  assert.equal(skills.validateUseSkill(state, { ...cmd, target: undefined }, data), 'no_target');
  const r = run(state, data, cmd);
  assert.ok(r.events.some(e => e.type === 'Fired' && e.unit === 'u1' && e.weapon === 'panzerfaust_grenadier_ger'));
  assert.ok(r.events.some(e => e.type === 'CounterFired' && e.unit === 'u2'));
  assert.equal(r.state.units.u1?.budget.action ?? 0, 0);
});

test('requirements: the Riflemen grenade needs its CoH3 research; a barrage needs the mortar set up', () => {
  const { state: s0, data } = testMatch([blue('riflemen_us', H(3, 5), { facing: 0 }), blue('mortar_81mm_us', H(2, 2), { facing: 0 }), red('grenadier_ger', H(5, 5))]);
  const g = { type: 'UseSkill', side: 'blue', unit: 'u1', ability: 'grenade_riflemen_us', hex: H(5, 5) };
  assert.equal(skills.validateUseSkill(rich(s0), g, data), 'needs_unlock');
  assert.equal(skills.validateUseSkill(rich(s0, { unlocks: ['all'] }), g, data), null);
  const b = { type: 'UseSkill', side: 'blue', unit: 'u2', ability: 'barrage_81mm_mortar_us', hex: H(8, 2) };
  assert.equal(skills.validateUseSkill(s0, b, data), 'must_emplace');
  const set = { ...s0, units: { ...s0.units, u2: { ...s0.units.u2, fsm: { ...s0.units.u2.fsm, stance: 'EMPLACED' } } } };
  assert.equal(skills.validateUseSkill(set, b, data), null, 'into the fog: CoH3 barrages may target unseen ground');
  assert.equal(skills.validateUseSkill(set, { ...b, hex: H(3, 3) }, data), 'too_close');
  const r = run(set, data, b);
  assert.equal(r.events.filter(e => e.type === 'Fired').length, 1);
  assert.equal(r.events.find(e => e.type === 'Fired').shots, 3, 'CoH3 shells over the turn cadence');
});
