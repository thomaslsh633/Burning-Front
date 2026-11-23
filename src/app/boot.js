// Boot: load what the game needs, then enter the lobby. Data loading arrives in Phase 1.
import { AppEvent } from './app-state.js';

export function boot(app) {
  app.send(AppEvent.loaded);
}
