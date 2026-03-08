// ── Grid & Pixel Coordinates ──────────────────────────────────

export interface GridPosition {
  row: number;
  col: number;
}

export interface PixelPosition {
  x: number;
  y: number;
}

// ── Tile Types ────────────────────────────────────────────────

export enum TileType {
  Empty = 0,
  Wall = 1,
  DestructibleWall = 2,
}

// ── Entity Types ──────────────────────────────────────────────

export enum EntityType {
  Player = 'player',
  Bomb = 'bomb',
  Explosion = 'explosion',
  Powerup = 'powerup',
  Enemy = 'enemy',
}

// ── Powerups ──────────────────────────────────────────────────

export enum PowerupType {
  ExtraBomb = 'extra_bomb',
  BiggerRange = 'bigger_range',
  Speed = 'speed',
}

// ── Input ─────────────────────────────────────────────────────

export enum InputAction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
  PlaceBomb = 'place_bomb',
  Wait = 'wait',
}

// ── Game Status ───────────────────────────────────────────────

export enum GameStatus {
  Running = 'running',
  Won = 'won',
  Lost = 'lost',
  Paused = 'paused',
}

// ── Entity State ──────────────────────────────────────────────

export interface PlayerState {
  position: PixelPosition;
  gridPos: GridPosition;
  alive: boolean;
  bombCount: number;
  maxBombs: number;
  bombRange: number;
  speed: number;
  /** Grid position of a bomb the player is currently overlapping (pass-through until they leave) */
  passThroughBomb: GridPosition | null;
  /** Movement direction for animation */
  direction: { dx: number; dy: number };
}

export interface BombState {
  position: GridPosition;
  timer: number;
  range: number;
  owner: number;
}

export interface ExplosionState {
  position: GridPosition;
  timer: number;
}

export interface PowerupState {
  position: GridPosition;
  type: PowerupType;
}

export interface EnemyState {
  id: number;
  position: PixelPosition;
  gridPos: GridPosition;
  alive: boolean;
  speed: number;
  direction: { dr: number; dc: number };
}

// ── Game State ────────────────────────────────────────────────

export interface GameState {
  grid: TileType[][];
  player: PlayerState;
  bombs: BombState[];
  explosions: ExplosionState[];
  powerups: PowerupState[];
  enemies: EnemyState[];
  status: GameStatus;
  timer: number;
  level: number;
  lives: number;
  score: number;
  soundEvents: SoundEvent[];
  particleEvents: ParticleEvent[];
  levelConfig: LevelConfig;
}

// ── Config ────────────────────────────────────────────────────

export interface GameConfig {
  gridWidth: number;
  gridHeight: number;
  tileSize: number;
  bombTimer: number;
  explosionDuration: number;
  playerSpeed: number;
  tickRate: number;
}

// ── Game Modes ────────────────────────────────────────────────

export enum GameMode {
  MainMenu = 'main_menu',
  LevelSelect = 'level_select',
  LLMSetup = 'llm_setup',
  Playing = 'playing',
  LLMPlaying = 'llm_playing',
  LevelTransition = 'level_transition',
  GameOver = 'game_over',
  Victory = 'victory',
}

// ── Level Configuration ───────────────────────────────────────

export enum LevelTheme {
  Garden = 'garden',
  Dungeon = 'dungeon',
  Lava = 'lava',
  Ice = 'ice',
  Dark = 'dark',
}

export interface LevelConfig {
  level: number;
  name: string;
  description: string;
  gridWidth: number;
  gridHeight: number;
  tileSize: number;
  enemyCount: number;
  enemySpeed: number;
  enemySmartness: number;
  destructibleWallDensity: number;
  powerupDropRate: number;
  playerSpeed: number;
  bombTimer: number;
  theme: LevelTheme;
}

// ── LLM Integration ───────────────────────────────────────────

export interface LLMConfig {
  model: string;
  modelDisplayName: string;
  apiKey: string;
  endpoint: string;
}

export interface LLMAction {
  action: InputAction | null;
  reasoning: string;
}

// ── Sound Events ──────────────────────────────────────────────

export enum SoundEvent {
  BombPlace = 'bomb_place',
  BombExplode = 'bomb_explode',
  PowerupPickup = 'powerup_pickup',
  EnemyDeath = 'enemy_death',
  PlayerDeath = 'player_death',
  LevelComplete = 'level_complete',
  MenuSelect = 'menu_select',
  MenuMove = 'menu_move',
  GameOver = 'game_over',
  Victory = 'victory',
  WallBreak = 'wall_break',
}

// ── Particle Events ───────────────────────────────────────────

export enum ParticleEventType {
  Explosion = 'explosion',
  WallBreak = 'wall_break',
  PowerupPickup = 'powerup_pickup',
  EnemyDeath = 'enemy_death',
  PlayerDeath = 'player_death',
  BombSpark = 'bomb_spark',
  LevelComplete = 'level_complete',
}

export interface ParticleEvent {
  type: ParticleEventType;
  x: number;
  y: number;
  data?: Record<string, unknown>;
}
