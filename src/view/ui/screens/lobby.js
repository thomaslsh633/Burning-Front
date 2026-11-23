// Lobby screen: title, version and the match entry buttons. Buttons only report the player's choice.
import { el } from '../dom.js';

export function lobbyScreen({ t, version, onNewMatch, onContinue }) {
  return el('section', { class: 'screen lobby' },
    el('div', { class: 'plate lobby-card' },
      el('h1', { class: 'lobby-title' }, t('game.title')),
      el('p', { class: 'lobby-sub' }, t('lobby.subtitle')),
      el('div', { class: 'lobby-actions' },
        el('button', { class: 'btn btn-main', onclick: onNewMatch }, t('lobby.newMatch')),
        el('button', { class: 'btn', onclick: onContinue }, t('lobby.continueSave')),
      ),
      el('p', { class: 'lobby-version' }, version),
    ),
  );
}
