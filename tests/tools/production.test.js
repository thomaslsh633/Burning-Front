import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildProduction, isSupportVehicle, productionReport } from '../../tools/coh3/production.js';

const unit = (id, category, producers, tags, extra = {}) => ({ id, category, producers, tags, source: 'produced', price: { cost: { manpower: 300 } }, ...extra });
const roster = { american: { units: [
  unit('rifles_us', 'infantry', ['bar'], ['infantry', 'rifleman']),
  unit('truck_4x4_us', 'vehicles', ['bar'], ['vehicle']),
  unit('tank_us', 'vehicles', ['depot'], ['vehicle', 'medium_armor']),
  unit('tank_cmd_us', 'vehicles', [], ['vehicle', 'medium_armor'], { source: 'called_in', price: { cost: { manpower: 400 } } }),
  unit('para_us', 'infantry', [], ['infantry', 'elite'], { source: 'called_in' }),
  unit('heavy_us', 'vehicles', [], ['vehicle', 'heavy_armor'], { source: 'called_in' }),
  unit('ambulance_us', 'vehicles', [], ['vehicle', 'healer'], { source: 'restored' }),
  unit('bunker_us', 'emplacements', [], [], { source: 'built' }),
] } };
const prod = { types: { barracks: { american: 'bar' }, support_center: { american: 'wsc' }, tank_depot: { american: 'depot' } }, tier2: { american: 'wsc' } };

test('support vehicles: trucks, ambulances, medical / recovery vehicles, healers; never armour', () => {
  assert.equal(isSupportVehicle(roster.american.units[1]), true);
  assert.equal(isSupportVehicle(roster.american.units[6]), true);
  assert.equal(isSupportVehicle(roster.american.units[2]), false);
});

test('CoH3 spawner lists; support vehicles to Tier 2; others join the closest building, research only when high tier', () => {
  assert.deepEqual(buildProduction(roster, prod), {
    bar: { squads: ['para_us', 'rifles_us'], research: [] },
    depot: { squads: ['tank_us'], research: ['heavy_us', 'tank_cmd_us'] },
    wsc: { squads: ['ambulance_us', 'truck_4x4_us'], research: [] },
  });
});

test('hand overrides: place and research', () => {
  const r = buildProduction(roster, { ...prod, place: { para_us: 'depot' }, research: { para_us: true, heavy_us: false } });
  assert.deepEqual(r.depot, { squads: ['heavy_us', 'tank_us'], research: ['para_us', 'tank_cmd_us'] });
});

test('squads reached only by conversion are not produced', () => {
  const r = buildProduction(roster, prod, new Set(['para_us']));
  assert.deepEqual(r.bar.squads, ['rifles_us']);
});

test('the report lists every unit with its building, availability, and conversions', () => {
  const md = productionReport(roster, { ...prod, buildings: buildProduction(roster, prod) },
    [{ from: 'rifles_us', to: 'para_us', cost: { manpower: 175 }, research: true }], 'abc', new Set(['rifles_us']));
  assert.match(md, /\| `barracks` \| `bar` \| — ✓ \| `rifles_us` \| Start \|/);
  assert.match(md, /\| `tank_depot` \| `depot` \| — \| `heavy_us` \| Research \|/);
  assert.match(md, /\| `support_center` \(Tier 2\) \| `wsc` \| — \| `truck_4x4_us` \| Start \|/);
  assert.match(md, /175 MP \| Research \|/);
});

test('the HQ makes only engineers and recon; tier tags pick the tier; research-locked conversion targets stay locked', () => {
  const r = { american: { units: [
    unit('engineer_us', 'infantry', ['hq'], ['infantry', 'combat_engineer']),
    unit('scout_us', 'infantry', ['hq'], ['infantry']),
    unit('captain_us', 'infantry', ['hq'], ['infantry', 'captain']),
    unit('rifles_us', 'infantry', ['bar'], ['infantry']),
    unit('lt_us', 'vehicles', [], ['vehicle', 'tier3'], { source: 'called_in' }),
    unit('tank_us', 'vehicles', ['depot'], ['vehicle', 'medium_armor']),
    unit('ranger_us', 'infantry', ['hq'], ['infantry', 'elite']),
  ] } };
  const p = { types: { hq: { american: 'hq' }, t1: { american: 'bar' }, t2: { american: 'mp' }, t3: { american: 'depot' } } };
  const out = buildProduction(r, p, new Set(['ranger_us']), new Set(['ranger_us']));
  assert.deepEqual(out.hq, { squads: ['engineer_us', 'scout_us'], research: [] });
  assert.deepEqual(out.bar, { squads: ['captain_us', 'rifles_us'], research: ['ranger_us'] });
  assert.deepEqual(out.depot.squads, ['lt_us', 'tank_us'], 'tier3 tag → T3, not the empty T2');
});
