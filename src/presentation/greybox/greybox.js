// Greybox view (dev plan G-2, G-3): Canvas 2D, no art, quarter view (45° turn, camera 35° above the ground). Hexes in grey steps by terrain, units as team-coloured discs with a
// kind letter and their HP, points as rings in the owner's colour; the selected unit's reachable hexes and the preview.
// debugText: the selected unit's state axes, budget, weapons and the attack preview. Reads state; never changes it.
import { hexAt, mapOf, isCollapsed } from '../../logic/terrain/index.js';
import { reachable } from '../../logic/movement/index.js';
import { firingWeapons } from '../../logic/combat/index.js';
import { fromKey } from '../../logic/hex/index.js';

const TEAM = { blue: '#4a8fd8', red: '#d85a4a' }, KIND = { squad: 'S', team_weapon: 'W', vehicle: 'V', structure: 'B' };
const ROOT3 = Math.sqrt(3);

/**
 * Quarter view (2026-11-28): the map turned `yaw` degrees and seen from `pitch` degrees above the ground, so ground depth
 * shrinks to sin(pitch); hexes rise by their elevation. size: hex radius in px.
 * → { size, centre(h, elev?), toHex(x, y), fit(cols, rows) → { w, h }, draw(ctx, state, ui, data) }
 */
export function createView(size = 22, { yaw = 45, pitch = 35, elevPx = size * 0.6 } = {}) {
  const W = ROOT3 * size, cy = Math.cos((yaw * Math.PI) / 180), sy = Math.sin((yaw * Math.PI) / 180);
  const squash = Math.sin((pitch * Math.PI) / 180), lift = Math.cos((pitch * Math.PI) / 180) * elevPx;
  let off = { x: 0, y: 0 }, dims = { cols: 0, rows: 0 }, elevAt = () => 0;
  const world = h => ({ x: W * (h.c + (h.r & 1) / 2), y: 1.5 * size * h.r });
  const project = (x, y, elev = 0) => ({ x: x * cy - y * sy + off.x, y: (x * sy + y * cy) * squash - elev * lift + off.y });
  const centre = (h, elev = 0) => { const w = world(h); return project(w.x, w.y, elev); };
  const corners = (h, s = size, elev = 0) => {
    const w = world(h);
    return [0, 1, 2, 3, 4, 5].map(i => { const a = (Math.PI / 3) * i - Math.PI / 6; return project(w.x + s * Math.cos(a), w.y + s * Math.sin(a), elev); });
  };
  const hexPath = (ctx, h, s = size, elev = elevAt(h)) => {
    ctx.beginPath();
    corners(h, s, elev).forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p.x, p.y));
    ctx.closePath();
  };
  return {
    size, centre,
    fit(cols, rows, maxElev = 2) {
      dims = { cols, rows };
      off = { x: 0, y: 0 };
      const pts = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) pts.push(...corners({ c, r }), ...corners({ c, r }, size, maxElev));
      const minX = Math.min(...pts.map(p => p.x)), minY = Math.min(...pts.map(p => p.y)) - size, pad = size;
      off = { x: pad - minX, y: pad - minY };
      return { w: Math.ceil(Math.max(...pts.map(p => p.x)) - minX + 2 * pad), h: Math.ceil(Math.max(...pts.map(p => p.y)) - minY + 2 * pad) };
    },
    toHex(x, y) {   // nearest projected centre (maps are small); elevation as last drawn
      let best = null;
      for (let r = 0; r < dims.rows; r++) for (let c = 0; c < dims.cols; c++) {
        const p = centre({ c, r }, elevAt({ c, r })), d = (p.x - x) ** 2 + ((p.y - y) / squash) ** 2;
        if (!best || d < best.d) best = { c, r, d };
      }
      return best && best.d <= size * size ? { c: best.c, r: best.r } : null;
    },
    draw(ctx, state, ui, data) {
      elevAt = h => hexAt(state, data, h).elev;
      ctx.fillStyle = '#202326'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      const sel = state.units[ui.selected], reach = sel ? reachable(state, data, sel.id) : new Map();
      const hexes = [];
      for (let r = 0; r < state.map.rows; r++) for (let c = 0; c < state.map.cols; c++) hexes.push({ c, r });
      const depth = h => centre(h).y;
      for (const { c, r } of hexes.sort((a, b) => depth(a) - depth(b))) {   // back to front
        const t = hexAt(state, data, { c, r });
        const cost = t.feature?.cost?.infantry ?? t.ground.cost.infantry, cover = t.feature?.cover;
        const g = t.oob ? 30 : cost == null ? 55 : t.featureKind === 'structure' ? 75 : cover === 'heavy' ? 105 : cover === 'light' ? 125 : 145;
        if (t.elev > 0) {   // the raised hex's front faces
          const top = corners({ c, r }, size, t.elev), base = corners({ c, r }, size, 0);
          ctx.fillStyle = `rgb(${g - 45},${g - 45},${g - 40})`;
          for (let i = 0; i < 6; i++) {
            const j = (i + 1) % 6;
            ctx.beginPath(); ctx.moveTo(top[i].x, top[i].y); ctx.lineTo(top[j].x, top[j].y); ctx.lineTo(base[j].x, base[j].y); ctx.lineTo(base[i].x, base[i].y); ctx.closePath(); ctx.fill();
          }
        }
        hexPath(ctx, { c, r }); ctx.fillStyle = `rgb(${g},${g},${g + 4})`; ctx.fill();
        ctx.strokeStyle = '#2b2e31'; ctx.lineWidth = 1; ctx.stroke();
        if (reach.get(`${c},${r}`)?.stop && (c !== sel.pos.c || r !== sel.pos.r)) { hexPath(ctx, { c, r }, size * 0.8); ctx.strokeStyle = '#7fd07f'; ctx.stroke(); }
      }
      for (const [id, st] of Object.entries(mapOf(state, data).structures)) {
        if (!st.team || isCollapsed(state, id)) continue;
        for (const k of st.hexes) { hexPath(ctx, fromKey(k), size * 0.55); ctx.fillStyle = TEAM[st.team]; ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1; }
      }
      const defs = Object.fromEntries(mapOf(state, data).points.map(p => [p.id, p]));
      for (const p of state.points) {
        const h = fromKey(defs[p.id].hex);
        hexPath(ctx, h, size * 0.75); ctx.lineWidth = 3; ctx.strokeStyle = p.owner ? TEAM[p.owner] : '#d8d8a0'; ctx.stroke();
        const { x, y } = centre(h, elevAt(h));
        ctx.fillStyle = '#e8e8c0'; ctx.font = `${size * 0.5}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(defs[p.id].kind === 'vp' ? '★' : defs[p.id].kind[0].toUpperCase(), x, y - size * 0.3);
      }
      const units = Object.values(state.units).filter(u => u.fsm.location === 'ON_MAP').sort((a, b) => depth(a.pos) - depth(b.pos));
      for (const u of units) {
        const ground = centre(u.pos, elevAt(u.pos)), x = ground.x, y = ground.y - size * 0.45;   // upright token standing on its hex
        ctx.beginPath(); ctx.ellipse(ground.x, ground.y, size * 0.5, size * 0.5 * squash, 0, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, size * 0.55, 0, 2 * Math.PI);
        ctx.fillStyle = u.team ? TEAM[u.team] : '#888'; ctx.globalAlpha = u.fsm.action === 'EXHAUSTED' ? 0.55 : 1; ctx.fill(); ctx.globalAlpha = 1;
        if (u.id === ui.selected) { ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke(); }
        if (ui.preview?.cmd?.target === u.id) { ctx.lineWidth = 3; ctx.strokeStyle = '#ffcc33'; ctx.stroke(); }
        const a = (Math.PI / 3) * u.facing, w = world(u.pos), tip = project(w.x + size * 0.9 * Math.cos(a), w.y + size * 0.9 * Math.sin(a), elevAt(u.pos));
        ctx.beginPath(); ctx.moveTo(ground.x, ground.y); ctx.lineTo(tip.x, tip.y); ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `bold ${size * 0.55}px sans-serif`; ctx.fillText(KIND[u.kind] ?? '?', x, y + size * 0.2);
        ctx.font = `${size * 0.42}px sans-serif`; ctx.fillText(String(u.members.reduce((n, m) => n + m.hp, 0)), x, y - size * 0.7);
      }
      if (ui.preview?.cmd?.type === 'Move') { hexPath(ctx, ui.preview.cmd.to, size * 0.8); ctx.lineWidth = 3; ctx.strokeStyle = '#b8ffb8'; ctx.stroke(); }
    },
  };
}

/** Plain text for the debug panel: match, the selected unit and the preview (dev plan G-3). */
export function debugText(state, ui, data) {
  const L = [`turn ${state.match.turn} · ${state.match.side ?? 'not started'}${state.match.over ? ` · OVER: ${state.match.over.winner ?? 'draw'} (${state.match.over.reason})` : ''}`];
  for (const [t, v] of Object.entries(state.teams)) L.push(`${t}: ${v.faction} · MP ${v.resources?.manpower ?? 0} mun ${v.resources?.munition ?? 0} fuel ${v.resources?.fuel ?? 0} · tickets ${v.tickets}`);
  if (ui.message) L.push(`! ${ui.message}`);
  if (ui.building) L.push('', `building ${ui.building}${ui.placing ? ` · placing ${ui.placing}` : ''}`);
  const u = state.units[ui.selected];
  if (u) {
    L.push('', `${u.id} ${u.sbps} (${u.kind}) at ${u.pos.c},${u.pos.r} facing ${u.facing}`,
      `axes: ${Object.entries(u.fsm).map(([k, v]) => `${k} ${v}`).join(' · ')}`,
      `budget: move ${u.budget.move} action ${u.budget.action} counter ${u.budget.counter}${u.budget.fired ? ' fired' : ''}${u.budget.moved ? ' moved' : ''}`,
      `suppression ${u.suppression} · ammo ${u.ammo} · reload ${u.timers.reload} · xp ${u.xp} rank ${u.rank}${u.engaged ? ' · engaged' : ''}${u.criticals.length ? ` · ${u.criticals.join(', ')}` : ''}`,
      `members: ${u.members.map(m => m.hp).join(' ')}`);
    for (const w of firingWeapons(u, data)) {
      const a = w.weapon.attack;
      L.push(`  ${w.id}: range ${a.range_hex.min ?? 0}–${a.range_hex.max} · shots ${a.shots_per_turn.near}/${a.shots_per_turn.mid}/${a.shots_per_turn.far} · acc ${a.accuracy.near}/${a.accuracy.mid}/${a.accuracy.far} · dmg ${a.damage_per_shot.near} · pen ${w.weapon.penetration.near}/${w.weapon.penetration.far}${w.weapon.indirect ? ` · spread ${w.weapon.indirect.spread_hex ?? 0}` : ''}`);
    }
  }
  const p = ui.preview;
  if (p?.attack) {
    L.push('', `preview → ${p.cmd.target}: expected kills ${p.attack.expectedKills}, suppression ${p.attack.suppression}, HP loss ${p.attack.hpLoss.join(' ')}`);
    for (const w of p.attack.weapons) L.push(`  ${w.weapon}: ${w.band} band, cover ${w.cover}, ${w.shots} shots, expected damage ${w.expectedDamage}`);
  }
  if (p?.cmd?.type === 'Move') L.push('', `move → ${p.cmd.to.c},${p.cmd.to.r}: ${p.cost} move points (tap again)`);
  return L.join('\n');
}
