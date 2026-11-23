// Entry point: wires services, app, input and view together. The only file allowed to import every layer.
import { createApp } from './app/app.js';
import { boot } from './app/boot.js';
import { t } from './services/i18n.js';
import { createRenderer } from './view/render/renderer.js';
import { createScreens } from './view/ui/screens/index.js';

const VERSION = '%%VERSION%%';

const app = createApp();
const renderer = createRenderer(document.getElementById('board'));
const screens = createScreens(document.getElementById('screens'), {
  t,
  version: VERSION,
  onEvent: (event) => app.send(event),
});

const present = () => {
  screens.show(app.state, app.allowedEvents());
  renderer.draw();
};

app.subscribe(present);
window.addEventListener('resize', () => { renderer.resize(); renderer.draw(); });
present();
boot(app);
