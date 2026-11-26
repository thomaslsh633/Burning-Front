import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as terrain from '../../../src/logic/terrain/index.js';
import { apply } from '../../../src/logic/commands/index.js';
import * as mv from '../../../src/logic/movement/index.js';
import { coverAgainst } from '../../../src/logic/vision/index.js';
import { createRng } from '../../../src/services/rng/index.js';
import { edgeKey, neighbours, distance } from '../../../src/logic/hex/index.js';
import { testMatch, tweak } from '../../helpers/match.js';
import { gameData } from '../../helpers/game-data.js';

const H = (c, r) => ({ c, r });
const rules = gameData().rules.terrain;
const weapon = id => gameData().units.weapon[id];

test('geometry: neighbouring centres are 1 apart; crossing segments', () => {
  for (const n of neighbours(H(4, 4))) {
    const a = terrain.hexCentre(H(4, 4)), b = terrain.hexCentre(n);
    assert.ok(Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - 1) < 1e-9);
  }
  const P = (x, y) => ({ x, y });
  assert.equal(terrain.segmentsCross(P(0, 0), P(2, 0), P(1, -1), P(1, 1)), true);
  assert.equal(terrain.segmentsCross(P(0, 0), P(2, 0), P(3, -1), P(3, 1)), false);
});

test('a line takes exactly the edges whose centre-to-centre segment it crosses', () => {
  // a vertical line between columns 4 and 5 over rows 1–3 separates the hexes on either side
  const edges = terrain.lineEdges([[4.75, 0.6], [4.75, 3.4]], 12, 10).map(e => e.edge);
  assert.ok(edges.includes(edgeKey(H(4, 2), 0)), 'row 2: between (4,2) and (5,2)');
  assert.ok(edges.includes(edgeKey(H(4, 1), 0)), 'row 1 (odd): between (4,1) and (5,1)');
  // every derived edge separates two hexes on opposite sides of x = 4.75
  for (const k of edges) {
    const [c, r, d] = k.split(',').map(Number), a = terrain.hexCentre(H(c, r)), b = terrain.hexCentre(neighbours(H(c, r))[d]);
    assert.ok((a.x - 4.75) * (b.x - 4.75) < 0, k);
  }
});

test('a diagonal wall at a natural angle: no step of any path crosses it, and it really separates hexes', () => {
  const wall = [[1.2, 1.1], [7.9, 6.2]];
  const { state, data } = testMatch([{ team: 'blue', sbps: 'sherman_us', pos: H(2, 5) }], { lines: [{ id: 'w', kind: 'stone_wall', points: wall }] });
  const A = terrain.mapPoint(wall[0]), B = terrain.mapPoint(wall[1]);
  const reach = mv.reachable(state, data, 'u1', { points: 30 });
  let steps = 0;
  for (const [k, v] of reach) {
    if (!v.prev) continue;
    const [c, r] = k.split(',').map(Number), [pc, pr] = v.prev.split(',').map(Number);
    assert.equal(terrain.segmentsCross(terrain.hexCentre(H(pc, pr)), terrain.hexCentre(H(c, r)), A, B), false, `step ${v.prev} → ${k} crosses the wall`);
    steps++;
  }
  assert.ok(steps > 20);
  assert.ok(Object.keys(data.maps.test.edges).length >= 8, 'the wall occupies a run of edges');
});

test('compile: legend rows, elevation, errors for wrong sizes, unknown codes and overlaps', () => {
  const def = { meta: { id: 'm', cols: 4, rows: 2 }, legend: { ground: { '.': 'plains', '=': 'road' }, objects: { '.': null, 'f': 'forest' } },
    ground: ['..==', '....'], objects: ['f...', '...f'], elevation: ['0012', '0000'],
    structures: [{ id: 'a', kind: 'house', hexes: ['1,1'] }, { id: 'b', kind: 'house', hexes: ['1,1'] }] };
  const { map, errors } = terrain.compileMap(def, rules);
  assert.deepEqual(map.hexes['2,0'], { ground: 'road', elev: 1 });
  assert.deepEqual(map.hexes['0,0'], { object: 'forest' });
  assert.deepEqual(errors, ['structure b: hex 1,1 already belongs to a']);
  const bad = terrain.compileMap({ meta: { id: 'm', cols: 4, rows: 2 }, legend: { ground: { '.': 'plains' } }, ground: ['..x.', '...'], lines: [{ id: 'l', kind: 'laser', points: [[0, 0], [1, 1]] }] }, rules);
  assert.deepEqual(bad.errors, ['ground row 0: code "x" is not in legend.ground', 'ground row 1: 3 hexes, the map has 4', 'line l: unknown kind "laser"']);
});

test('who can damage what: small arms never; explosives, fire and AT weapons do', () => {
  const { data } = testMatch([]);
  const sandbag = rules.lines.sandbag_row;
  assert.equal(terrain.canDamage(data, sandbag, weapon('garand_rifleman_us')), false);
  assert.equal(terrain.canDamage(data, sandbag, weapon('81mm_mortar_us')), true);
  assert.equal(terrain.canDamage(data, sandbag, weapon('57mm_at_gun_us')), true);
  assert.equal(terrain.canDamage(data, rules.wrecks.vehicle, weapon('flamethrower_panzerpioneer_ak')), false, 'fire does not burn a wreck');
});

test('a line segment loses HP, then breaks; a stone wall leaves a rubble wall', () => {
  const e = edgeKey(H(4, 4), 0);
  const { state, data } = testMatch([], { edges: { [e]: 'stone_wall' } });
  const hit = amount => ({ amount, pen: 300, weapon: weapon('57mm_at_gun_us') });
  const a = terrain.damageEdge(state, data, H(4, 4), H(5, 4), hit(150));
  assert.equal(a.state.map.changes.segments[`edge:${e}:0`].hp, 250);
  const b = terrain.damageEdge(a.state, data, H(4, 4), H(5, 4), hit(300));
  assert.equal(terrain.edgeAt(b.state, data, H(4, 4), H(5, 4)).kind, 'rubble_wall');
  assert.equal(b.events[0].type, 'FeatureDestroyed');
  const small = terrain.damageEdge(state, data, H(4, 4), H(5, 4), { amount: 999, weapon: weapon('garand_rifleman_us') });
  assert.equal(small.state, state);
});

test('vehicles crush fences, hedges, wire and sandbags as they drive over them; infantry do not', () => {
  const e = edgeKey(H(3, 4), 0);
  const tank = testMatch([{ team: 'blue', sbps: 'sherman_us', pos: H(3, 4), facing: 0 }], { edges: { [e]: 'wire' } });
  const r = apply(tank.state, { type: 'Move', side: 'blue', unit: 'u1', to: H(4, 4) }, tank.data, null);
  assert.equal(terrain.edgeAt(r.state, tank.data, H(3, 4), H(4, 4)), null);
  assert.ok(r.events.some(x => x.type === 'Crushed'));
  const inf = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(3, 4) }], { edges: { [e]: 'wire' } });
  const s = apply(inf.state, { type: 'Move', side: 'blue', unit: 'u1', to: H(4, 4) }, inf.data, null);
  assert.equal(terrain.edgeAt(s.state, inf.data, H(3, 4), H(4, 4)).kind, 'wire');
});

test('buildings: HP by size, block movement and sight; collapse leaves rubble and kills the garrison', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(8, 8) }, { team: 'red', sbps: 'grenadier_ger', pos: H(5, 5) }],
    { structures: [{ id: 'h1', kind: 'house_small', hexes: ['5,5', '6,5'] }] });
  const inside = tweak(state, 'u2', { container: 'h1', fsm: { ...state.units.u2.fsm, location: 'GARRISONED' } });
  assert.equal(terrain.structureAt(inside, data, H(6, 5)).hp, 600);
  const r = terrain.damageStructure(inside, data, 'h1', { amount: 700, pen: 200, weapon: weapon('81mm_mortar_us') });
  assert.equal(r.collapsed, true);
  assert.deepEqual(r.garrison, ['u2']);
  assert.equal(terrain.hexAt(r.state, data, H(6, 5)).featureId, 'rubble');
  assert.equal(coverAgainst(r.state, data, { ...r.state.units.u2, fsm: { ...r.state.units.u2.fsm, location: 'ON_MAP' } }, H(2, 5)), 'light');
});

test('HQ buildings never collapse', () => {
  const { state, data } = testMatch([], { structures: [{ id: 'hq', kind: 'hq', hexes: ['2,2'] }] });
  const r = terrain.damageStructure(state, data, 'hq', { amount: 99999, weapon: weapon('81mm_mortar_us') });
  assert.equal(r.collapsed, false);
  assert.equal(terrain.structureAt(r.state, data, H(2, 2)).hp, 1);
});

test('AttackFeature with explosives brings a house down and kills the garrison', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'mortar_81mm_us', pos: H(1, 5), stance: 'EMPLACED' }, { team: 'red', sbps: 'grenadier_ger', pos: H(5, 5) }],
    { structures: [{ id: 'h1', kind: 'house_small', hexes: ['5,5'] }] });
  let s = tweak(state, 'u2', { container: 'h1', fsm: { ...state.units.u2.fsm, location: 'GARRISONED' } });
  for (let i = 0; i < 12 && s.units.u2; i++) {
    s = tweak(s, 'u1', { budget: { ...s.units.u1.budget, action: 1 }, fsm: { ...s.units.u1.fsm, action: 'IDLE' }, ammo: 12 });
    const r = apply(s, { type: 'AttackFeature', side: 'blue', unit: 'u1', target: { hex: H(5, 5) } }, data, createRng(i));
    assert.equal(r.error, undefined);
    s = r.state;
  }
  assert.equal(s.units.u2, undefined, 'garrison died in the collapse');
  assert.equal(s.map.changes.structures.h1.collapsed, true);
});

test('wrecks can be shot apart by AT weapons', () => {
  const { state, data } = testMatch([]);
  const w = terrain.placeWreck(state, data, H(3, 3), 'vehicle');
  const r = terrain.damageHex(w.state, data, H(3, 3), { amount: 500, pen: 300, weapon: weapon('57mm_at_gun_us') });
  assert.equal(terrain.hexAt(r.state, data, H(3, 3)).featureKind, null);
});

test('defensive lines placed by a side take that faction\'s CoH3 HP and armour; neutral ones the rule values', () => {
  const { state, data } = testMatch([]);
  assert.deepEqual(terrain.featureHp(state, data, rules.lines.sandbag_row, 'blue'), { hp: data.units.ebps.sandbag_wall_us.hp, armor: data.units.ebps.sandbag_wall_us.armor.front });
  assert.deepEqual(terrain.featureHp(state, data, rules.lines.wire, 'red'), { hp: 150, armor: 20 });
  assert.deepEqual(terrain.featureHp(state, data, rules.lines.hedge, null), { hp: 150, armor: 1 });
});

test('clearWreck: one turn of work at a time; a vehicle wreck goes after its clear_turns', () => {
  const { state, data } = testMatch([]);
  const placed = terrain.placeWreck(state, data, H(4, 4), 'vehicle').state;
  const one = terrain.clearWreck(placed, data, H(4, 4));
  assert.deepEqual([one.cleared, one.state.map.changes.hexes['4,4'].wreck.work], [false, 1]);
  assert.equal(one.events[0].type, 'WreckClearing');
  const two = terrain.clearWreck(one.state, data, H(4, 4));
  assert.equal(two.cleared, true);
  assert.equal(terrain.hexAt(two.state, data, H(4, 4)).featureKind, null);
  assert.deepEqual(two.events, [{ type: 'WreckCleared', hex: H(4, 4), kind: 'vehicle' }]);
  assert.equal(terrain.clearWreck(state, data, H(4, 4)).state, state, 'no wreck: nothing');
});
