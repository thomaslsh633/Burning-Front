# src/app/

**Composition root (outside the layers)** — Composition root: boots the game and wires the layers together. No rules, no drawing.

## Owns
- boot order
- creating services, store, controller, renderer, animator, audio, ui
- wiring: input → controller → store; store events → animation, audio, ui, log, autosave
- screen flow: lobby → setup → play → AAR
- frame loop

Done: `greybox.js` `bootGreybox(document)` — the greybox (dev plan G-2): fetch data, start a 1v1, wire input → controller →
store → view. URL options `?map=&blue=&red=&mode=&seed=`.

## Public API (planned, exported from `index.js`)
- `boot(window)`

## May import
- anything

## Must not
- contain logic that belongs to a system (if wiring needs an if, the rule belongs somewhere else)
