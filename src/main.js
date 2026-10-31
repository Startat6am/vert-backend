import './style.css';
import { AnimationManager } from './core/AnimationManager.js';
import { Player } from './core/Player.js';
import { ViewerUI } from './ui/ViewerUI.js';

const viewer = document.querySelector('#viewer');
const animationSurface = document.querySelector('#animation-surface');
const manager = new AnimationManager(animationSurface, (state) => ui.setAnimation(state));
const player = new Player(manager, (time, duration, playing) => ui.renderTime(time, duration, playing));
const ui = new ViewerUI({ root: viewer, manager, player });

animationSurface.addEventListener('click', (event) => {
  if (!event.target.closest('button, input')) player.toggle();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) player.pause();
});

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !event.target.closest('button, input, textarea')) {
    event.preventDefault();
    player.toggle();
  }
});

async function start() {
  if (!manager.catalog.length) {
    viewer.querySelector('[data-title]').textContent = 'Анимации не найдены';
    viewer.querySelector('[data-empty]').hidden = false;
    return;
  }
  await manager.open(0);
  player.play();
}

window.addEventListener('beforeunload', () => {
  player.destroy();
  ui.destroy();
  manager.destroy();
});

start();
