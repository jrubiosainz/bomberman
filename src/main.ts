import type { GameState, GameMode, LevelConfig, InputAction } from './types';
import { createInitialState, update } from './game';
import { Renderer } from './renderer';
import { ParticleSystem } from './particles';
import { MenuSystem } from './menu';
import { InputHandler } from './input';
import { AudioSystem } from './audio';
import { LLMPlayer } from './llm-player';
import { LEVEL_CONFIGS, FIXED_TIMESTEP, INITIAL_LIVES } from './constants';
import { GameStatus } from './types';

const canvas = document.getElementById('game') as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas element #game not found');

const renderer = new Renderer(canvas);
const particles = new ParticleSystem();
const audio = new AudioSystem();
const input = new InputHandler();
const menu = new MenuSystem();

let mode: GameMode = 'main_menu' as GameMode;
let gameState: GameState | null = null;
let llmPlayer: LLMPlayer | null = null;
let levelTransitionTimer = 0;
let levelTransitionDuration = 2;
let currentLives = INITIAL_LIVES;
let currentScore = 0;
let currentLevelIndex = 0;
let audioInitialized = false;

function resizeCanvas(config?: LevelConfig): void {
  if (config) {
    canvas.width = config.gridWidth * config.tileSize;
    canvas.height = config.gridHeight * config.tileSize;
  } else {
    canvas.width = 900;
    canvas.height = 600;
  }
}

function startLevel(levelIndex: number): void {
  const config = LEVEL_CONFIGS[levelIndex];
  resizeCanvas(config);
  gameState = createInitialState(config, currentLives, currentScore);
  particles.clear();
}

resizeCanvas();


let lastTime = 0;
let accumulator = 0;

function gameLoop(timestamp: number): void {
  const frameTime = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;
  const dt = frameTime;
  accumulator += frameTime;

  switch (mode) {
    case 'main_menu':
    case 'level_select':
    case 'llm_setup':
      handleMenuMode(dt, timestamp);
      break;
    case 'playing':
      handlePlayingMode(dt);
      break;
    case 'llm_playing':
      handleLLMPlayingMode(dt);
      break;
    case 'level_transition':
      handleLevelTransition(dt);
      break;
    case 'game_over':
    case 'victory':
      handleGameEnd(dt);
      break;
  }

  requestAnimationFrame(gameLoop);
}

function handleMenuMode(_dt: number, timestamp: number): void {
  resizeCanvas();
  menu.render(renderer['ctx'], canvas.width, canvas.height, timestamp / 1000);
  
  window.onkeydown = (e) => {
    if (!audioInitialized && menu.isSoundEnabled) {
      audio.init();
      audioInitialized = true;
    }

    if (e.key === 'ArrowUp') menu.handleInput('up' as InputAction);
    else if (e.key === 'ArrowDown') menu.handleInput('down' as InputAction);
    else if (e.key === 'ArrowLeft') menu.handleInput('left' as InputAction);
    else if (e.key === 'ArrowRight') menu.handleInput('right' as InputAction);
    else if (e.key === 'Enter') menu.handleInput('enter');
    else if (e.key === 'Escape') menu.handleInput('escape');
    else if (e.key === 'Backspace') menu.handleInput('backspace');
    else if (e.key.length === 1) menu.handleInput(e.key);
    
    const newMode = menu.currentMode;
    if (newMode !== mode) {
      mode = newMode;
      if (mode === 'playing') {
        currentLevelIndex = menu.selectedLevelConfig.level - 1;
        currentLives = INITIAL_LIVES;
        currentScore = 0;
        startLevel(currentLevelIndex);
      } else if (mode === 'llm_playing') {
        const llmConfig = menu.llmConfig;
        if (llmConfig) {
          llmPlayer = new LLMPlayer(llmConfig);
          currentLevelIndex = menu.selectedLevelConfig.level - 1;
          currentLives = INITIAL_LIVES;
          currentScore = 0;
          startLevel(currentLevelIndex);
        }
      }
    }
  };
}

function handlePlayingMode(dt: number): void {
  if (!gameState) return;
  
  while (accumulator >= FIXED_TIMESTEP) {
    const actions = input.getActions();
    gameState = update(gameState, actions, FIXED_TIMESTEP);
    accumulator -= FIXED_TIMESTEP;
  }

  particles.processEvents(gameState.particleEvents);
  particles.update(dt);
  audio.processSoundEvents(gameState.soundEvents);
  
  renderer.render(gameState, undefined, dt);
  particles.render(renderer['ctx']);

  if (gameState.status === GameStatus.Won) {
    currentScore = gameState.score;
    if (currentLevelIndex < LEVEL_CONFIGS.length - 1) {
      currentLevelIndex++;
      mode = 'level_transition' as GameMode;
      levelTransitionTimer = 0;
    } else {
      mode = 'victory' as GameMode;
      particles.spawnConfetti(canvas.width, canvas.height);
    }
  } else if (gameState.status === GameStatus.Lost) {
    currentLives--;
    if (currentLives > 0) {
      startLevel(currentLevelIndex);
    } else {
      mode = 'game_over' as GameMode;
    }
  }

  window.onkeydown = (e) => {
    if (e.key === 'r' || e.key === 'R') {
      startLevel(currentLevelIndex);
    } else if (e.key === 'Escape') {
      mode = 'main_menu' as GameMode;
      llmPlayer = null;
    }
  };
}

async function handleLLMPlayingMode(dt: number): Promise<void> {
  if (!gameState || !llmPlayer) return;
  
  while (accumulator >= FIXED_TIMESTEP) {
    const actions = await llmPlayer.tick(gameState, FIXED_TIMESTEP);
    gameState = update(gameState, actions, FIXED_TIMESTEP);
    accumulator -= FIXED_TIMESTEP;
  }

  particles.processEvents(gameState.particleEvents);
  particles.update(dt);
  audio.processSoundEvents(gameState.soundEvents);
  
  const llmConfig = menu.llmConfig;
  const llmInfo = {
    thinking: llmPlayer.thinking,
    reasoning: llmPlayer.reasoning,
    model: llmConfig?.modelDisplayName || 'AI',
    reflecting: llmPlayer.reflecting,
    reflectionMessage: llmPlayer.reflectionMessage,
    lessonCount: llmPlayer.lessonCount,
    customAgentEnabled: llmPlayer.customAgentEnabled,
  };
  renderer.render(gameState, llmInfo, dt);
  particles.render(renderer['ctx']);

  if (gameState.status === GameStatus.Won) {
    currentScore = gameState.score;
    if (currentLevelIndex < LEVEL_CONFIGS.length - 1) {
      currentLevelIndex++;
      mode = 'level_transition' as GameMode;
      levelTransitionTimer = 0;
    } else {
      mode = 'victory' as GameMode;
      particles.spawnConfetti(canvas.width, canvas.height);
    }
  } else if (gameState.status === GameStatus.Lost) {
    currentLives--;

    // Determine cause of death and trigger reflection for custom agent
    if (llmPlayer && llmPlayer.customAgentEnabled) {
      const cause = determineCauseOfDeath(gameState);
      llmPlayer.onDeath(gameState, cause);
    }

    if (currentLives > 0) {
      startLevel(currentLevelIndex);
    } else {
      mode = 'game_over' as GameMode;
    }
  }

  window.onkeydown = (e) => {
    if (e.key === 'Escape') {
      mode = 'main_menu' as GameMode;
      llmPlayer = null;
    }
  };
}

/** Heuristic: if an explosion overlaps the player position, it was an explosion death; otherwise enemy collision. */
function determineCauseOfDeath(state: GameState): string {
  const { player, explosions } = state;
  const hitByExplosion = explosions.some(
    (e) => e.position.row === player.gridPos.row && e.position.col === player.gridPos.col,
  );
  return hitByExplosion ? 'explosion' : 'enemy_collision';
}

function handleLevelTransition(dt: number): void {
  levelTransitionTimer += dt;
  
  const config = LEVEL_CONFIGS[currentLevelIndex];
  resizeCanvas(config);
  
  const ctx = renderer['ctx'];
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 64px Arial';
  ctx.fillText(`LEVEL ${config.level}`, canvas.width / 2, canvas.height / 2 - 50);
  ctx.font = 'bold 32px Arial';
  ctx.fillText(config.name, canvas.width / 2, canvas.height / 2 + 20);
  ctx.font = '20px Arial';
  ctx.fillStyle = '#aaa';
  ctx.fillText(config.description, canvas.width / 2, canvas.height / 2 + 60);

  if (levelTransitionTimer >= levelTransitionDuration) {
    startLevel(currentLevelIndex);
    mode = llmPlayer ? ('llm_playing' as GameMode) : ('playing' as GameMode);
  }

  window.onkeydown = (e) => {
    if (e.key !== 'Escape') {
      startLevel(currentLevelIndex);
      mode = llmPlayer ? ('llm_playing' as GameMode) : ('playing' as GameMode);
    }
  };
}

function handleGameEnd(dt: number): void {
  if (gameState) {
    particles.update(dt);
    renderer.render(gameState, undefined, dt);
    particles.render(renderer['ctx']);
  }

  window.onkeydown = (e) => {
    if (e.key === 'Enter') {
      mode = 'main_menu' as GameMode;
      llmPlayer = null;
      particles.clear();
    }
  };
}

// Kick off
requestAnimationFrame((timestamp) => {
  lastTime = timestamp;
  requestAnimationFrame(gameLoop);
});
