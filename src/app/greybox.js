// Greybox boot (dev plan G-2): fetches the game data, starts a 1v1 on a map and wires input → controller → store → view.
// Wiring only, no rules. URL options: ?map=skirmish&blue=american&red=german&mode=capture&seed=1
import { gameFiles, assembleGameData } from '../services/data/index.js';
import { createRng } from '../services/rng/index.js';
import { createStore } from '../logic/store/index.js';
import { createMatch } from '../logic/state/index.js';
import { createController } from '../presentation/controller/index.js';
import { attach } from '../presentation/input/index.js';
import { createView, debugText } from '../presentation/greybox/index.js';

export async function bootGreybox(doc, root = '.') {
  const q = new URLSearchParams(doc.location.search), opt = k => q.get(k);
  const map = opt('map') ?? 'greybox';
  const get = p => fetch(`${root}/${p}`).then(r => { if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json(); });
  const files = Object.fromEntries(await Promise.all(gameFiles().map(async f => [f, await get(f)])));
  const data = assembleGameData(files, { [map]: await get(`data/generated/maps/${map}.json`) });
  const resources = { manpower: 600, munition: 10, fuel: 20 };
  const state = createMatch({ map: { id: map }, mode: opt('mode') ?? 'capture', order: ['blue', 'red'], rng: Number(opt('seed') ?? 1),
    teams: { blue: { faction: opt('blue') ?? 'american', resources }, red: { faction: opt('red') ?? 'german', resources } } }, data);
  const store = createStore(state, data, { rngFrom: s => createRng({ state: s }), freeze: true });

  const canvas = doc.getElementById('map'), ctx = canvas.getContext('2d');
  let view, camera;
  const redraw = () => {
    const cam = controller.ui().camera;
    if (cam !== camera) {   // a new camera (turn / zoom): a new projection and canvas size
      camera = cam; view = createView(22 * cam.zoom, { yaw: cam.yaw });
      Object.assign(canvas, (({ w, h }) => ({ width: w, height: h }))(view.fit(state.map.cols, state.map.rows)));
    }
    view.draw(ctx, store.getState(), controller.ui(), data);
    const box = doc.getElementById('actions');
    box.replaceChildren(...controller.actions().map(a => Object.assign(doc.createElement('button'), {
      textContent: a.label, disabled: !!a.disabled, onclick: () => controller.onIntent({ type: 'tapButton', id: a.id }) })));
    doc.getElementById('debug').textContent = debugText(store.getState(), controller.ui(), data);
  };
  const controller = createController({ store, data, onUiChange: redraw });
  store.subscribe(redraw);
  attach(canvas, (x, y) => view.toHex(x, y), controller.onIntent);
  for (const b of doc.querySelectorAll('[data-button]')) b.addEventListener('click', () => controller.onIntent({ type: 'tapButton', id: b.dataset.button }));
  controller.onIntent({ type: 'tapButton', id: 'end' });   // StartMatch
  redraw();
  return { store, controller, data };
}
