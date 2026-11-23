// Game-level state: the whole app is in exactly one App state. Screens, input and rendering switch on it.
import { enumOf, defineMachine } from '../core/fsm.js';

export const App = enumOf('Boot', 'Lobby', 'Setup', 'Loading', 'Playing', 'Paused', 'TurnCurtain', 'GameOver', 'Result');

export const AppEvent = enumOf(
  'loaded', 'newMatch', 'continueSave', 'back', 'deploy', 'ready',
  'menu', 'resume', 'quit', 'turnEnded', 'curtainTapped', 'victory', 'showResult', 'returnToLobby',
);

export const AppMachine = defineMachine('app', {
  states: App,
  initial: App.Boot,
  transitions: {
    [App.Boot]: { [AppEvent.loaded]: App.Lobby },
    [App.Lobby]: { [AppEvent.newMatch]: App.Setup, [AppEvent.continueSave]: App.Loading },
    [App.Setup]: { [AppEvent.deploy]: App.Loading, [AppEvent.back]: App.Lobby },
    [App.Loading]: { [AppEvent.ready]: App.Playing },
    [App.Playing]: { [AppEvent.menu]: App.Paused, [AppEvent.turnEnded]: App.TurnCurtain, [AppEvent.victory]: App.GameOver },
    [App.Paused]: { [AppEvent.resume]: App.Playing, [AppEvent.quit]: App.Lobby },
    [App.TurnCurtain]: { [AppEvent.curtainTapped]: App.Playing },
    [App.GameOver]: { [AppEvent.showResult]: App.Result },
    [App.Result]: { [AppEvent.returnToLobby]: App.Lobby },
  },
});
