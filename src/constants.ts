import type { GameConfig } from './types';

export const GRID_WIDTH = 13;
export const GRID_HEIGHT = 11;
export const TILE_SIZE = 60;

export const CANVAS_WIDTH = GRID_WIDTH * TILE_SIZE;   // 780
export const CANVAS_HEIGHT = GRID_HEIGHT * TILE_SIZE;  // 660

export const BOMB_TIMER = 3.0;           // seconds until detonation
export const EXPLOSION_DURATION = 0.5;   // seconds explosion stays visible
export const PLAYER_SPEED = 150;         // pixels per second
export const DEFAULT_BOMB_RANGE = 1;     // tiles in each direction
export const DEFAULT_MAX_BOMBS = 1;

export const ENEMY_SPEED = 80;           // pixels per second
export const ENEMY_COUNT = 4;            // enemies per level
export const POWERUP_DROP_RATE = 0.3;    // chance of powerup drop from destructible wall

export const TICK_RATE = 60;             // target fps
export const FIXED_TIMESTEP = 1 / TICK_RATE;

export const CONFIG: GameConfig = {
  gridWidth: GRID_WIDTH,
  gridHeight: GRID_HEIGHT,
  tileSize: TILE_SIZE,
  bombTimer: BOMB_TIMER,
  explosionDuration: EXPLOSION_DURATION,
  playerSpeed: PLAYER_SPEED,
  tickRate: TICK_RATE,
};
