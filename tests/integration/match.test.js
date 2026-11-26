// D2 exit gate (docs/dev-plan.ko.md): a whole 1v1 match played to its end through store.dispatch only. A tiny scripted
// player reads the state and logic queries to pick commands; every change goes through a command.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../../src/logic/store/index.js';
import { validate } from '../../src/logic/commands/index.js';
import { reachable } from '../../src/logic/movement/index.js';
import { createMatch, checkUnit } from '../../src/logic/state/index.js';
import { compileMap } from '../../src/logic/terrain/index.js';
import { distance, fromKey } from '../../src/logic/hex/index.js';
import { createRng } from '../../src/services/rng/index.js';
import { gameData } from '../helpers/game-data.js';

const H = (c, r) => ({ c, r });

function setup(mapDef, setupExtra) {
  const base = gameData(), compiled = compileMap({ meta: { id: 'arena', cols: 14, rows: 10 }, ...mapDef }, base.rules.terrain);
  assert.deepEqual(compiled.errors, []);
  const data = { ...base, maps: { ...base.maps, arena: compiled.map } };
  const state = createMatch({ map: { id: 'arena' }, order: ['blue', 'red'], rng: 7,
    teams: { blue: { faction: 'american', resources: { manpower: 600, munition: 10, fuel: 20 }, rally: H(0, 0) },
      red: { faction: 'german', resources: { manpower: 600, munition: 10, fuel: 20 }, rally: H(13, 9) } }, ...setupExtra }, data);
  return { data, store: createStore(state, data, { rngFrom: s => createRng({ state: s }), freeze: true }) };
}

/** One side's turn: every unit attacks an enemy it can, else walks toward the goal (a hex) or the nearest enemy; then EndTurn. */
function playTurn(store, data, goalOf) {
  const side = store.getState().match.side;
  for (const id of Object.keys(store.getState().units)) {
    const s = store.getState(), u = s.units[id];
    if (!u || u.team !== side || u.fsm.life !== 'ACTIVE') continue;
    const enemies = Object.values(s.units).filter(e => e.team && e.team !== side && e.fsm.life === 'ACTIVE');
    const target = enemies.find(e => !validate(s, { type: 'Attack', side, unit: id, target: e.id }, data));
    if (target) { store.dispatch({ type: 'Attack', side, unit: id, target: target.id }); continue; }
    const goal = goalOf?.(u) ?? enemies.map(e => e.pos).sort((a, b) => distance(u.pos, a) - distance(u.pos, b))[0];
    if (!goal) continue;
    const best = [...reachable(s, data, id)].filter(([, v]) => v.stop).map(([k]) => fromKey(k))
      .sort((a, b) => distance(a, goal) - distance(b, goal))[0];
    if (best && distance(best, goal) < distance(u.pos, goal)) store.dispatch({ type: 'Move', side, unit: id, to: best });
  }
  for (const u of Object.values(store.getState().units)) assert.deepEqual(checkUnit(u), [], `unit ${u.id}`);
  assert.equal(store.dispatch({ type: 'EndTurn', side }).error, undefined);
}

function play(store, data, goalOf, maxTurns = 60) {
  const seen = new Set();
  store.subscribe((s, events) => events.forEach(e => seen.add(e.type)));
  assert.equal(store.dispatch({ type: 'StartMatch', side: null }).error, undefined);
  while (!store.getState().match.over && store.getState().match.turn <= maxTurns) playTurn(store, data, goalOf);
  return { ...store.getState(), seen };
}

test('annihilation: a 1v1 match ends when one side has no units and cannot field another', () => {
  const { store, data } = setup({}, {
    mode: 'annihilation',
    units: [{ team: 'blue', sbps: 'sherman_us', pos: H(1, 4) }, { team: 'blue', sbps: 'riflemen_us', pos: H(1, 6) },
      { team: 'red', sbps: 'grenadier_ger', pos: H(10, 5), facing: 3 }],
  });
  const end = play(store, data);
  assert.deepEqual(end.match.over, { winner: 'blue', reason: 'annihilation' });
  assert.equal(Object.values(end.units).filter(u => u.team === 'red').length, 0);
  for (const t of ['Moved', 'Fired', 'UnitDestroyed', 'IncomeReceived', 'MatchEnded']) assert.ok(end.seen.has(t), t);
  assert.equal(store.dispatch({ type: 'EndTurn', side: end.match.side }).error, 'match_over');
});

test('capture: holding the only VP bleeds the enemy to 0 tickets', () => {
  const { store, data } = setup({ points: [{ id: 'vp', kind: 'vp', hex: '3,5', radius: 1 }] }, {
    mode: 'capture',
    units: [{ team: 'blue', sbps: 'riflemen_us', pos: H(2, 5) }, { team: 'blue', sbps: 'riflemen_us', pos: H(3, 4) },
      { team: 'red', sbps: 'grenadier_ger', pos: H(13, 1) }],
    teams: { blue: { faction: 'american', resources: { manpower: 0 }, tickets: 12, rally: H(0, 0) },
      red: { faction: 'german', resources: { manpower: 0 }, tickets: 12, rally: H(13, 9) } },
  });
  const end = play(store, data, u => (u.team === 'blue' ? H(3, 5) : H(13, 1)));   // blue holds the VP, red keeps away
  assert.deepEqual(end.match.over, { winner: 'blue', reason: 'tickets' });
  assert.equal(end.points[0].owner, 'blue');
  assert.equal(end.teams.red.tickets, 0);
  for (const t of ['PointCaptured', 'TicketsLost', 'MatchEnded']) assert.ok(end.seen.has(t), t);
});
