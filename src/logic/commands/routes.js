// Which system handles each command, and the unit state machines every unit command must pass.
// A system adds its commands here when it ships them; commands never implement a rule itself.
//
// route: { validate(state, cmd, data) → reason | null, apply(state, cmd, data, rng) → { state, events },
//          unit?: true (cmd.unit must be an own unit and every axis must permit cmd.type), undoable?: true }

/** Unit axes in hierarchy order (lifecycle first); filled as their owning systems ship. */
export const MACHINES = [];

export const ROUTES = {};
