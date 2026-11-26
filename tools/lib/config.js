// Loads every settings file the tools need, once, and wires the scale into the rule settings.
import fs from 'node:fs';
import path from 'node:path';

const read = (root, f) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));

/** { scale, fire, indirect, ammo, vocab, profiles, roster } for the repo at `root`. */
export function loadConfig(root) {
  const scale = read(root, 'data/balance/scale.json');
  const indirect = { ...read(root, 'data/balance/indirect.json'), scale };
  const fire = { ...read(root, 'data/balance/fire-rate.json'), window_seconds: scale.fire_window_seconds, indirect, scale };
  return { scale, fire, indirect, ammo: read(root, 'data/balance/ammo.json'), vocab: read(root, 'data/rules/vocab.json'),
    profiles: read(root, 'data/schema/profiles.json'), roster: read(root, 'data/rules/roster.json') };
}
