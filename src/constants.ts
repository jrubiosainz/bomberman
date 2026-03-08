import type { GameConfig, LevelConfig, LevelTheme } from './types';

// ── Base Constants ────────────────────────────────────────────

export const DEFAULT_BOMB_RANGE = 1;
export const DEFAULT_MAX_BOMBS = 1;
export const EXPLOSION_DURATION = 0.5;
export const TICK_RATE = 60;
export const FIXED_TIMESTEP = 1 / TICK_RATE;

// ── Score System ──────────────────────────────────────────────

export const INITIAL_LIVES = 3;
export const SCORE_ENEMY_KILL = 100;
export const SCORE_WALL_BREAK = 10;
export const SCORE_POWERUP = 50;
export const SCORE_LEVEL_CLEAR = 500;

// ── Level Configurations ──────────────────────────────────────

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 1,
    name: 'Garden Maze',
    description: 'A peaceful garden with simple enemies',
    gridWidth: 13,
    gridHeight: 11,
    tileSize: Math.floor(Math.min(900 / 13, 60)),
    enemyCount: 3,
    enemySpeed: 80,
    enemySmartness: 0.1,
    destructibleWallDensity: 0.35,
    powerupDropRate: 0.3,
    playerSpeed: 150,
    bombTimer: 3.0,
    theme: 'garden' as LevelTheme,
  },
  {
    level: 2,
    name: 'Dark Dungeon',
    description: 'Stone corridors with smarter foes',
    gridWidth: 15,
    gridHeight: 13,
    tileSize: Math.floor(Math.min(900 / 15, 60)),
    enemyCount: 5,
    enemySpeed: 95,
    enemySmartness: 0.25,
    destructibleWallDensity: 0.40,
    powerupDropRate: 0.3,
    playerSpeed: 150,
    bombTimer: 2.8,
    theme: 'dungeon' as LevelTheme,
  },
  {
    level: 3,
    name: 'Lava Cavern',
    description: 'Heat rises as danger increases',
    gridWidth: 17,
    gridHeight: 13,
    tileSize: Math.floor(Math.min(900 / 17, 60)),
    enemyCount: 7,
    enemySpeed: 110,
    enemySmartness: 0.4,
    destructibleWallDensity: 0.45,
    powerupDropRate: 0.3,
    playerSpeed: 150,
    bombTimer: 2.6,
    theme: 'lava' as LevelTheme,
  },
  {
    level: 4,
    name: 'Ice Palace',
    description: 'Frozen halls with cunning enemies',
    gridWidth: 19,
    gridHeight: 15,
    tileSize: Math.floor(Math.min(900 / 19, 60)),
    enemyCount: 10,
    enemySpeed: 125,
    enemySmartness: 0.6,
    destructibleWallDensity: 0.50,
    powerupDropRate: 0.3,
    playerSpeed: 150,
    bombTimer: 2.4,
    theme: 'ice' as LevelTheme,
  },
  {
    level: 5,
    name: 'Dark Realm',
    description: 'The final challenge awaits',
    gridWidth: 21,
    gridHeight: 15,
    tileSize: Math.floor(Math.min(900 / 21, 60)),
    enemyCount: 13,
    enemySpeed: 145,
    enemySmartness: 0.8,
    destructibleWallDensity: 0.55,
    powerupDropRate: 0.3,
    playerSpeed: 150,
    bombTimer: 2.2,
    theme: 'dark' as LevelTheme,
  },
];

// ── LLM Models ────────────────────────────────────────────────

export const LLM_MODELS = [
  // OpenAI — best for Bomberman (fast + smart)
  { id: 'gpt-4.1', name: 'GPT-4.1 (Recommended)', provider: 'OpenAI' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano (Fastest)', provider: 'OpenAI' },
  // Meta Llama
  { id: 'Meta-Llama-3.1-405B-Instruct', name: 'Llama 3.1 405B', provider: 'Meta' },
  { id: 'Meta-Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B (Fast)', provider: 'Meta' },
  // DeepSeek
  { id: 'DeepSeek-R1', name: 'DeepSeek R1', provider: 'DeepSeek' },
  // Cohere
  { id: 'Cohere-command-r-plus-08-2024', name: 'Command R+', provider: 'Cohere' },
  // Mistral
  { id: 'Ministral-3B', name: 'Ministral 3B (Tiny)', provider: 'Mistral' },
];

export const LLM_API_ENDPOINT = '/api/chat/completions';
export const LLM_TICK_INTERVAL = 1.5; // Base interval — backoff will increase on errors

// ── Legacy Config (for backward compatibility) ────────────────

export const GRID_WIDTH = LEVEL_CONFIGS[0].gridWidth;
export const GRID_HEIGHT = LEVEL_CONFIGS[0].gridHeight;
export const TILE_SIZE = LEVEL_CONFIGS[0].tileSize;
export const CANVAS_WIDTH = GRID_WIDTH * TILE_SIZE;
export const CANVAS_HEIGHT = GRID_HEIGHT * TILE_SIZE;
export const BOMB_TIMER = LEVEL_CONFIGS[0].bombTimer;
export const PLAYER_SPEED = LEVEL_CONFIGS[0].playerSpeed;
export const ENEMY_SPEED = LEVEL_CONFIGS[0].enemySpeed;
export const ENEMY_COUNT = LEVEL_CONFIGS[0].enemyCount;
export const POWERUP_DROP_RATE = LEVEL_CONFIGS[0].powerupDropRate;

export const CONFIG: GameConfig = {
  gridWidth: GRID_WIDTH,
  gridHeight: GRID_HEIGHT,
  tileSize: TILE_SIZE,
  bombTimer: BOMB_TIMER,
  explosionDuration: EXPLOSION_DURATION,
  playerSpeed: PLAYER_SPEED,
  tickRate: TICK_RATE,
};
