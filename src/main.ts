import { createInitialState, update } from './game';
import { Renderer } from './renderer';
import { InputHandler } from './input';
import { createLevel1 } from './levels';
import { FIXED_TIMESTEP } from './constants';
import { GameStatus } from './types';

// ── Bootstrap ─────────────────────────────────────────────────

const canvas = document.getElementById('game') as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas element #game not found');

const renderer = new Renderer(canvas);
const input = new InputHandler();

const levelData = createLevel1();
let state = createInitialState(levelData.grid, levelData.enemySpawns);

// Restart on R key
window.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    if (state.status !== GameStatus.Running) {
      const newLevel = createLevel1();
      state = createInitialState(newLevel.grid, newLevel.enemySpawns);
    }
  }
});

// ── Game Loop (fixed timestep with accumulator) ───────────────

let lastTime = 0;
let accumulator = 0;

function gameLoop(timestamp: number): void {
  const frameTime = Math.min((timestamp - lastTime) / 1000, 0.1); // cap to avoid spiral
  lastTime = timestamp;
  accumulator += frameTime;

  while (accumulator >= FIXED_TIMESTEP) {
    const actions = input.getActions();
    state = update(state, actions, FIXED_TIMESTEP);
    accumulator -= FIXED_TIMESTEP;
  }

  renderer.render(state);
  requestAnimationFrame(gameLoop);
}

// Kick off
requestAnimationFrame((timestamp) => {
  lastTime = timestamp;
  requestAnimationFrame(gameLoop);
});
