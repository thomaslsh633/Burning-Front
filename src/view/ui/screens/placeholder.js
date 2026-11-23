// Stand-in for a screen that is not built yet: shows the state name and one button per allowed event,
// so every App transition can be tried on the device. Replaced screen by screen in Phase 5.
import { el } from '../dom.js';

export function placeholderScreen({ t, state, events, onEvent }) {
  return el('section', { class: 'screen placeholder' },
    el('div', { class: 'plate placeholder-card' },
      el('h2', {}, t(`state.${state}`), el('span', { class: 'state-key' }, state)),
      el('p', { class: 'placeholder-note' }, t('screen.notBuilt')),
      el('div', { class: 'placeholder-actions' },
        events.map(ev => el('button', { class: 'btn', onclick: () => onEvent(ev) }, t(`event.${ev}`))),
      ),
    ),
  );
}
