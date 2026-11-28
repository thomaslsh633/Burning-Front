import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildProduction, isSupportVehicle, productionReport } from '../../tools/coh3/production.js';

const unit = (id, category, producers, tags, extra = {}) => ({ id, category, producers, tags, source: 'produced', price: { cost: { manpower: 300 } }, ...extra });
const units = [
  unit('rifles_us', 'infantry', ['bar'], ['infantry', 'rifleman']),
  unit('truck_4x4_us', 'vehicles', ['bar'], ['vehicle']),
  unit('tank_us', 'vehicles', ['depot'], ['vehicle', 'medium_armor']),
  unit('tank_cmd_us', 'vehicles', [], ['vehicle', 'medium_armor'], { source: 'restored', price: { cost: { manpower: 400 } } }),
  unit('para_us', 'infantry', [], ['infantry', 'elite'], { source: 'called_in' }),
  unit('heavy_us', 'vehicles', [], ['vehicle', 'heavy_armor'], { source: 'restored' }),
  unit('hero_us', 'infantry', [], ['infantry'], { source: 'coh3stats', hero: true }),
  unit('ambulance_us', 'vehicles', [], ['vehicle', 'healer'], { source: 'restored' }),
  unit('bunker_us', 'emplacements', [], [], { source: 'built' }),
  unit('engineer_us', 'infantry', ['hq'], ['infantry', 'combat_engineer']),
  unit('scout_us', 'infantry', ['hq'], ['infantry']),
  unit('captain_us', 'infantry', ['hq'], ['infantry', 'captain']),
  unit('guastatori_us', 'infantry', ['hq'], ['infantry', 'combat_engineer', 'elite_infantry']),
  unit('lt_us', 'vehicles', [], ['vehicle', 'tier3'], { source: 'restored' }),
];
const roster = { american: { units } };
const prod = { factions: { american: { slots: { hq: 'hq', t1: 'bar', t2: 'wsc', t3: 'depot' }, tier2: 'wsc' } } };
const empty = slot => ({ slot, base: [], doctrine: [], research: [] });

test('support vehicles: trucks, ambulances, medical / recovery vehicles, healers; never armour', () => {
  assert.equal(isSupportVehicle(units[1]), true);
  assert.equal(isSupportVehicle(units[7]), true);
  assert.equal(isSupportVehicle(units[2]), false);
});

test('per faction: CoH3 spawner lists; support vehicles to Tier 2; base / doctrine / research', () => {
  const out = buildProduction(roster, prod, [{ from: 'rifles_us', to: 'ranger_us', unlock: 'doctrine' }]).american;
  assert.deepEqual(out.hq, { ...empty('hq'), base: ['engineer_us', 'scout_us'] }, 'HQ: base engineers and recon only');
  assert.deepEqual(out.bar, { ...empty('t1'), base: ['captain_us', 'guastatori_us', 'rifles_us'], doctrine: ['para_us'], research: ['hero_us'] },
    'an elite engineer and the captain leave the HQ; a call-in is doctrine; a hero is research');
  assert.deepEqual(out.wsc, { ...empty('t2'), base: ['ambulance_us', 'truck_4x4_us'] });
  assert.deepEqual(out.depot, { ...empty('t3'), base: ['lt_us', 'tank_us'], research: ['heavy_us', 'tank_cmd_us'] }, 'tier3 tag → T3; heavy armour and a pricier variant → research');
});

test('conversion targets: only by conversion unless a building spawns them; locked as the conversion is', () => {
  const r = { american: { units: [...units, unit('ranger_us', 'infantry', ['hq'], ['infantry']), unit('m76_us', 'vehicles', [], ['vehicle'], { source: 'restored' })] } };
  const out = buildProduction(r, prod, [{ from: 'rifles_us', to: 'ranger_us', unlock: 'doctrine' }, { from: 'tank_us', to: 'm76_us', unlock: 'research' }]).american;
  assert.ok(out.bar.doctrine.includes('ranger_us'));
  assert.ok(!Object.values(out).some(v => [...v.base, ...v.doctrine, ...v.research].includes('m76_us')));
});

test('hand overrides: place and unlock', () => {
  const out = buildProduction(roster, { ...prod, place: { para_us: 'depot' }, unlock: { para_us: 'research', heavy_us: 'base' } }).american;
  assert.deepEqual(out.depot, { ...empty('t3'), base: ['heavy_us', 'lt_us', 'tank_us'], research: ['para_us', 'tank_cmd_us'] });
});

test('the report: per faction, per building, every unit with its unlock; conversions with their doctrine', () => {
  const p = { factions: { american: { ...prod.factions.american, buildings: buildProduction(roster, prod).american } } };
  const md = productionReport(roster, p, [{ from: 'rifles_us', to: 'para_us', cost: { manpower: 175 }, unlock: 'doctrine', doctrine: 'airborne' }], 'abc', new Set(['rifles_us']));
  assert.match(md, /## american/);
  assert.match(md, /### T2 — `wsc` \(Tier 2: support vehicles\)/);
  assert.match(md, /\| — ✓ \| `rifles_us` \| Base \|/);
  assert.match(md, /\| — \| `para_us` \| Doctrine \|/);
  assert.match(md, /175 MP \| Doctrine \(airborne\) \|/);
});
