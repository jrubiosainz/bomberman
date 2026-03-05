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
