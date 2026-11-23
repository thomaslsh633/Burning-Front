// App machine: the drawn game-level states, reachability, refused combinations, listeners.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { App, AppEvent, AppMachine } from '../../src/app/app-state.js';
import { createApp } from '../../src/app/app.js';
import { eventsFrom, step, InvalidTransition } from '../../src/core/fsm.js';

test('app starts in Boot and boot leads to Lobby', () => {
  const app = createApp();
  assert.equal(app.state, App.Boot);
  app.send(AppEvent.loaded);
  assert.equal(app.state, App.Lobby);
});

test('a full match walks the drawn state machine', () => {
  const app = createApp();
  const path = [
    [AppEvent.loaded, App.Lobby], [AppEvent.newMatch, App.Setup], [AppEvent.deploy, App.Loading],
    [AppEvent.ready, App.Playing], [AppEvent.turnEnded, App.TurnCurtain], [AppEvent.curtainTapped, App.Playing],
    [AppEvent.menu, App.Paused], [AppEvent.resume, App.Playing], [AppEvent.victory, App.GameOver],
    [AppEvent.showResult, App.Result], [AppEvent.returnToLobby, App.Lobby],
  ];
  for (const [ev, to] of path) assert.equal(app.send(ev), to);
});

test('every state is reachable from Boot and none is a dead end', () => {
  const seen = new Set([AppMachine.initial]);
  const queue = [AppMachine.initial];
  while (queue.length) {
    const s = queue.shift();
    const events = eventsFrom(AppMachine, s);
    assert.ok(events.length > 0, `${s} has no way out`);
    for (const ev of events) {
      const next = step(AppMachine, s, ev);
      if (!seen.has(next)) { seen.add(next); queue.push(next); }
    }
  }
  assert.deepEqual([...seen].sort(), Object.values(App).sort());
});

test('conflicting states cannot happen: victory is refused while paused or loading', () => {
  assert.throws(() => step(AppMachine, App.Paused, AppEvent.victory), InvalidTransition);
  assert.throws(() => step(AppMachine, App.Loading, AppEvent.menu), InvalidTransition);
  assert.throws(() => step(AppMachine, App.Boot, AppEvent.newMatch), InvalidTransition);
});

test('listeners hear each change; a refused event changes nothing', () => {
  const app = createApp();
  const heard = [];
  const off = app.subscribe((s, prev, ev) => heard.push([prev, ev, s]));
  app.send(AppEvent.loaded);
  assert.throws(() => app.send(AppEvent.victory), InvalidTransition);
  assert.equal(app.state, App.Lobby);
  off();
  app.send(AppEvent.newMatch);
  assert.deepEqual(heard, [[App.Boot, AppEvent.loaded, App.Lobby]]);
  assert.deepEqual(app.allowedEvents(), [AppEvent.deploy, AppEvent.back]);
});
