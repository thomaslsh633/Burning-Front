import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createController } from '../../src/presentation/controller/index.js';
import { debugText, createView } from '../../src/presentation/greybox/index.js';
import { createStore } from '../../src/logic/store/index.js';
import { createRng } from '../../src/services/rng/index.js';
import { testMatch } from '../helpers/match.js';

const H = (c, r) => ({ c, r });
const setup = () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(2, 5) }, { team: 'red', sbps: 'grenadier_ger', pos: H(5, 5), facing: 3 }]);
  const store = createStore(state, data, { rngFrom: s => createRng({ state: s }) });
  return { store, data, ctl: createController({ store, data }) };
};

test('two-tap move: select, preview, confirm; a tap elsewhere cancels', () => {
  const { store, ctl } = setup();
  ctl.onIntent({ type: 'tapHex', ...H(2, 5) });
  assert.equal(ctl.ui().selected, 'u1');
  ctl.onIntent({ type: 'tapHex', ...H(3, 5) });
  assert.deepEqual(ctl.ui().preview.cmd, { type: 'Move', side: 'blue', unit: 'u1', to: H(3, 5) });
  ctl.onIntent({ type: 'tapHex', ...H(2, 6) });
  assert.deepEqual(ctl.ui().preview.cmd.to, H(2, 6), 'another hex: a new preview, nothing moved');
  ctl.onIntent({ type: 'tapHex', ...H(2, 6) });
  assert.deepEqual(store.getState().units.u1.pos, H(2, 6));
  assert.equal(ctl.ui().preview, null);
});

test('two-tap attack with the preview numbers; refusals become a message; end turn', () => {
  const { store, data, ctl } = setup();
  ctl.onIntent({ type: 'tapHex', ...H(2, 5) });
  ctl.onIntent({ type: 'tapHex', ...H(5, 5) });
  assert.ok(ctl.ui().preview.attack.weapons.length > 0);
  assert.match(debugText(store.getState(), ctl.ui(), data), /preview → u2: expected kills/);
  ctl.onIntent({ type: 'tapHex', ...H(5, 5) });
  assert.equal(store.getState().units.u1.budget.fired, true);
  ctl.onIntent({ type: 'tapButton', id: 'hold' });
  assert.match(ctl.ui().message, /^Hold: /);
  ctl.onIntent({ type: 'tapButton', id: 'end' });
  assert.equal(store.getState().match.side, 'red');
  assert.equal(ctl.ui().selected, null);
});

test('view: hex centres and the tap mapping agree', () => {
  const v = createView(20);
  v.fit(10, 8);
  for (const h of [H(0, 0), H(3, 4), H(9, 7)]) { const p = v.centre(h); assert.deepEqual(v.toHex(p.x, p.y), h); }
  assert.equal(v.toHex(-50, -50), null);
});

test('camera: the angle stays fixed; yaw turns in 60° steps, zoom within 0.5–3', () => {
  const { ctl } = setup();
  assert.deepEqual(ctl.ui().camera, { yaw: 45, zoom: 1 });
  ctl.onIntent({ type: 'tapButton', id: 'rotateRight' });
  ctl.onIntent({ type: 'tapButton', id: 'rotateRight' });
  assert.equal(ctl.ui().camera.yaw, 165);
  for (let i = 0; i < 6; i++) ctl.onIntent({ type: 'tapButton', id: 'rotateLeft' });
  assert.equal(ctl.ui().camera.yaw, 165, 'a full turn comes back');
  ctl.onIntent({ type: 'zoom', factor: 10 });
  assert.equal(ctl.ui().camera.zoom, 3);
  ctl.onIntent({ type: 'tapButton', id: 'zoomOut' });
  assert.equal(ctl.ui().camera.zoom, 2.4);
});

test('view: taps map back to hexes at any yaw and zoom', () => {
  for (const [yaw, size] of [[45, 22], [165, 30], [285, 12]]) {
    const v = createView(size, { yaw });
    v.fit(12, 9);
    for (const h of [H(0, 0), H(5, 4), H(11, 8)]) { const p = v.centre(h); assert.deepEqual(v.toHex(p.x, p.y), h, `yaw ${yaw}`); }
  }
});

test('production: tap an own tier building, pick a unit, tap a free hex beside it', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'hmg_30cal_us', pos: H(6, 6) }], { production: [{ id: 'b1', type: 't1', team: 'blue', hexes: ['2,2'] }] });
  const store = createStore(state, data, { rngFrom: s => createRng({ state: s }) }), ctl = createController({ store, data });
  ctl.onIntent({ type: 'tapHex', ...H(2, 2) });
  assert.equal(ctl.ui().building, 'b1');
  assert.ok(ctl.actions().some(a => a.id === 'produce:riflemen_us'));
  ctl.onIntent({ type: 'tapButton', id: 'produce:riflemen_us' });
  ctl.onIntent({ type: 'tapHex', ...H(3, 2) });
  const made = Object.values(store.getState().units).find(u => u.sbps === 'riflemen_us');
  assert.deepEqual(made?.pos, H(3, 2));
  assert.equal(ctl.ui().placing, null);
});

test('conversions: listed for the selected unit; a doctrine one is shown locked', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'hmg_30cal_us', pos: H(6, 6) }]);
  const store = createStore(state, data, { rngFrom: s => createRng({ state: s }) }), ctl = createController({ store, data });
  ctl.onIntent({ type: 'tapHex', ...H(6, 6) });
  assert.deepEqual(ctl.actions().map(a => [a.id, a.disabled]), [['convert:hmg_50cal_us', true]]);
  assert.match(ctl.actions()[0].label, /needs_doctrine/);
});

test('upgrades: listed for the selected unit, locked without the unlock', () => {
  const { state, data } = testMatch([{ team: 'blue', sbps: 'riflemen_us', pos: H(6, 6) }]);
  const store = createStore(state, data, { rngFrom: s => createRng({ state: s }) }), ctl = createController({ store, data });
  ctl.onIntent({ type: 'tapHex', ...H(6, 6) });
  const bar = ctl.actions().find(a => a.id === 'upgrade:bar_rifleman_squad_us');
  assert.equal(bar.disabled, true);
  assert.match(bar.label, /needs_unlock/);
});
