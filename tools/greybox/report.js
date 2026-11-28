// Greybox data check (dev plan G-4): time to kill. Every armed squad fires at each reference target in the open at mid-band
// range, once per own turn (reload respected, ammo spent), over many seeds, with the real rules engine (src/logic).
// No counter fire, no movement, no cover: a clean duel number to compare units by. Criteria: data/balance/greybox.json.
//
// usage: node tools/greybox/report.js [seeds]   → reports/greybox/ttk.md, reports/greybox/ttk.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGameData } from '../lib/game-data.js';
import { compileMap } from '../../src/logic/terrain/index.js';
import { createMatch, putUnit } from '../../src/logic/state/index.js';
import { firingWeapons, resolveAttack } from '../../src/logic/combat/index.js';
import { applySuppression, unitValue } from '../../src/logic/status/index.js';
import { createRng } from '../../src/services/rng/index.js';

const alive = m => m.hp > 0;
const median = xs => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };

/** Mid-band distance of a unit's longest weapon (thirds of the range), at least its minimum range. */
export function duelDistance(unit, data) {
  const ws = firingWeapons(unit, data);
  const max = Math.max(...ws.map(w => w.weapon.attack.range_hex.max)), min = Math.max(0, ...ws.map(w => w.weapon.attack.range_hex.min ?? 0));
  return Math.max(1, min, Math.ceil(max / 2));
}

/** A target is down when no member lives, or a team weapon's crew is gone. */
const down = (u, data) => {
  const tw = data.units.sbps[u.sbps].team_weapon;
  return !u.members.some(alive) || (tw && !u.members.some(m => m.ebps === tw.crew_entity && alive(m)));
};

/**
 * One duel series: attacker vs target, `seeds` runs of at most `maxTurns` own turns.
 * → { distance, turns: [turns to kill or null], pins: [turns until the target is first pinned or null], outOfAmmo }
 */
export function duel(data, attackerSbps, targetSbps, { seeds = 100, maxTurns = 20 } = {}) {
  const cols = 24;
  const map = compileMap({ meta: { id: 'duel', cols, rows: 3 } }, data.rules.terrain).map;
  const d2 = { ...data, maps: { ...data.maps, duel: map } };
  const probe = createMatch({ map: { id: 'duel' }, order: ['blue', 'red'], rng: 1, teams: { blue: { faction: 'american' }, red: { faction: 'german' } },
    units: [{ id: 'a', team: 'blue', sbps: attackerSbps, pos: { c: 0, r: 1 }, stance: 'EMPLACED' }] }, d2);
  const dist = Math.min(cols - 1, duelDistance(probe.units.a, d2));
  const start = createMatch({ map: { id: 'duel' }, order: ['blue', 'red'], rng: 1, teams: { blue: { faction: 'american' }, red: { faction: 'german' } },
    units: [{ id: 'a', team: 'blue', sbps: attackerSbps, pos: { c: 0, r: 1 }, facing: 0, stance: 'EMPLACED' },
      { id: 't', team: 'red', sbps: targetSbps, pos: { c: dist, r: 1 }, facing: 3, stance: 'EMPLACED' }] }, d2);
  const reload = Math.max(0, ...firingWeapons(start.units.a, d2).map(w => (w.weapon.indirect?.usage_turns ?? 1) - 1));
  const turns = [], pins = [];
  let outOfAmmo = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const rng = createRng(seed);
    let s = { ...start, match: { ...start.match, turn: 1, side: 'blue' } }, killed = null, pinned = null;
    for (let t = 1, wait = 0; t <= maxTurns && killed == null; t++) {
      if (wait > 0) { wait--; continue; }
      if (s.units.a.ammo <= 0) { outOfAmmo++; break; }
      const r = resolveAttack(s, d2, 'a', 't', rng);
      s = r.state;
      if (r.suppression.t) s = applySuppression(s, 't', r.suppression.t, d2).state;
      s = putUnit(s, { ...s.units.a, budget: { ...s.units.a.budget, fired: true } });
      wait = reload;
      if (pinned == null && s.units.t.fsm.morale === 'PINNED') pinned = t;
      if (down(s.units.t, d2)) killed = t;
    }
    turns.push(killed); pins.push(pinned ?? killed);
  }
  return { distance: dist, turns, pins, outOfAmmo };
}

/** criteria: data/balance/greybox.json; targets: reference squad ids → rows with TTK per target and the flags. */
export function ttkTable(data, criteria, { seeds = 100, attackers } = {}) {
  const targets = criteria.targets.filter(id => data.units.sbps[id]);
  const ids = attackers ?? Object.keys(data.units.sbps).filter(id => {
    const sq = data.units.sbps[id];
    if (sq.kind === 'structure') return false;
    const probe = { sbps: id, kind: sq.kind, criticals: [], members: sq.members.flatMap(m => Array(m.count).fill({ ebps: m.entity, hp: 1 })) };
    return firingWeapons(probe, data).length > 0;
  });
  const rows = [];
  for (const id of ids) {
    const row = { id, faction: data.units.faction[id], kind: data.units.sbps[id].kind, role: data.units.sbps[id].role,
      cost: unitValue({ sbps: id }, data), ttk: {}, flags: [] };
    for (const t of targets) {
      const r = duel(data, id, t, { seeds, maxTurns: criteria.max_turns });
      const kills = r.turns.filter(x => x != null);
      const pins = r.pins.filter(x => x != null);
      row.ttk[t] = { median: kills.length > r.turns.length / 2 ? median(r.turns.map(x => x ?? Infinity)) : null, killRate: kills.length / r.turns.length,
        pin: pins.length > r.pins.length / 2 ? median(r.pins.map(x => x ?? Infinity)) : null, distance: r.distance, outOfAmmo: r.outOfAmmo };
    }
    for (const rule of criteria.ranges) {
      if (rule.role !== row.role) continue;
      const tgtKind = t => data.units.sbps[t].kind;
      const what = rule.measure ?? 'kill';
      const vals = targets.filter(t => tgtKind(t) === rule.target_kind).map(t => row.ttk[t][what === 'pin' ? 'pin' : 'median']);
      if (!vals.length) continue;
      const best = Math.min(...vals.map(v => v ?? Infinity));
      if (best < rule.turns[0] || best > rule.turns[1]) row.flags.push(`${rule.role} vs ${rule.target_kind}: best ${what === 'pin' ? 'time to pin' : 'TTK'} ${Number.isFinite(best) ? best : '—'} outside ${rule.turns[0]}–${rule.turns[1]}`);
    }
    rows.push(row);
  }
  return { targets, rows };
}

export function markdown({ targets, rows }, criteria, seeds) {
  const cell = c => `${c.median == null ? `— (${Math.round(c.killRate * 100)} %)` : `${c.median}${c.outOfAmmo ? ' ⚠ammo' : ''}`}${c.pin != null && c.pin !== c.median ? ` · pin ${c.pin}` : ''}`;
  const L = ['# Greybox: time to kill', '',
    `Generated by \`node tools/greybox/report.js ${seeds}\`: ${seeds} seeds per pair, at most ${criteria.max_turns} own turns, attacker fires once per`,
    'own turn at mid-band range of its longest weapon, target in the open, no counter fire. Cell: median own turns to kill;',
    '— = killed in half the runs or fewer within the limit (kill rate in brackets); ⚠ammo = ran out of ammunition in some runs;',
    'pin N = median own turns until the target is first pinned (shown when it differs from the kill).',
    `Criteria: \`data/balance/greybox.json\`. ${rows.filter(r => r.flags.length).length} of ${rows.length} armed squads are flagged.`, '',
    `| Squad | Faction | Role | Cost | Dist | ${targets.map(t => `\`${t}\``).join(' | ')} | Flags |`,
    `| --- | --- | --- | --- | --- | ${targets.map(() => '---').join(' | ')} | --- |`];
  for (const r of [...rows].sort((a, b) => a.faction.localeCompare(b.faction) || a.role.localeCompare(b.role) || a.id.localeCompare(b.id))) {
    L.push(`| \`${r.id}\` | ${r.faction} | ${r.role} | ${r.cost} | ${r.ttk[targets[0]]?.distance ?? ''} | ${targets.map(t => cell(r.ttk[t])).join(' | ')} | ${r.flags.join('; ')} |`);
  }
  return `${L.join('\n')}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const seeds = Number(process.argv[2] ?? 100);
  const data = loadGameData(root), criteria = JSON.parse(fs.readFileSync(path.join(root, 'data/balance/greybox.json'), 'utf8'));
  const t0 = process.hrtime.bigint();
  const table = ttkTable(data, criteria, { seeds });
  fs.mkdirSync(path.join(root, 'reports/greybox'), { recursive: true });
  fs.writeFileSync(path.join(root, 'reports/greybox/ttk.md'), markdown(table, criteria, seeds));
  fs.writeFileSync(path.join(root, 'reports/greybox/ttk.json'), `${JSON.stringify(table, null, 1)}\n`);
  console.log(`ttk: ${table.rows.length} squads × ${table.targets.length} targets, ${table.rows.filter(r => r.flags.length).length} flagged, ${Number(process.hrtime.bigint() - t0) / 1e9 | 0} s`);
}
