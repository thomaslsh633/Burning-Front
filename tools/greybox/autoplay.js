// Greybox autoplay (stage G): whole 1v1 matches between faction pairs, played through commands only by a simple scripted
// player — produce what it can afford, attack what it can, otherwise walk to the nearest point it does not own or to the
// nearest enemy, emplace team weapons. Checks every unit's invariants after every turn and records what happened.
//
// usage: node tools/greybox/autoplay.js [seeds] [map] → reports/greybox/autoplay.md
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGameData } from '../lib/game-data.js';
import { createStore } from '../../src/logic/store/index.js';
import { validate } from '../../src/logic/commands/index.js';
import { createMatch, checkUnit } from '../../src/logic/state/index.js';
import { reachable } from '../../src/logic/movement/index.js';
import { producers, offers, priceOf, canAfford } from '../../src/logic/economy/index.js';
import { mapOf } from '../../src/logic/terrain/index.js';
import { distance, fromKey, neighbours } from '../../src/logic/hex/index.js';
import { createRng } from '../../src/services/rng/index.js';

export const PAIRS = [['american', 'german'], ['german', 'british_africa'], ['afrika_korps', 'american'], ['british', 'afrika_korps'],
  ['british_africa', 'german'], ['american', 'british']];

/** One side's turn; pick: a seeded rng for the player's own choices (not the game's). → counts of what it did */
function playTurn(store, data, pick, stats) {
  const s0 = store.getState(), side = s0.match.side, try_ = cmd => { const r = store.dispatch(cmd); stats.commands++; if (r.error) stats.refused[r.error] = (stats.refused[r.error] ?? 0) + 1; return !r.error; };
  // produce: every own building, one affordable base unit each, on a free hex beside it
  for (const b of producers(s0, data).filter(x => x.team === side)) {
    const s = store.getState(), list = offers(s, data, b.id).filter(id => canAfford(s, side, priceOf(id, data)));
    if (!list.length) continue;
    const sbps = list[pick.int(list.length)];
    const spot = b.hexes.flatMap(k => neighbours(fromKey(k))).find(hex => !validate(store.getState(), { type: 'Produce', side, building: b.id, sbps, hex }, data));
    if (spot && try_({ type: 'Produce', side, building: b.id, sbps, hex: spot })) stats.produced[side] = (stats.produced[side] ?? 0) + 1;
  }
  const points = mapOf(store.getState(), data).points;
  for (const id of Object.keys(store.getState().units)) {
    const s = store.getState(), u = s.units[id];
    if (!u || u.team !== side || u.fsm.life !== 'ACTIVE' || u.fsm.action === 'EXHAUSTED') continue;
    const enemies = Object.values(s.units).filter(e => e.team && e.team !== side && e.fsm.life === 'ACTIVE');
    const target = enemies.find(e => !validate(s, { type: 'Attack', side, unit: id, target: e.id }, data));
    if (target) { try_({ type: 'Attack', side, unit: id, target: target.id }); continue; }
    const nearEnemy = enemies.some(e => distance(e.pos, u.pos) <= 6);
    if (u.fsm.stance !== 'MOBILE') continue;   // set up (or setting up): stays and fires
    if (u.kind === 'team_weapon' && nearEnemy && !validate(s, { type: 'Emplace', side, unit: id }, data)) { try_({ type: 'Emplace', side, unit: id }); continue; }
    const owned = new Set(s.points.filter(p => p.owner === side).map(p => p.id));
    const goals = [...points.filter(p => !owned.has(p.id)).map(p => fromKey(p.hex)), ...enemies.map(e => e.pos)];
    const goal = goals.sort((a, b) => distance(u.pos, a) - distance(u.pos, b))[0];
    if (!goal) continue;
    const best = [...reachable(s, data, id)].filter(([, v]) => v.stop).map(([k]) => fromKey(k)).sort((a, b) => distance(a, goal) - distance(b, goal))[0];
    if (best && distance(best, goal) < distance(u.pos, goal)) try_({ type: 'Move', side, unit: id, to: best });
  }
  for (const u of Object.values(store.getState().units)) for (const bad of checkUnit(u)) stats.invariants.push(`turn ${s0.match.turn} ${u.id} ${u.sbps}: ${bad}`);
  return try_({ type: 'EndTurn', side });
}

/** A whole match. → { blue, red, winner, reason, turns, produced, destroyed, commands, refused, invariants, error } */
export function playMatch(data, [blue, red], { seed = 1, map = 'greybox', tickets = 120, maxTurns = 60 } = {}) {
  const resources = { manpower: 600, munition: 30, fuel: 40 };
  const state = createMatch({ map: { id: map }, mode: 'capture', order: ['blue', 'red'], rng: seed,
    teams: { blue: { faction: blue, resources, tickets }, red: { faction: red, resources, tickets } } }, data);
  const store = createStore(state, data, { rngFrom: s => createRng({ state: s }) });
  const stats = { blue, red, produced: {}, destroyed: {}, commands: 0, refused: {}, invariants: [], error: null };
  store.subscribe((s, events) => { for (const e of events) if (e.type === 'UnitDestroyed' && e.team) stats.destroyed[e.team] = (stats.destroyed[e.team] ?? 0) + 1; });
  const pick = createRng(seed * 7919);
  try {
    store.dispatch({ type: 'StartMatch', side: null });
    while (!store.getState().match.over && store.getState().match.turn <= maxTurns) if (!playTurn(store, data, pick, stats)) break;
  } catch (e) { stats.error = `${e.message} @ ${e.stack.split('\n')[1]?.trim()}`; }
  const end = store.getState();
  return { ...stats, winner: end.match.over?.winner ?? null, reason: end.match.over?.reason ?? (stats.error ? 'error' : 'turn limit'), turns: end.match.turn,
    tickets: { blue: end.teams.blue.tickets, red: end.teams.red.tickets } };
}

export function markdown(results, seeds, map) {
  const L = ['# Greybox: autoplay 1v1s', '', `Generated by \`node tools/greybox/autoplay.js ${seeds} ${map}\`: capture mode, 120 tickets, at most 60 turns,`,
    'both sides played by the same scripted player through commands only (produce, attack, capture, emplace).', '',
    '| Blue | Red | Seed | Winner | Reason | Turns | Tickets b / r | Produced b / r | Lost b / r | Commands | Refused (top) | Invariant breaks | Error |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'];
  for (const r of results) {
    const refused = Object.entries(r.refused).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${v}`).join(', ');
    L.push(`| ${r.blue} | ${r.red} | ${r.seed} | ${r.winner ?? '—'} | ${r.reason} | ${r.turns} | ${r.tickets.blue} / ${r.tickets.red} | ${r.produced.blue ?? 0} / ${r.produced.red ?? 0} | ${r.destroyed.blue ?? 0} / ${r.destroyed.red ?? 0} | ${r.commands} | ${refused} | ${r.invariants.length} | ${r.error ?? ''} |`);
  }
  const breaks = results.flatMap(r => r.invariants.slice(0, 5));
  if (breaks.length) L.push('', '## Invariant breaks (first few)', '', ...breaks.map(b => `- ${b}`));
  return `${L.join('\n')}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const seeds = Number(process.argv[2] ?? 2), map = process.argv[3] ?? 'greybox';
  const data = loadGameData(root), results = [];
  for (const pair of PAIRS) for (let seed = 1; seed <= seeds; seed++) results.push({ ...playMatch(data, pair, { seed, map }), seed });
  fs.mkdirSync(path.join(root, 'reports/greybox'), { recursive: true });
  fs.writeFileSync(path.join(root, 'reports/greybox/autoplay.md'), markdown(results, seeds, map));
  for (const r of results) console.log(`${r.blue} vs ${r.red} #${r.seed}: ${r.winner ?? '—'} (${r.reason}) turn ${r.turns}, produced ${r.produced.blue ?? 0}/${r.produced.red ?? 0}, lost ${r.destroyed.blue ?? 0}/${r.destroyed.red ?? 0}${r.invariants.length ? `, ${r.invariants.length} invariant breaks` : ''}${r.error ? `, ERROR ${r.error}` : ''}`);
}
