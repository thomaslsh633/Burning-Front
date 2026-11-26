import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUnit, checkUnit, createMatch, unitAt, unitsOf, enemyOf, putUnit } from '../../../src/logic/state/index.js';
import { gameData } from '../../helpers/game-data.js';

const data = gameData();

test('a squad becomes one member per model with the entity HP', () => {
  const u = createUnit({ id: 'u1', team: 'blue', sbps: 'riflemen_us', pos: { c: 2, r: 3 } }, data);
  assert.equal(u.kind, 'squad');
  assert.equal(u.members.length, 6);
  assert.deepEqual(u.members[0], { ebps: 'rifleman_squad_leader_us', hp: data.units.ebps.rifleman_squad_leader_us.hp });
  assert.equal(u.ammo, data.units.sbps.riflemen_us.supply.ammo);
  assert.deepEqual(u.fsm, { life: 'ACTIVE', location: 'ON_MAP', stance: 'MOBILE', morale: 'NORMAL', action: 'EXHAUSTED', visibility: 'REVEALED' });
  assert.deepEqual(checkUnit(u), []);
});

test('team weapons may start emplaced; other kinds stay mobile', () => {
  assert.equal(createUnit({ id: 'g', team: 'blue', sbps: 'at_gun_57mm_us', pos: { c: 0, r: 0 }, stance: 'EMPLACED' }, data).fsm.stance, 'EMPLACED');
  assert.equal(createUnit({ id: 't', team: 'blue', sbps: 'sherman_us', pos: { c: 0, r: 0 }, stance: 'EMPLACED' }, data).fsm.stance, 'MOBILE');
  assert.throws(() => createUnit({ id: 'x', team: 'blue', sbps: 'nope_us', pos: { c: 0, r: 0 } }, data));
});

test('invariants catch inconsistent units', () => {
  const u = createUnit({ id: 'u1', team: 'blue', sbps: 'riflemen_us', pos: { c: 0, r: 0 } }, data);
  assert.deepEqual(checkUnit({ ...u, container: 'b1' }), ['container set ⇔ location GARRISONED or LOADED']);
  assert.deepEqual(checkUnit({ ...u, fsm: { ...u.fsm, stance: 'EMPLACED' } }), ['only team weapons leave stance MOBILE']);
  assert.deepEqual(checkUnit({ ...u, fsm: { ...u.fsm, action: 'OVERWATCH' } }), ['overwatch set ⇔ action OVERWATCH']);
  assert.deepEqual(checkUnit({ ...u, fsm: { ...u.fsm, life: 'WRECKED' }, budget: { move: 2, action: 0, counter: 0 } }), ['a unit that is not ACTIVE is EXHAUSTED with no budget']);
});

test('createMatch and selectors', () => {
  const s = createMatch({ map: { id: 'm' }, order: ['blue', 'red'], rng: 99,
    teams: { blue: { faction: 'american', resources: { manpower: 600 } }, red: { faction: 'german', resources: { manpower: 600 } } },
    units: [{ team: 'blue', sbps: 'riflemen_us', pos: { c: 1, r: 1 } }, { team: 'red', sbps: 'grenadier_ger', pos: { c: 8, r: 6 } }] },
    { ...data, maps: { m: { cols: 10, rows: 8 } } });
  assert.deepEqual(s.map, { id: 'm', cols: 10, rows: 8, changes: { hexes: {}, segments: {}, structures: {} } });
  assert.deepEqual(Object.keys(s.units), ['u1', 'u2']);
  assert.equal(unitAt(s, { c: 8, r: 6 }).sbps, 'grenadier_ger');
  assert.equal(unitAt(s, { c: 0, r: 0 }), undefined);
  assert.equal(unitsOf(s, 'blue').length, 1);
  assert.equal(enemyOf(s, 'blue'), 'red');
  assert.equal(s.rng, 99);
  const moved = putUnit(s, { ...s.units.u1, pos: { c: 2, r: 1 } });
  assert.equal(moved.units.u1.pos.c, 2);
  assert.equal(s.units.u1.pos.c, 1, 'putUnit returns a new state');
});

test('spawnUnit takes the next free id; members carried over keep their HP', async () => {
  const { spawnUnit } = await import('../../../src/logic/state/index.js');
  const m = createMatch({ map: { id: 'skirmish' }, order: ['blue', 'red'], teams: { blue: { faction: 'american' }, red: { faction: 'german' } },
    units: [{ team: 'blue', sbps: 'riflemen_us', pos: { c: 1, r: 1 } }], rng: 1 }, data);
  const r = spawnUnit(m, { team: 'blue', sbps: 'at_gun_57mm_us', pos: { c: 2, r: 1 }, members: [{ ebps: 'crew_at_gun_57mm_us', hp: 40 }] }, data);
  assert.equal(r.id, 'u2');
  assert.equal(r.state.match.nextId, 3);
  assert.deepEqual(r.state.units.u2.members, [{ ebps: 'crew_at_gun_57mm_us', hp: 40 }]);
  assert.equal(r.state.units.u2.engaged, false);
});
