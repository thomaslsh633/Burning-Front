// Picks the screen for the current App state and swaps it in. Knows nothing about transitions:
// it is told the state and the allowed events, and reports the player's choice through onEvent.
import { lobbyScreen } from './lobby.js';
import { placeholderScreen } from './placeholder.js';

export function createScreens(root, { t, version, onEvent }) {
  const builders = {
    Boot: () => null,
    Lobby: () => lobbyScreen({ t, version, onNewMatch: () => onEvent('newMatch'), onContinue: () => onEvent('continueSave') }),
  };
  return {
    show(state, events) {
      const build = builders[state] || (() => placeholderScreen({ t, state, events, onEvent }));
      const node = build();
      root.replaceChildren(...(node ? [node] : []));
      root.dataset.state = state;
    },
  };
}
