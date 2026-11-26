import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLinks, checkI18n, textKeys, valuesAt } from '../../tools/data-links.js';

const data = () => ({
  weapon: { rifle: { garand: {} }, heavy_machine_gun: { mg30: {} } },
  ebps: { infantry: { rifleman: { weapons: [{ weapon: 'garand' }] }, crew: { weapons: [{ weapon: 'garand' }] } } },
  sbps: { infantry: { riflemen: { members: [{ entity: 'rifleman', count: 5 }], veterancy: { set: 'riflemen' },
    upgrades: { list: ['bar_kit'], pending: ['medkits'] }, abilities: ['grenade'], requires: { upgrades: ['global_bar'] } } },
  team_weapons: { hmg: { members: [{ entity: 'crew', count: 4 }], team_weapon: { weapon: 'mg30', crew_entity: 'crew' } } } },
  upgrade: { infantry: { bar_kit: { effects: [{ type: 'add_weapon', weapon: 'garand' }] } } },
  veterancy: { riflemen: {} },
  fx: { weapon: { garand: {}, mg30: {} }, ebps: { rifleman: {}, crew: {} }, sbps: { riflemen: {}, hmg: {} }, upgrade: { bar_kit: {} } },
});

test('valuesAt walks dotted paths and arrays', () => {
  const rec = { members: [{ entity: 'a' }, { entity: 'b' }], team_weapon: { weapon: 'w' }, upgrades: { list: ['x', 'y'] } };
  assert.deepEqual(valuesAt(rec, 'members[].entity'), ['a', 'b']);
  assert.deepEqual(valuesAt(rec, 'team_weapon.weapon'), ['w']);
  assert.deepEqual(valuesAt(rec, 'team_weapon.weapon_entity'), []);
  assert.deepEqual(valuesAt(rec, 'upgrades.list[]'), ['x', 'y']);
  assert.deepEqual(valuesAt(rec, 'build.menu[]'), []);
});

test('consistent data: no errors; not-imported links are grouped warnings', () => {
  const { errors, warnings } = checkLinks(data());
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, [
    'sbps upgrades.pending[]: 1 ids not defined in upgrade: medkits',
    'sbps requires.upgrades[]: 1 ids not defined in upgrade: global_bar',
    'sbps abilities[]: 1 ids no abilities data yet: grenade',
  ]);
});

test('a link the game follows is an error naming the record, the field and the id', () => {
  const d = data();
  d.sbps.infantry.riflemen.members[0].entity = 'rifleman_typo';
  d.ebps.infantry.crew.weapons[0].weapon = 'nope';
  d.sbps.team_weapons.hmg.team_weapon.weapon = 'mg42';
  delete d.veterancy.riflemen;
  d.upgrade.infantry.bar_kit.effects[0].weapon = 'bar';
  d.sbps.infantry.riflemen.upgrades.list.push('kit_typo');
  assert.deepEqual(checkLinks(d).errors.sort(), [
    'ebps crew weapons[].weapon: no weapon record "nope"',
    'sbps hmg team_weapon.weapon: no weapon record "mg42"',
    'sbps riflemen members[].entity: no ebps record "rifleman_typo"',
    'sbps riflemen upgrades.list[]: no upgrade record "kit_typo"',
    'sbps riflemen veterancy.set: no veterancy record "riflemen"',
    'upgrade bar_kit effects[].weapon: no weapon record "bar"',
  ]);
});

test('fx: an entry with no record is an error, a record with no entry a warning', () => {
  const d = data();
  d.fx.weapon.ghost = {};
  delete d.fx.sbps.hmg;
  const { errors, warnings } = checkLinks(d);
  assert.deepEqual(errors, ['fx weapon/ghost: no weapon record "ghost"']);
  assert.ok(warnings.includes('fx sbps: 1 sbps records have no fx entry: hmg'));
});

test('text keys come from fx; each language reports the keys it lacks', () => {
  const d = data();
  d.fx.sbps.riflemen = { name: 'unit.riflemen.name', desc: 'unit.riflemen.desc', icon: 'riflemen' };
  d.fx.weapon.garand = { name: 'weapon.garand.name' };
  assert.deepEqual(textKeys(d).sort(), ['unit.riflemen.desc', 'unit.riflemen.name', 'weapon.garand.name']);
  const { warnings } = checkI18n({ american: d }, {
    en: { 'unit.riflemen.name': 'Riflemen', 'unit.riflemen.desc': '…', 'weapon.garand.name': 'M1 Garand' },
    ko: { 'unit.riflemen.name': '소총수 분대' },
  });
  assert.deepEqual(warnings, ['i18n ko: 2 of 3 keys in use have no text: unit.riflemen.desc, weapon.garand.name']);
});
