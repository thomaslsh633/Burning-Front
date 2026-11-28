// Gives intents a meaning (SPEC §8): tap an own unit to select it; first tap on a target or a hex previews, a second tap on
// the same one executes, anything else cancels. Buttons: end turn and the selected unit's orders. UiState only; game state
// changes go through store.dispatch. Rules are asked of logic (reachable, previewAttack, validate), never computed here.
import { validate } from '../../logic/commands/index.js';
import { reachable } from '../../logic/movement/index.js';
import { previewAttack } from '../../logic/combat/index.js';
import { unitAt } from '../../logic/state/index.js';
import { producers, offers, priceOf, conversionOf } from '../../logic/economy/index.js';

const BUTTONS = { emplace: 'Emplace', pack: 'Pack', hold: 'Hold', retreat: 'Retreat' };

/** { store, data, onUiChange(ui) } → { ui(), onIntent(intent) } */
export function createController({ store, data, onUiChange = () => {} }) {
  // camera: the view angle stays fixed (SPEC §9: 35° above the ground); yaw turns in 60° steps, zoom scales the hexes
  let ui = { selected: null, building: null, placing: null, preview: null, message: null, camera: { yaw: 45, zoom: 1 } };
  const set = next => { ui = { ...ui, ...next }; onUiChange(ui); };
  const send = cmd => {
    const r = store.dispatch(cmd);
    set({ preview: null, placing: null, message: r.error ? `${cmd.type}: ${r.error}` : null });
    if (!store.getState().units[ui.selected]) set({ selected: null });
  };

  function tapHex({ c, r }) {
    const s = store.getState(), side = s.match.side, hex = { c, r }, here = unitAt(s, hex), sel = s.units[ui.selected];
    if (ui.placing) return send({ type: 'Produce', side, building: ui.building, sbps: ui.placing, hex });
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
    if (id.startsWith('produce:') && ui.building) return set({ placing: id.slice(8), message: `${id.slice(8)}: tap a free hex beside the building` });
    if (id.startsWith('convert:') && ui.selected) return send({ type: 'Convert', side, unit: ui.selected, to: id.slice(8) });
    if (id.startsWith('upgrade:') && ui.selected) return send({ type: 'Upgrade', side, unit: ui.selected, upgrade: id.slice(8) });
    return undefined;
  }

  /** Context buttons: what the selected building produces, or the selected unit's conversions (with why one is locked). */
  function actions() {
    const s = store.getState(), cost = c => Object.entries(c).map(([k, v]) => `${v} ${k.slice(0, 3)}`).join(' ') || 'free';
    if (ui.building) return offers(s, data, ui.building).map(id => ({ id: `produce:${id}`, label: `${id} (${cost(priceOf(id, data))})` }));
    const u = s.units[ui.selected];
    if (!u) return [];
    const conversions = data.rules.conversions.conversions.filter(c => c.from === u.sbps).map(c => {
      const error = validate(s, { type: 'Convert', side: s.match.side, unit: u.id, to: c.to }, data);
      return { id: `convert:${c.to}`, label: `→ ${c.to} (${cost(conversionOf(data, c.from, c.to).cost)})${error ? ` [${error}]` : ''}`, disabled: !!error };
    });
    const upgrades = (data.units.sbps[u.sbps].upgrades?.list || []).map(id => {
      const error = validate(s, { type: 'Upgrade', side: s.match.side, unit: u.id, upgrade: id }, data);
      return { id: `upgrade:${id}`, label: `+ ${id} (${cost(data.units.upgrade[id]?.cost ?? {})})${error ? ` [${error}]` : ''}`, disabled: !!error };
    });
    return [...upgrades, ...conversions];
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
