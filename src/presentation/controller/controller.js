// Gives intents a meaning (SPEC §8): tap an own unit to select it; first tap on a target or a hex previews, a second tap on
// the same one executes, anything else cancels. Buttons: end turn and the selected unit's orders. UiState only; game state
// changes go through store.dispatch. Rules are asked of logic (reachable, previewAttack, validate), never computed here.
import { validate } from '../../logic/commands/index.js';
import { reachable } from '../../logic/movement/index.js';
import { previewAttack } from '../../logic/combat/index.js';
import { unitAt } from '../../logic/state/index.js';
import { producers, offers, priceOf, conversionOf, researchOffers, researchOf, doctrinesOf } from '../../logic/economy/index.js';
import { passengers } from '../../logic/transport/index.js';
import { buildable } from '../../logic/build/index.js';
import { abilitiesOf, skillReady } from '../../logic/skills/index.js';
import { mapOf } from '../../logic/terrain/index.js';

const BUTTONS = { emplace: 'Emplace', pack: 'Pack', hold: 'Hold', retreat: 'Retreat', exit: 'Exit', unload: 'Unload' };
/** The unit a tap on this hex means: one standing there or garrisoned there (passengers are inside their transport). */
const occupant = (s, h) => unitAt(s, h) ?? Object.values(s.units).find(u => u.fsm.location === 'GARRISONED' && u.pos.c === h.c && u.pos.r === h.r);

/** { store, data, onUiChange(ui) } → { ui(), onIntent(intent) } */
export function createController({ store, data, onUiChange = () => {} }) {
  // camera: the view angle stays fixed (SPEC §9: 35° above the ground); yaw turns in 60° steps, zoom scales the hexes
  let ui = { selected: null, building: null, placing: null, aiming: null, preview: null, message: null, camera: { yaw: 45, zoom: 1 } };
  const set = next => { ui = { ...ui, ...next }; onUiChange(ui); };
  const send = cmd => {
    const r = store.dispatch(cmd);
    set({ preview: null, placing: null, aiming: null, message: r.error ? `${cmd.type}: ${r.error}` : null });
    if (!store.getState().units[ui.selected]) set({ selected: null });
  };

  function tapHex({ c, r }) {
    const s = store.getState(), side = s.match.side, hex = { c, r }, here = occupant(s, hex), sel = s.units[ui.selected];
    if (ui.aiming) return send(data.units.ability[ui.aiming].target === 'unit' ? { type: 'UseSkill', side, unit: ui.selected, ability: ui.aiming, target: here?.id }
      : { type: 'UseSkill', side, unit: ui.selected, ability: ui.aiming, hex });
    if (ui.placing) return send(ui.building ? { type: 'Produce', side, building: ui.building, sbps: ui.placing, hex } : { type: 'Build', side, unit: ui.selected, sbps: ui.placing, hex });
    const building = producers(s, data).find(b => b.team === side && b.hexes.includes(`${c},${r}`));
    if (building) return set({ selected: null, building: building.id, preview: null, message: null });
    if (here && here.team === side) return set({ selected: here.id, building: null, preview: null, message: null });
    if (!sel) return set({ preview: null });
    if (here) {
      const cmd = { type: 'Attack', side, unit: sel.id, target: here.id };
      if (ui.preview?.cmd?.type === 'Attack' && ui.preview.cmd.target === here.id) return send(cmd);
      const error = validate(s, cmd, data);
      return set({ preview: error ? null : { cmd, attack: previewAttack(s, data, sel.id, here.id) }, message: error ? `Attack: ${error}` : null });
    }
    if (sel.container) return send({ type: 'Exit', side, unit: sel.id, hex });   // inside: a tap on a hex beside it gets out there
    const cmd = { type: 'Move', side, unit: sel.id, to: hex };
    if (ui.preview?.cmd?.type === 'Move' && ui.preview.cmd.to.c === c && ui.preview.cmd.to.r === r) return send(cmd);
    const error = validate(s, cmd, data);
    return set(error ? { preview: null, message: null } : { preview: { cmd, cost: reachable(s, data, sel.id).get(`${c},${r}`)?.cost }, message: null });
  }

  function tapButton(id) {
    const s = store.getState(), side = s.match.side;
    if (id === 'rotateLeft' || id === 'rotateRight') return set({ camera: { ...ui.camera, yaw: (ui.camera.yaw + (id === 'rotateLeft' ? -60 : 60) + 360) % 360 } });
    if (id === 'zoomIn' || id === 'zoomOut') return zoom(id === 'zoomIn' ? 1.25 : 0.8);
    if (id === 'end') { set({ selected: null, building: null }); return send(s.match.side == null ? { type: 'StartMatch', side: null } : { type: 'EndTurn', side }); }
    if (BUTTONS[id] && ui.selected) return send({ type: BUTTONS[id], side, unit: ui.selected });
    if (id.startsWith('produce:') && ui.building) {
      const drop = (data.units.sbps[id.slice(8)].traits || []).includes('paradrop');
      return set({ placing: id.slice(8), message: `${id.slice(8)}: tap ${drop ? 'any free hex (paradrop)' : 'a free hex beside the building'}` });
    }
    if (id.startsWith('doctrine:')) return send({ type: 'ChooseDoctrine', side, doctrine: id.slice(9) });
    if (id.startsWith('research:') && ui.building) return send({ type: 'Research', side, building: ui.building, research: id.slice(9) });
    if (id.startsWith('build:') && ui.selected) return set({ placing: id.slice(6), message: `${id.slice(6)}: tap a free hex 1–2 away` });
    if (id.startsWith('skill:') && ui.selected) return set({ aiming: id.slice(6), message: `${id.slice(6)}: tap ${data.units.ability[id.slice(6)].target === 'unit' ? 'an enemy' : 'a hex'}` });
    if (id.startsWith('work:') && ui.selected) return send({ type: 'Build', side, unit: ui.selected, site: id.slice(5) });
    if (id.startsWith('convert:') && ui.selected) return send({ type: 'Convert', side, unit: ui.selected, to: id.slice(8) });
    if (id.startsWith('upgrade:') && ui.selected) return send({ type: 'Upgrade', side, unit: ui.selected, upgrade: id.slice(8) });
    if (id.startsWith('garrison:') && ui.selected) return send({ type: 'Garrison', side, unit: ui.selected, building: id.slice(9) });
    if (id.startsWith('board:') && ui.selected) return send({ type: 'Board', side, unit: ui.selected, vehicle: id.slice(6) });
    return undefined;
  }

  /** Context buttons: what the selected building produces, or the selected unit's conversions (with why one is locked). */
  function actions() {
    const s = store.getState(), cost = c => Object.entries(c).map(([k, v]) => `${v} ${k.slice(0, 3)}`).join(' ') || 'free';
    if (ui.building) {
      const research = researchOffers(s, data, ui.building).map(id => {
        const r = researchOf(s, data, ui.building, id), error = validate(s, { type: 'Research', side: s.match.side, building: ui.building, research: id }, data);
        return { id: `research:${id}`, label: `⚗ ${id} (${cost(r.cost)}, ${r.turns} turns)${error ? ` [${error}]` : ''}`, disabled: !!error };
      });
      return [...offers(s, data, ui.building).map(id => ({ id: `produce:${id}`, label: `${id} (${cost(priceOf(id, data))})` })), ...research];
    }
    const u = s.units[ui.selected];
    // nothing selected: the side picks its doctrine once (CoH3 battlegroups)
    if (!u) return s.match.side && !s.teams[s.match.side].doctrine ? Object.entries(doctrinesOf(s, data, s.match.side))
      .map(([id, bg]) => ({ id: `doctrine:${id}`, label: `★ doctrine ${id} (${bg.units.length} units, ${bg.upgrades.length} upgrades)` })) : [];
    const conversions = data.rules.conversions.conversions.filter(c => c.from === u.sbps).map(c => {
      const error = validate(s, { type: 'Convert', side: s.match.side, unit: u.id, to: c.to }, data);
      return { id: `convert:${c.to}`, label: `→ ${c.to} (${cost(conversionOf(data, c.from, c.to).cost)})${error ? ` [${error}]` : ''}`, disabled: !!error };
    });
    const upgrades = (data.units.sbps[u.sbps].upgrades?.list || []).map(id => {
      const error = validate(s, { type: 'Upgrade', side: s.match.side, unit: u.id, upgrade: id }, data);
      return { id: `upgrade:${id}`, label: `+ ${id} (${cost(data.units.upgrade[id]?.cost ?? {})})${error ? ` [${error}]` : ''}`, disabled: !!error };
    });
    // go inside: every building or own transport the logic would let this unit enter now
    const enter = [...Object.keys(mapOf(s, data).structures).map(id => ['Garrison', 'building', id]), ...Object.keys(s.units).filter(id => id !== u.id).map(id => ['Board', 'vehicle', id])]
      .filter(([type, field, id]) => !validate(s, { type, side: s.match.side, unit: u.id, [field]: id }, data))
      .map(([type, , id]) => ({ id: `${type.toLowerCase()}:${id}`, label: `${type} ${id}` }));
    const inside = u.container ? [{ id: 'exit', label: `Exit ${u.container} (or tap a hex beside it)` }] : [];
    const carried = passengers(s, u.id).length ? [{ id: 'unload', label: `Unload (${passengers(s, u.id).map(p => p.id).join(', ')})` }] : [];
    const builds = buildable(u, data).map(id => ({ id: `build:${id}`, label: `Build ${id} (${cost(priceOf(id, data))}, ${data.units.sbps[id].build_turns ?? 1} turns)` }));
    const sites = Object.values(s.units).filter(x => x.fsm.life === 'CONSTRUCTING' && !validate(s, { type: 'Build', side: s.match.side, unit: u.id, site: x.id }, data))
      .map(x => ({ id: `work:${x.id}`, label: `Work on ${x.id} ${x.sbps} (${x.timers.build} left)` }));
    const skills = abilitiesOf(u, data).map(id => {
      const ab = data.units.ability[id], why = skillReady(s, u, id, data);
      return { id: `skill:${id}`, label: `◎ ${id} (${cost(ab.cost ?? {})}, ${ab.shells}× ${ab.weapon}, cooldown ${ab.cooldown_turns})${why ? ` [${why}]` : ''}`, disabled: !!why };
    });
    return [...skills, ...enter, ...inside, ...carried, ...sites, ...builds, ...upgrades, ...conversions];
  }

  function zoom(factor) {
    set({ camera: { ...ui.camera, zoom: Math.round(Math.min(3, Math.max(0.5, ui.camera.zoom * factor)) * 100) / 100 } });
  }

  return {
    ui: () => ui,
    actions,
    onIntent(intent) {
      if (intent.type === 'tapHex') return tapHex(intent);
      if (intent.type === 'zoom') return zoom(intent.factor);
      if (intent.type === 'tapButton') return tapButton(intent.id);
      return undefined;
    },
  };
}
