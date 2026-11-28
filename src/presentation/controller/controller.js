// Gives intents a meaning (SPEC §8): tap an own unit to select it; first tap on a target or a hex previews, a second tap on
// the same one executes, anything else cancels. Buttons: end turn and the selected unit's orders. UiState only; game state
// changes go through store.dispatch. Rules are asked of logic (reachable, previewAttack, validate), never computed here.
import { validate } from '../../logic/commands/index.js';
import { reachable } from '../../logic/movement/index.js';
import { previewAttack } from '../../logic/combat/index.js';
import { unitAt } from '../../logic/state/index.js';

const BUTTONS = { emplace: 'Emplace', pack: 'Pack', hold: 'Hold', retreat: 'Retreat' };

/** { store, data, onUiChange(ui) } → { ui(), onIntent(intent) } */
export function createController({ store, data, onUiChange = () => {} }) {
  let ui = { selected: null, preview: null, message: null };
  const set = next => { ui = { ...ui, ...next }; onUiChange(ui); };
  const send = cmd => {
    const r = store.dispatch(cmd);
    set({ preview: null, message: r.error ? `${cmd.type}: ${r.error}` : null });
    if (!store.getState().units[ui.selected]) set({ selected: null });
  };

  function tapHex({ c, r }) {
    const s = store.getState(), side = s.match.side, hex = { c, r }, here = unitAt(s, hex), sel = s.units[ui.selected];
    if (here && here.team === side) return set({ selected: here.id, preview: null, message: null });
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
    if (id === 'end') { set({ selected: null }); return send(s.match.side == null ? { type: 'StartMatch', side: null } : { type: 'EndTurn', side }); }
    if (BUTTONS[id] && ui.selected) return send({ type: BUTTONS[id], side, unit: ui.selected });
    return undefined;
  }

  return {
    ui: () => ui,
    onIntent(intent) {
      if (intent.type === 'tapHex') return tapHex(intent);
      if (intent.type === 'tapButton') return tapButton(intent.id);
      return undefined;
    },
  };
}
