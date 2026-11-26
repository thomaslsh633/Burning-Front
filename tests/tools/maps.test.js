// Map definitions: legacy conversion, schema and compile through the build step, and a match on a real map.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { convert } from '../../tools/maps/import-legacy.js';
import { buildData } from '../../tools/build-data.js';
import { createMatch } from '../../src/logic/state/index.js';
import { hexAt, structureAt } from '../../src/logic/terrain/index.js';
import { reachable } from '../../src/logic/movement/index.js';
import { refreshUnit } from '../../src/logic/turn/index.js';
import { gameData } from '../helpers/game-data.js';
import { repo, tempRoot, writeJson } from '../helpers/temp-root.js';

const legacy = id => JSON.parse(fs.readFileSync(new URL(`../../data/legacy-snapshot/maps/${id}.json`, import.meta.url), 'utf8'));

test('legacy conversion: rows per layer, buildings grouped into structures, text out of the map', () => {
  const { def, text } = convert(legacy('skirmish'), (t, k) => ({ infantry: t === 'blue' ? 'riflemen_us' : 'grenadier_ger' })[k] ?? null, new Set(['riflemen_us', 'grenadier_ger']));
  assert.equal(def.ground.length, 14);
  assert.ok(def.ground.every(r => r.length === 22));
  assert.ok(def.structures.some(s => s.kind === 'hq' && s.team === 'blue'));
  assert.ok(def.structures.filter(s => s.kind.startsWith('house')).every(s => s.hexes.length >= 1));
  assert.equal(def.points[0].name, 'map.skirmish.point.cp_0');
  assert.equal(text.ko['map.skirmish.point.cp_0'], '중앙 교차로');
  assert.ok(!JSON.stringify(def).match(/[가-힣]/), 'no Korean text in the map file');
  assert.deepEqual([...new Set(def.placements.map(p => p.sbps))].sort(), ['grenadier_ger', 'riflemen_us']);
});

test('the repo maps compile through the build step with no errors', () => {
  const { maps, errors } = buildData(repo);
  assert.deepEqual(errors, []);
  assert.deepEqual(Object.keys(maps).sort(), ['faymonville', 'skirmish']);
  assert.equal(maps.faymonville.cols, 48);
  assert.ok(Object.values(maps.faymonville.hexes).some(h => h.oob), 'out-of-bounds border kept');
});

test('a broken map is rejected: schema, unknown kinds, unknown squads, wrong folder', () => {
  const root = tempRoot();
  writeJson(root, 'data/maps/bad/map.json', { meta: { id: 'other', cols: 6, rows: 4 }, lines: [{ id: 'l', kind: 'laser', points: [[0, 0], [2, 2]] }],
    placements: [{ team: 'blue', sbps: 'nope_us', hex: '1,1' }] });
  const { errors } = buildData(root);
  assert.ok(errors.includes('map bad: meta.id "other" must match the folder name'));
  writeJson(root, 'data/maps/bad/map.json', { meta: { id: 'bad', cols: 6, rows: 4 }, lines: [{ id: 'l', kind: 'laser', points: [[0, 0], [2, 2]] }],
    placements: [{ team: 'blue', sbps: 'nope_us', hex: '1,1' }] });
  const second = buildData(root).errors;
  assert.ok(second.includes('map bad: line l: unknown kind "laser"'));
  assert.ok(second.includes('map bad: placement at 1,1 names unknown squad "nope_us"'));
});

test('a match on the converted Skirmish map: placements become units, buildings block, rally from the map', () => {
  const data = gameData();
  let s = createMatch({ map: { id: 'skirmish' }, order: ['blue', 'red'], rng: 1,
    teams: { blue: { faction: 'american', resources: {} }, red: { faction: 'german', resources: {} } } }, data);
  assert.ok(Object.keys(s.units).length >= 10);
  assert.ok(s.teams.blue.rally && s.teams.red.rally);
  const hq = data.maps.skirmish.structures.base_blue;
  assert.equal(structureAt(s, data, { c: +hq.hexes[0].split(',')[0], r: +hq.hexes[0].split(',')[1] }).kind, 'hq');
  s = { ...s, match: { ...s.match, turn: 1, side: 'blue' } };
  const rifle = Object.values(s.units).find(u => u.sbps === 'riflemen_us');
  s = refreshUnit(s, rifle.id, data).state;
  const reach = reachable(s, data, rifle.id);
  assert.ok(reach.size > 10);
  for (const k of reach.keys()) assert.equal(hexAt(s, data, { c: +k.split(',')[0], r: +k.split(',')[1] }).featureKind === 'structure', false);
});
