import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apply } from '../../../src/logic/commands/index.js';
import { UNIT_TURN_START, UNIT_TURN_END, SIDE_TURN_START } from '../../../src/logic/commands/phases.js';
import { MACHINES } from '../../../src/logic/commands/steps.js';
import { permits } from '../../../src/logic/fsm/index.js';
import * as combat from '../../../src/logic/combat/index.js';
import { AXES, checkUnit } from '../../../src/logic/state/index.js';
import { createRng } from '../../../src/services/rng/index.js';
import { testMatch, tweak } from '../../helpers/match.js';

const H = (c, r) => ({ c, r });
const blue = (sbps, pos, x = {}) => ({ team: 'blue', sbps, pos, ...x });
const red = (sbps, pos, x = {}) => ({ team: 'red', sbps, pos, ...x });
const run = (state, data, cmd, seed = 1) => {
  const r = apply(state, cmd, data, createRng(seed));
  if (r.error) throw new Error(`${cmd.type}: ${r.error}`);
  for (const u of Object.values(r.state.units)) assert.deepEqual(checkUnit(u), [], `${cmd.type}: unit ${u.id}`);
  return r;
};
const endTurn = (state, data, seed) => run(state, data, { type: 'EndTurn', side: state.match.side }, seed);
const types = events => events.map(e => e.type);

test('phase order: hooks follow the axis order at turn start and its reverse at turn end; SPEC §2 side phases', () => {
  assert.deepEqual(UNIT_TURN_START.slice(0, AXES.length).map(h => h.axis), AXES);   // then non-axis hooks (cooldowns)
  assert.deepEqual(UNIT_TURN_END.slice(0, AXES.length).map(h => h.axis), [...AXES].reverse());
  assert.deepEqual(SIDE_TURN_START.map(p => p.phase), ['strikes', 'status', 'capture', 'victory', 'income']);
});

test('StartMatch opens turn 1 for the first side: its units get a turn, the other side a counter', () => {
  const { state: s0, data } = testMatch([blue('riflemen_us', H(1, 1)), red('grenadier_ger', H(8, 8))]);
  const fresh = { ...s0, match: { ...s0.match, side: null, turn: 0 }, units: { ...s0.units, u1: { ...s0.units.u1, fsm: { ...s0.units.u1.fsm, action: 'EXHAUSTED' }, budget: { move: 0, action: 0, counter: 0, moved: false, fired: false } } } };
  const r = run(fresh, data, { type: 'StartMatch', side: null });
  assert.deepEqual([r.state.match.turn, r.state.match.side], [1, 'blue']);
  assert.equal(r.events[0].type, 'TurnStarted');
  assert.deepEqual([r.state.units.u1.fsm.action, r.state.units.u1.budget.action], ['IDLE', 1]);
  assert.equal(r.state.units.u2.budget.counter, 1);
  assert.equal(apply(r.state, { type: 'StartMatch', side: 'blue' }, data, createRng(1)).error, 'already_started');
});

test('EndTurn: the side\'s units are spent, the other side moves, the turn number follows the first side', () => {
  const { state, data } = testMatch([blue('riflemen_us', H(1, 1)), red('grenadier_ger', H(8, 8))]);
  const r = endTurn(state, data);
  assert.deepEqual(types(r.events).filter(t => t.startsWith('Turn')), ['TurnEnded', 'TurnStarted']);
  assert.deepEqual([r.state.match.side, r.state.match.turn], ['red', 1]);
  assert.deepEqual([r.state.units.u1.fsm.action, r.state.units.u1.budget.counter], ['EXHAUSTED', 1]);
  assert.equal(r.state.units.u2.fsm.action, 'IDLE');
  assert.equal(apply(r.state, { type: 'Move', side: 'blue', unit: 'u1', to: H(2, 1) }, data, createRng(1)).error, 'not_your_turn');
  const back = endTurn(r.state, data);
  assert.deepEqual([back.state.match.side, back.state.match.turn], ['blue', 2]);
});

test('counter fire: the attacked unit fires back once per enemy turn', () => {
  const { state: s0, data } = testMatch([blue('riflemen_us', H(2, 5)), blue('riflemen_us', H(2, 6)), red('grenadier_ger', H(5, 5), { facing: 3 })]);
  const state = endTurn(endTurn(s0, data).state, data).state;   // red's counter is armed in blue's turn
  const a = run(state, data, { type: 'Attack', side: 'blue', unit: 'u1', target: 'u3' }, 4);
  if (!a.state.units.u3) return;   // destroyed outright: nothing to counter with
  assert.ok(types(a.events).includes('CounterFired'));
  const cf = a.events.findIndex(e => e.type === 'CounterFired');
  assert.deepEqual(a.events[cf], { type: 'CounterFired', unit: 'u3', target: 'u1' });
  assert.equal(a.events[cf + 1].unit, 'u3', 'the counter volley follows');
  assert.equal(a.state.units.u3.budget.counter, 0);
  assert.equal(a.state.units.u3.engaged, true, 'counter fire is attacking');
  const b = run(a.state, data, { type: 'Attack', side: 'blue', unit: 'u2', target: 'u3' }, 5);
  assert.ok(!types(b.events).includes('CounterFired'), 'one counter per enemy turn');
});

test('no counter fire against an attack from outside the weapon arc (flank)', () => {
  const { state: s0, data } = testMatch([blue('riflemen_us', H(2, 5)), red('grenadier_ger', H(5, 5), { facing: 0 })]);
  const state = endTurn(endTurn(s0, data).state, data).state;
  const a = run(state, data, { type: 'Attack', side: 'blue', unit: 'u1', target: 'u2' }, 4);
  assert.ok(!types(a.events).includes('CounterFired'));
});

test('no counter fire from retreating units or crews still setting up', () => {
  const { state: s0, data } = testMatch([blue('riflemen_us', H(2, 5)), red('grenadier_ger', H(5, 5), { facing: 3 }), blue('riflemen_us', H(2, 7)), red('hmg_mg42_ger', H(4, 7), { facing: 3 })]);
  let state = endTurn(endTurn(s0, data).state, data).state;
  state = tweak(state, 'u2', { fsm: { ...state.units.u2.fsm, morale: 'RETREATING' }, retreatTo: H(11, 9) });
  state = tweak(state, 'u4', { fsm: { ...state.units.u4.fsm, stance: 'SETTING_UP' }, timers: { ...state.units.u4.timers, stance: 1 } });
  for (const [att, tgt] of [['u1', 'u2'], ['u3', 'u4']]) {
    const r = run(state, data, { type: 'Attack', side: 'blue', unit: att, target: tgt }, 2);
    assert.ok(!types(r.events).includes('CounterFired'), tgt);
  }
});

test('MG overwatch: Hold, then the first enemy step into arc and sight draws one burst; the move cannot be undone', () => {
  const { state, data } = testMatch([blue('hmg_30cal_us', H(1, 5), { stance: 'EMPLACED', facing: 0 }), red('grenadier_ger', H(7, 3))]);
  const held = run(state, data, { type: 'Hold', side: 'blue', unit: 'u1' });
  assert.equal(held.state.units.u1.fsm.action, 'OVERWATCH');
  const redTurn = endTurn(held.state, data);
  assert.equal(redTurn.state.units.u1.fsm.action, 'OVERWATCH', 'still watching in the enemy turn');
  const mv = run(redTurn.state, data, { type: 'Move', side: 'red', unit: 'u2', to: H(5, 5) }, 3);
  const at = types(mv.events);
  assert.ok(at.includes('OverwatchFired'));
  assert.ok(at.indexOf('Fired') < at.indexOf('OverwatchFired'));
  assert.equal(mv.state.units.u1.fsm.action, 'EXHAUSTED');
  assert.equal(mv.undoable, false);
  assert.ok(!at.includes('CounterFired'), 'overwatch fire draws no counter fire');
  assert.equal(at.filter(t => t === 'OverwatchFired').length, 1);
  const own = endTurn(mv.state, data);
  assert.deepEqual([own.state.units.u1.fsm.action, own.state.units.u1.overwatch], ['IDLE', null], 'overwatch ends at the own turn start');
});

test('a move with no reaction stays undoable', () => {
  const { state, data } = testMatch([blue('riflemen_us', H(1, 1))]);
  assert.equal(run(state, data, { type: 'Move', side: 'blue', unit: 'u1', to: H(2, 1) }).undoable, true);
});

test('an overwatch burst that pins the mover stops it on that hex', () => {
  const { state, data } = testMatch([blue('hmg_30cal_us', H(1, 5), { stance: 'EMPLACED', facing: 0 }), red('grenadier_ger', H(7, 5))]);
  let s = endTurn(run(state, data, { type: 'Hold', side: 'blue', unit: 'u1' }).state, data).state;
  s = tweak(s, 'u2', { suppression: 79, fsm: { ...s.units.u2.fsm, morale: 'SUPPRESSED' }, budget: { ...s.units.u2.budget, move: 4 } });
  const r = run(s, data, { type: 'Move', side: 'red', unit: 'u2', to: H(4, 5) }, 1);
  const u = r.state.units.u2;
  assert.deepEqual([u.fsm.morale, u.pos], ['PINNED', H(6, 5)], 'the first hex inside range');
  assert.deepEqual(types(r.events).filter(t => /Move|Overwatch/.test(t)), ['Moved', 'OverwatchFired', 'MoveInterrupted']);
  assert.equal(u.budget.move, 3, 'only the step taken is paid');
});

test('pinned units do not counter fire; suppressed units do', () => {
  const { state: s0, data } = testMatch([blue('riflemen_us', H(2, 5)), red('grenadier_ger', H(5, 5), { facing: 3 })]);
  const state = endTurn(endTurn(s0, data).state, data).state;
  const pinned = tweak(state, 'u2', { suppression: 85, fsm: { ...state.units.u2.fsm, morale: 'PINNED' } });
  assert.ok(!types(run(pinned, data, { type: 'Attack', side: 'blue', unit: 'u1', target: 'u2' }, 4).events).includes('CounterFired'));
  const supp = { ...state.units.u2, fsm: { ...state.units.u2.fsm, morale: 'SUPPRESSED' } };
  assert.deepEqual(permits(MACHINES, supp, 'Counter'), { ok: true });
  assert.equal(permits(MACHINES, pinned.units.u2, 'Counter').reason, 'pinned');
});

test('a retreating unit that reaches its rally point at its turn start may still act (its move is spent)', () => {
  const { state: s0, data } = testMatch([blue('riflemen_us', H(1, 1)), red('grenadier_ger', H(10, 6))]);
  const state = tweak(s0, 'u2', { fsm: { ...s0.units.u2.fsm, morale: 'RETREATING' }, retreatTo: H(11, 9) });
  const u = endTurn(state, data).state.units.u2;
  assert.deepEqual([u.fsm.morale, u.fsm.action, u.budget.action, u.budget.move], ['NORMAL', 'IDLE', 1, 0]);
});

test('retreating units walk on by themselves at their turn start and spend that turn', () => {
  const { state: s0, data } = testMatch([blue('riflemen_us', H(1, 1)), red('grenadier_ger', H(2, 2))]);
  const state = tweak(s0, 'u2', { fsm: { ...s0.units.u2.fsm, morale: 'RETREATING' }, retreatTo: H(11, 9) });
  const r = endTurn(state, data);
  const u = r.state.units.u2;
  assert.ok(types(r.events).includes('Moved'));
  assert.ok(Math.abs(u.pos.c - 11) + Math.abs(u.pos.r - 9) < 18);
  assert.equal(u.fsm.action, 'EXHAUSTED');
});

test('setup finishes at the own turn start; a packed MG emplaces by itself at its turn end', () => {
  const { state, data } = testMatch([blue('hmg_30cal_us', H(3, 3))]);
  const t1 = endTurn(state, data);
  assert.equal(t1.state.units.u1.fsm.stance, 'SETTING_UP', 'auto-emplace at the turn end');
  const t2 = endTurn(t1.state, data);
  assert.equal(t2.state.units.u1.fsm.stance, 'EMPLACED');
});

test('engaged and the turret: an attack keeps the unit engaged through its turn end; a quiet turn clears it and the turret swings back', () => {
  const { state, data } = testMatch([blue('sherman_us', H(2, 5), { facing: 0 }), red('grenadier_ger', H(5, 5))]);
  const aimed = tweak(state, 'u1', { turretFacing: 1 });
  const a = run(aimed, data, { type: 'Attack', side: 'blue', unit: 'u1', target: 'u2' }, 2);
  const t1 = endTurn(a.state, data);
  assert.deepEqual([t1.state.units.u1.engaged, t1.state.units.u1.turretFacing], [true, 1]);
  const t2 = endTurn(endTurn(t1.state, data).state, data);
  assert.deepEqual([t2.state.units.u1.engaged, t2.state.units.u1.turretFacing], [false, 0]);
  assert.ok(types(t2.events).includes('TurretTurned'));
});

test('a crew shock costs the next turn\'s action, then clears', () => {
  const { state: s0, data } = testMatch([blue('sherman_us', H(2, 5)), red('grenadier_ger', H(9, 9))]);
  const state = tweak(s0, 'u1', { criticals: ['crew_shocked'] });
  const own = endTurn(endTurn(state, data).state, data);
  assert.equal(own.state.units.u1.budget.action, 0);
  const next = endTurn(endTurn(own.state, data).state, data);
  assert.deepEqual([next.state.units.u1.criticals, next.state.units.u1.budget.action], [[], 1]);
});

test('Recrew: a five-man squad takes over an enemy gun; it is ours, packed, green and spent this turn', () => {
  const { state: s0, data } = testMatch([blue('riflemen_us', H(3, 4)), red('at_gun_75mm_ger', H(4, 4), { stance: 'EMPLACED' })]);
  let state = tweak(s0, 'u2', { members: s0.units.u2.members.map(m => (m.ebps.startsWith('crew_') ? { ...m, hp: 0 } : m)), xp: 300, rank: 1 });
  state = tweak(state, 'u1', { members: state.units.u1.members.map((m, i) => (i === 0 ? { ...m, hp: 0 } : m)) });
  state = { ...state, units: { ...state.units, u2: { ...state.units.u2, team: null, fsm: { ...state.units.u2.fsm, life: 'DECREWED', action: 'EXHAUSTED' }, budget: { move: 0, action: 0, counter: 0 } } } };
  const r = run(state, data, { type: 'Recrew', side: 'blue', unit: 'u1', target: 'u2' });
  const gun = r.state.units.u2;
  assert.equal(r.state.units.u1, undefined);
  assert.deepEqual([gun.team, gun.fsm.life, gun.fsm.stance, gun.xp, gun.rank, gun.fsm.action], ['blue', 'ACTIVE', 'MOBILE', 0, 0, 'EXHAUSTED']);
  assert.equal(gun.members.filter(m => m.hp > 0).length, 6, 'gun + five crew');
  const next = endTurn(endTurn(r.state, data).state, data);
  assert.equal(next.state.units.u2.fsm.action, 'IDLE', 'it acts from the next own turn');
});

test('Abandon: the crew steps beside its gun as its own unit; the gun is left decrewed; the crew can take it back', () => {
  const { state, data } = testMatch([blue('at_gun_57mm_us', H(4, 4)), red('grenadier_ger', H(10, 9))]);
  const r = run(state, data, { type: 'Abandon', side: 'blue', unit: 'u1' });
  const gun = r.state.units.u1, crew = r.state.units.u3;
  assert.deepEqual([gun.fsm.life, gun.team, gun.members.length], ['DECREWED', null, 1]);
  assert.deepEqual([crew.team, crew.sbps, crew.members.length, crew.fsm.action], ['blue', 'at_gun_57mm_us', 5, 'EXHAUSTED']);
  assert.equal(types(r.events)[0], 'UnitCreated');
  const own = endTurn(endTurn(r.state, data).state, data).state;
  const back = run(own, data, { type: 'Recrew', side: 'blue', unit: 'u3', target: 'u1' });
  assert.deepEqual([back.state.units.u1.team, back.state.units.u1.fsm.life, back.state.units.u3], ['blue', 'ACTIVE', undefined]);
});

test('ClearWreck: an engineer clears a vehicle wreck in two turns of work', () => {
  const { state: s0, data: d0 } = testMatch([blue('riflemen_us', H(3, 4)), red('grenadier_ger', H(10, 9))]);
  const data = { ...d0, units: { ...d0.units, sbps: { ...d0.units.sbps, riflemen_us: { ...d0.units.sbps.riflemen_us, role: 'engineer' } } } };
  const state = { ...s0, map: { ...s0.map, changes: { ...s0.map.changes, hexes: { '4,4': { wreck: { kind: 'vehicle', hp: 400 } } } } } };
  const one = run(state, data, { type: 'ClearWreck', side: 'blue', unit: 'u1', hex: H(4, 4) });
  assert.equal(one.state.units.u1.budget.action, 0);
  assert.equal(apply(one.state, { type: 'ClearWreck', side: 'blue', unit: 'u1', hex: H(4, 4) }, data, createRng(1)).error, 'no_action_left');
  const own = endTurn(endTurn(one.state, data).state, data).state;
  const two = run(own, data, { type: 'ClearWreck', side: 'blue', unit: 'u1', hex: H(4, 4) });
  assert.ok(types(two.events).includes('WreckCleared'));
  assert.equal(two.state.map.changes.hexes['4,4'].wreck, undefined);
});

test('a crewless gun is a target for every side, its old owner too; destroyed, it leaves a wreck and gives no XP', () => {
  const { state: s0, data } = testMatch([blue('riflemen_us', H(2, 4)), blue('at_gun_57mm_us', H(4, 4))]);
  let state = tweak(s0, 'u2', { members: s0.units.u2.members.map(m => (m.ebps.startsWith('crew_') ? { ...m, hp: 0 } : { ...m, hp: 5 })),
    team: null, fsm: { ...s0.units.u2.fsm, life: 'DECREWED', action: 'EXHAUSTED' }, budget: { move: 0, action: 0, counter: 0 } });
  let r;
  for (let seed = 1; seed < 20 && state.units.u2; seed++) {
    r = run(state, data, { type: 'Attack', side: 'blue', unit: 'u1', target: 'u2' }, seed);
    assert.ok(!types(r.events).includes('CounterFired'));
    state = endTurn(endTurn(r.state, data).state, data).state;
  }
  assert.equal(state.units.u2, undefined);
  assert.equal(state.map.changes.hexes['4,4'].wreck.kind, 'emplacement');
  assert.equal(state.units.u1.xp, 0);
});

test('reload: a weapon firing every 2 turns skips the next own turn and cannot counter fire meanwhile', () => {
  const { state: s0, data: d0 } = testMatch([blue('mortar_81mm_us', H(1, 5), { stance: 'EMPLACED' }), red('grenadier_ger', H(5, 5), { facing: 3 })]);
  const w = d0.units.weapon['81mm_mortar_us'];
  const data = { ...d0, units: { ...d0.units, weapon: { ...d0.units.weapon, '81mm_mortar_us': { ...w, indirect: { ...w.indirect, usage_turns: 2 } } } } };
  const fired = run(s0, data, { type: 'Attack', side: 'blue', unit: 'u1', target: 'u2' }, 1);
  assert.equal(fired.state.units.u1.timers.reload, 1);
  const redTurn = endTurn(fired.state, data);
  if (redTurn.state.units.u2) {
    const shot = tweak(redTurn.state, 'u2', { pos: H(4, 5) });
    const a = run(shot, data, { type: 'Attack', side: 'red', unit: 'u2', target: 'u1' }, 2);
    assert.ok(!types(a.events).includes('CounterFired'), 'reloading: no counter fire');
  }
  const own = endTurn(redTurn.state, data).state;
  assert.equal(apply(own, { type: 'Attack', side: 'blue', unit: 'u1', target: 'u2' }, data, createRng(1)).error ?? 'none', own.units.u2 ? 'reloading' : 'no_such_target');
  const next = endTurn(endTurn(own, data).state, data).state;
  assert.equal(next.units.u1.timers.reload, 0, 'ready again two own turns after firing');
});

test('Produce: paid, placed beside the building, acts from the next own turn', () => {
  const map = { production: [{ id: 'bx', type: 't1', team: 'blue', hexes: ['2,2'] }] };
  const { state, data } = testMatch([], map);
  const r = run(state, data, { type: 'Produce', side: 'blue', building: 'bx', sbps: 'riflemen_us', hex: H(3, 2) });
  const id = r.events[0].unit, u = r.state.units[id];
  assert.deepEqual([u.team, u.pos, u.fsm.action], ['blue', H(3, 2), 'EXHAUSTED']);
  assert.equal(r.state.teams.blue.resources.manpower, 600 - 270);
  const next = endTurn(endTurn(r.state, data).state, data);
  assert.equal(next.state.units[id].fsm.action, 'IDLE');
});

test('turn start: capture tick, then income for the side to move', () => {
  const map = { points: [{ id: 'f', kind: 'fuel', hex: '5,5', radius: 1 }] };
  const { state, data } = testMatch([blue('riflemen_us', H(5, 5)), blue('riflemen_us', H(5, 4)), red('grenadier_ger', H(10, 9))], map);
  const own = endTurn(endTurn(state, data).state, data);
  const at = types(own.events);
  assert.ok(at.indexOf('PointNeutralised') < 0 && at.indexOf('PointCaptured') < at.indexOf('IncomeReceived'));
  assert.equal(own.state.points[0].owner, 'blue');
  const fuelIncome = own.events.find(e => e.type === 'IncomeReceived' && e.team === 'blue').gross.fuel;
  assert.equal(fuelIncome, 5 + 12, 'the point pays in the same turn start it is taken');
});

test('Convert: paid in the field, same id and hex, HP share and veterancy kept; research-locked ones refused', () => {
  const { state: s0, data: d0 } = testMatch([blue('hmg_30cal_us', H(3, 3), { facing: 2 }), blue('riflemen_us', H(5, 5)), red('grenadier_ger', H(10, 9))]);
  const data = { ...d0, rules: { ...d0.rules, conversions: { conversions: [{ from: 'hmg_30cal_us', to: 'mortar_81mm_us', cost: { munition: 5 } }] } } };
  const hurt = tweak(s0, 'u1', { xp: 120, members: s0.units.u1.members.map((m, i) => (i === 0 ? { ...m, hp: 0 } : i === 1 ? { ...m, hp: Math.round(m.hp / 2) } : m)) });
  const r = run(hurt, data, { type: 'Convert', side: 'blue', unit: 'u1', to: 'mortar_81mm_us' });
  const u = r.state.units.u1, crewHp = data.units.ebps.crew_mortar_us.hp;
  assert.deepEqual([u.sbps, u.pos, u.facing, u.xp, u.budget.action], ['mortar_81mm_us', H(3, 3), 2, 120, 0]);
  assert.deepEqual(u.members.map(m => m.ebps), Array(4).fill('crew_mortar_us'));
  assert.equal(u.members[0].hp, 0, 'the dead stay dead');
  assert.equal(u.members[1].hp, Math.round(crewHp / 2));
  assert.equal(r.state.teams.blue.resources.munition, 10 - 5);
  assert.ok(types(r.events).includes('Converted'));
  assert.equal(apply(s0, { type: 'Convert', side: 'blue', unit: 'u2', to: 'ranger_us' }, d0, createRng(1)).error, 'needs_doctrine');
  assert.equal(apply(s0, { type: 'Convert', side: 'blue', unit: 'u2', to: 'sherman_us' }, d0, createRng(1)).error, 'cannot_convert');
  const engaged = tweak(hurt, 'u1', { engaged: true });
  assert.equal(apply(engaged, { type: 'Convert', side: 'blue', unit: 'u1', to: 'mortar_81mm_us' }, data, createRng(1)).error, 'engaged');
});

test('Rebuild: an engineer rebuilds its destroyed HQ on the footprint (paid once, 2 turns of work); not while standing', () => {
  const map = { structures: [{ id: 'hq', kind: 'hq', team: 'blue', hexes: ['3,3'] }] };
  const { state: s0, data: d0 } = testMatch([blue('riflemen_us', H(5, 3)), red('grenadier_ger', H(10, 9))], map);
  const data = { ...d0, units: { ...d0.units, sbps: { ...d0.units.sbps, riflemen_us: { ...d0.units.sbps.riflemen_us, role: 'engineer' } } } };
  assert.equal(apply(s0, { type: 'Rebuild', side: 'blue', unit: 'u1', structure: 'hq' }, data, createRng(1)).error, 'not_destroyed');
  const down = { ...s0, map: { ...s0.map, changes: { ...s0.map.changes, structures: { hq: { hp: 0, collapsed: true } } } } };
  assert.equal(apply(down, { type: 'Rebuild', side: 'blue', unit: 'u1', structure: 'hq' }, d0, createRng(1)).error, 'cannot_build', 'riflemen are not engineers');
  const one = run(down, data, { type: 'Rebuild', side: 'blue', unit: 'u1', structure: 'hq' });
  assert.equal(one.state.teams.blue.resources.manpower, 600 - 500);
  const own = endTurn(endTurn(one.state, data).state, data).state;
  assert.equal(own.teams.blue.resources.manpower >= 100, true);
  const two = run(own, data, { type: 'Rebuild', side: 'blue', unit: 'u1', structure: 'hq' });
  assert.equal(two.state.teams.blue.resources.manpower, own.teams.blue.resources.manpower, 'paid only when work starts');
  assert.ok(types(two.events).includes('StructureRebuilt'));
  assert.equal(two.state.map.changes.structures.hq.hp, 1000);
});

test('Rebuild: a destroyed tier building is rebuilt by an engineer and produces again (recommended 200 MP / 20 fuel, 2 turns)', () => {
  const map = { production: [{ id: 'bx', type: 't1', team: 'blue', hexes: ['3,3'] }] };
  const { state: s0, data } = testMatch([blue('engineer_us', H(5, 3)), red('grenadier_ger', H(10, 9))], map);
  const down = { ...s0, map: { ...s0.map, changes: { ...s0.map.changes, structures: { bx: { hp: 0, collapsed: true } } } } };
  const one = run(down, data, { type: 'Rebuild', side: 'blue', unit: 'u1', structure: 'bx' });
  assert.deepEqual([one.state.teams.blue.resources.manpower, one.state.teams.blue.resources.fuel], [400, 0]);
  const own = endTurn(endTurn(one.state, data).state, data).state;
  const two = run(own, data, { type: 'Rebuild', side: 'blue', unit: 'u1', structure: 'bx' });
  assert.ok(types(two.events).includes('StructureRebuilt'));
  assert.equal(two.state.map.changes.structures.bx.hp, 500);
});

test('Upgrade: a weapon kit swaps one model\'s main weapon; requirements, limit and cost are checked', () => {
  const { state: s0, data } = testMatch([blue('riflemen_us', H(3, 3)), red('grenadier_ger', H(10, 9))]);
  const cmd = { type: 'Upgrade', side: 'blue', unit: 'u1', upgrade: 'bar_rifleman_squad_us' };
  assert.equal(apply(s0, cmd, data, createRng(1)).error, 'needs_unlock', 'BAR needs its research and a support center');
  const rich = { ...s0, teams: { ...s0.teams, blue: { ...s0.teams.blue, unlocks: ['all'], resources: { ...s0.teams.blue.resources, munition: 100 } } } };
  const r = run(rich, data, cmd);
  const u = r.state.units.u1, fired = combat.firingWeapons(u, data).map(w => w.id);
  assert.deepEqual([u.upgrades, r.state.teams.blue.resources.munition, u.budget.action], [['bar_rifleman_squad_us'], 40, 0]);
  assert.equal(fired.filter(w => w === 'bar_riflemen_us').length, 1);
  assert.equal(fired.length, 6, 'still six weapons: one Garand became a BAR');
  const next = endTurn(endTurn(r.state, data).state, data).state;
  assert.equal(apply(next, cmd, data, createRng(1)).error, 'already_upgraded');
});
