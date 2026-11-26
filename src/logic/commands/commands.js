// A player action is a command { type, side, unit?, … }. validate → reason code or null; apply → { state, events } or { error }.
// Checks common to every command live here (match over, whose turn, own unit, state-machine vetoes); the rule itself
// is the route's, in the owning system.
import { permits } from '../fsm/index.js';
import { ROUTES, MACHINES } from './routes.js';

export function validate(state, cmd, data, routes = ROUTES, machines = MACHINES) {
  const route = routes[cmd?.type];
  if (!route) return 'unknown_command';
  if (state.match.over) return 'match_over';
  if (cmd.side !== state.match.side) return 'not_your_turn';
  if (route.unit) {
    const u = state.units[cmd.unit];
    if (!u) return 'no_such_unit';
    if (u.team !== cmd.side) return 'not_your_unit';
    const p = permits(machines, u, cmd.type);
    if (!p.ok) return p.reason;
  }
  return route.validate?.(state, cmd, data) ?? null;
}

export function apply(state, cmd, data, rng, routes = ROUTES, machines = MACHINES) {
  const error = validate(state, cmd, data, routes, machines);
  if (error) return { error };
  const r = routes[cmd.type].apply(state, cmd, data, rng);
  return { state: r.state, events: r.events, undoable: !!routes[cmd.type].undoable && r.undoable !== false };
}
