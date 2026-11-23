// Architecture guard run by build.js: layer import rules, and no browser / clock / randomness in core.
import { walk } from './bundle.js';

// Which layer a module id belongs to.
export function layerOf(id) {
  if (id === 'src/main.js') return 'main';
  const m = /^src\/(core|app|input|view|services)\//.exec(id);
  if (m) return m[1];
  if (id.startsWith('data/')) return 'data';
  return 'other';
}

// Calls only go down: input / view -> app -> core -> data. main wires everything.
export const ALLOWED = Object.freeze({
  core: ['core', 'data'],
  services: ['services', 'core', 'data'],
  app: ['app', 'core', 'services', 'data'],
  input: ['input', 'services'],
  view: ['view', 'core', 'services', 'data'],
  main: ['main', 'core', 'app', 'input', 'view', 'services', 'data'],
  data: [],
  other: [],
});

// Rules in core get state, data and an rng as arguments; they never reach for these.
export const CORE_FORBIDDEN = Object.freeze([
  'window', 'document', 'globalThis', 'self', 'navigator', 'localStorage', 'sessionStorage',
  'performance', 'Date', 'setTimeout', 'setInterval', 'requestAnimationFrame', 'cancelAnimationFrame',
  'fetch', 'XMLHttpRequest', 'Audio', 'Image', 'console',
]);

export function checkLayers(modules) {
  const errors = [];
  for (const mod of modules) {
    const from = layerOf(mod.id);
    if (from === 'other') { errors.push(`${mod.id}: file is outside src/ and data/`); continue; }
    for (const dep of mod.deps) {
      const to = layerOf(dep);
      if (!ALLOWED[from].includes(to)) errors.push(`${mod.id}: ${from} may not import ${to} (${dep})`);
    }
  }
  return errors;
}

// Identifier nodes that are names of globals (not property keys, member names or labels).
function isReference(node, parent) {
  if (!parent) return true;
  if ((parent.type === 'MemberExpression') && parent.property === node && !parent.computed) return false;
  if ((parent.type === 'Property' || parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition') &&
      parent.key === node && !parent.computed && !parent.shorthand) return false;
  if (/^(Labeled|Break|Continue)Statement$/.test(parent.type)) return false;
  if (/^(Import|Export)/.test(parent.type)) return false;
  return true;
}

export function checkCoreGlobals(modules) {
  const errors = [];
  for (const mod of modules) {
    if (layerOf(mod.id) !== 'core' || mod.json) continue;
    walk(mod.ast, (node, parent) => {
      const line = node.loc && node.loc.start.line;
      if (node.type === 'Identifier' && CORE_FORBIDDEN.includes(node.name) && isReference(node, parent)) {
        errors.push(`${mod.id}:${line}: core may not use '${node.name}' (pass it in from app / services)`);
      }
      if (node.type === 'MemberExpression' && !node.computed && node.object.type === 'Identifier' &&
          node.object.name === 'Math' && node.property.name === 'random') {
        errors.push(`${mod.id}:${line}: core may not use Math.random (take the seeded rng argument)`);
      }
    });
  }
  return errors;
}
