import { describe, it, expect } from 'vitest';
import { createInitialState, update } from '../game';
import {
  type GameState,
  type BombState,
  type ExplosionState,
  type PowerupState,
  TileType,
  InputAction,
  GameStatus,
  PowerupType,
} from '../types';
import {
  BOMB_TIMER,
  EXPLOSION_DURATION,
  DEFAULT_BOMB_RANGE,
  DEFAULT_MAX_BOMBS,
  PLAYER_SPEED,
  TILE_SIZE,
} from '../constants';

// ── Test Helpers ──────────────────────────────────────────────

/**
 * Create a minimal test state with sensible defaults.
 * Override any properties as needed for specific tests.
 */
function makeState(overrides?: Partial<GameState>): GameState {
  const defaultGrid = makeGrid();
  return {
    grid: defaultGrid,
    player: {
      position: { x: TILE_SIZE * 1.5, y: TILE_SIZE * 1.5 }, // Center of (1,1)
      gridPos: { row: 1, col: 1 },
      alive: true,
      bombCount: 0,
      maxBombs: DEFAULT_MAX_BOMBS,
      bombRange: DEFAULT_BOMB_RANGE,
      speed: PLAYER_SPEED,
      passThroughBomb: null,
    },
    bombs: [],
    explosions: [],
    powerups: [],
    enemies: [], // Added for McManus's enemy system
    status: GameStatus.Running,
    timer: 0,
    ...overrides,
  };
}

/**
 * Create a basic 5x5 test grid with walls around border.
 * Customize with specific tiles as needed.
 */
function makeGrid(customTiles?: [number, number, TileType][]): TileType[][] {
  const grid: TileType[][] = [];
  for (let row = 0; row < 5; row++) {
    grid[row] = [];
    for (let col = 0; col < 5; col++) {
      // Outer walls
      if (row === 0 || row === 4 || col === 0 || col === 4) {
        grid[row][col] = TileType.Wall;
      } else {
        grid[row][col] = TileType.Empty;
      }
    }
  }
  
  // Apply custom tiles
  if (customTiles) {
    for (const [row, col, type] of customTiles) {
      grid[row][col] = type;
    }
  }
  
  return grid;
}

/**
 * Create a larger test grid (7x7) to allow more movement for tests.
 */
function makeLargeGrid(): TileType[][] {
  const grid: TileType[][] = [];
  for (let row = 0; row < 7; row++) {
    grid[row] = [];
    for (let col = 0; col < 7; col++) {
      // Outer walls
      if (row === 0 || row === 6 || col === 0 || col === 6) {
        grid[row][col] = TileType.Wall;
      } else {
        grid[row][col] = TileType.Empty;
      }
    }
  }
  return grid;
}

// ── State Creation Tests ──────────────────────────────────────

describe('State Creation', () => {
  it('createInitialState returns valid state with player at spawn', () => {
    const level = makeGrid();
    const state = createInitialState(level, []); // No enemies for this test
    
    expect(state.player.gridPos).toEqual({ row: 1, col: 1 });
    expect(state.player.alive).toBe(true);
    expect(state.status).toBe(GameStatus.Running);
  });

  it('player starts with correct defaults', () => {
    const level = makeGrid();
    const state = createInitialState(level, []);
    
    expect(state.player.maxBombs).toBe(DEFAULT_MAX_BOMBS);
    expect(state.player.bombRange).toBe(DEFAULT_BOMB_RANGE);
    expect(state.player.bombCount).toBe(0);
    expect(state.player.speed).toBe(PLAYER_SPEED);
  });

  it('grid matches input level', () => {
    const level = makeGrid([[2, 2, TileType.DestructibleWall]]);
    const state = createInitialState(level, []);
    
    expect(state.grid[2][2]).toBe(TileType.DestructibleWall);
    expect(state.grid.length).toBe(level.length);
  });
});

// ── Player Movement Tests ─────────────────────────────────────

describe('Player Movement', () => {
  it('player moves up', () => {
    const grid = makeLargeGrid();
    const state = makeState({
      grid,
      player: {
        position: { x: TILE_SIZE * 3, y: TILE_SIZE * 3 }, // Center of grid
        gridPos: { row: 3, col: 3 },
        alive: true,
        bombCount: 0,
        maxBombs: DEFAULT_MAX_BOMBS,
        bombRange: DEFAULT_BOMB_RANGE,
        speed: PLAYER_SPEED,
        passThroughBomb: null,
      },
    });
    const initialY = state.player.position.y;
    
    const updated = update(state, [InputAction.Up], 0.1);
    
    expect(updated.player.position.y).toBeLessThan(initialY);
  });

  it('player moves down', () => {
    const grid = makeLargeGrid();
    const state = makeState({
      grid,
      player: {
        position: { x: TILE_SIZE * 3, y: TILE_SIZE * 3 },
        gridPos: { row: 3, col: 3 },
        alive: true,
        bombCount: 0,
        maxBombs: DEFAULT_MAX_BOMBS,
        bombRange: DEFAULT_BOMB_RANGE,
        speed: PLAYER_SPEED,
        passThroughBomb: null,
      },
    });
    const initialY = state.player.position.y;
    
    const updated = update(state, [InputAction.Down], 0.1);
    
    expect(updated.player.position.y).toBeGreaterThan(initialY);
  });

  it('player moves left', () => {
    const grid = makeLargeGrid();
    const state = makeState({
      grid,
      player: {
        position: { x: TILE_SIZE * 3, y: TILE_SIZE * 3 },
        gridPos: { row: 3, col: 3 },
        alive: true,
        bombCount: 0,
        maxBombs: DEFAULT_MAX_BOMBS,
        bombRange: DEFAULT_BOMB_RANGE,
        speed: PLAYER_SPEED,
        passThroughBomb: null,
      },
    });
    const initialX = state.player.position.x;
    
    const updated = update(state, [InputAction.Left], 0.1);
    
    expect(updated.player.position.x).toBeLessThan(initialX);
  });

  it('player moves right', () => {
    const grid = makeLargeGrid();
    const state = makeState({
      grid,
      player: {
        position: { x: TILE_SIZE * 3, y: TILE_SIZE * 3 },
        gridPos: { row: 3, col: 3 },
        alive: true,
        bombCount: 0,
        maxBombs: DEFAULT_MAX_BOMBS,
        bombRange: DEFAULT_BOMB_RANGE,
        speed: PLAYER_SPEED,
        passThroughBomb: null,
      },
    });
    const initialX = state.player.position.x;
    
    const updated = update(state, [InputAction.Right], 0.1);
    
    expect(updated.player.position.x).toBeGreaterThan(initialX);
  });

  it('player cannot walk through walls', () => {
    // Player at (1,1), wall at (0,1)
    const state = makeState({
      player: {
        position: { x: TILE_SIZE * 1.5, y: TILE_SIZE * 1.5 },
        gridPos: { row: 1, col: 1 },
        alive: true,
        bombCount: 0,
        maxBombs: 1,
        bombRange: 1,
        speed: PLAYER_SPEED,
        passThroughBomb: null,
      },
    });
    
    // Try moving up into wall
    const updated = update(state, [InputAction.Up], 1.0);
    
    // Should not move significantly (collision)
    expect(Math.floor(updated.player.gridPos.row)).toBe(1);
  });

  it('player cannot walk through destructible walls', () => {
    const grid = makeGrid([[2, 1, TileType.DestructibleWall]]);
    const state = makeState({ grid });
    
    // Try moving down into destructible wall
    const updated = update(state, [InputAction.Down], 1.0);
    
    // Should not move into destructible wall
    expect(Math.floor(updated.player.gridPos.row)).toBeLessThan(2);
  });

  it('player cannot walk off grid edges', () => {
    const state = makeState({
      player: {
        position: { x: TILE_SIZE * 0.5, y: TILE_SIZE * 0.5 },
        gridPos: { row: 0, col: 0 },
        alive: true,
        bombCount: 0,
        maxBombs: 1,
        bombRange: 1,
        speed: PLAYER_SPEED,
        passThroughBomb: null,
      },
    });
    
    // Try moving left from edge
    const updated = update(state, [InputAction.Left], 0.5);
    
    // Should be blocked by wall at edge
    expect(updated.player.position.x).toBeGreaterThanOrEqual(TILE_SIZE * 0.5);
  });

  it('diagonal movement is normalized', () => {
    const grid = makeLargeGrid();
    const state = makeState({
      grid,
      player: {
        position: { x: TILE_SIZE * 3, y: TILE_SIZE * 3 },
        gridPos: { row: 3, col: 3 },
        alive: true,
        bombCount: 0,
        maxBombs: DEFAULT_MAX_BOMBS,
        bombRange: DEFAULT_BOMB_RANGE,
        speed: PLAYER_SPEED,
        passThroughBomb: null,
      },
    });
    const initialPos = { ...state.player.position };
    
    // Move diagonally (up + right)
    const updated = update(state, [InputAction.Up, InputAction.Right], 0.1);
    
    const dx = updated.player.position.x - initialPos.x;
    const dy = updated.player.position.y - initialPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Should move at normal speed, not sqrt(2) times faster
    const expectedDistance = PLAYER_SPEED * 0.1;
    expect(distance).toBeCloseTo(expectedDistance, 1);
  });

  it('player does not move when no input', () => {
    const state = makeState();
    const initialPos = { ...state.player.position };
    
    const updated = update(state, [], 0.1);
    
    expect(updated.player.position).toEqual(initialPos);
  });
});

// ── Bomb Placement Tests ──────────────────────────────────────

describe('Bomb Placement', () => {
  it('space places bomb at player grid position', () => {
    const state = makeState();
    
    const updated = update(state, [InputAction.PlaceBomb], 0.1);
    
    expect(updated.bombs.length).toBe(1);
    expect(updated.bombs[0].position).toEqual({ row: 1, col: 1 });
  });

  it('cannot place more bombs than maxBombs', () => {
    const state = makeState({
      player: {
        position: { x: TILE_SIZE * 1.5, y: TILE_SIZE * 1.5 },
        gridPos: { row: 1, col: 1 },
        alive: true,
        bombCount: 0,
        maxBombs: 1,
        bombRange: 1,
        speed: PLAYER_SPEED,
        passThroughBomb: null,
      },
      bombs: [
        {
          position: { row: 2, col: 2 },
          timer: 2.0,
          range: 1,
          owner: 0,
        },
      ],
    });
    
    const updated = update(state, [InputAction.PlaceBomb], 0.1);
    
    // Should still be 1 bomb (at max already)
    expect(updated.bombs.length).toBe(1);
  });

  it('cannot place two bombs on same tile', () => {
    const state = makeState({
      bombs: [
        {
          position: { row: 1, col: 1 },
          timer: 2.5,
          range: 1,
          owner: 0,
        },
      ],
    });
    
    const updated = update(state, [InputAction.PlaceBomb], 0.1);
    
    // Should still be 1 bomb
    expect(updated.bombs.length).toBe(1);
  });

  it('bomb timer starts at BOMB_TIMER', () => {
    const state = makeState();
    
    const updated = update(state, [InputAction.PlaceBomb], 0.1);
    
    // Timer is decremented by dt (0.1) during update
    expect(updated.bombs[0].timer).toBeCloseTo(BOMB_TIMER - 0.1, 2);
  });
});

// ── Explosion Tests ───────────────────────────────────────────

describe('Explosions', () => {
  it('bomb detonates after BOMB_TIMER seconds', () => {
    const grid = makeLargeGrid();
    
    // Test approach 1: bomb with small timer that will detonate immediately
    const bomb1: BombState = {
      position: { row: 3, col: 3 },
      timer: 0.01,
      range: 1,
      owner: 0,
    };
    const state1 = makeState({ grid, bombs: [bomb1] });
    const detonated1 = update(state1, [], 0.02);
    expect(detonated1.bombs.length).toBe(0);
    expect(detonated1.explosions.length).toBeGreaterThan(0);
    
    // Test approach 2: bomb with full timer, tick it down
    const bomb2: BombState = {
      position: { row: 3, col: 3 },
      timer: BOMB_TIMER,
      range: 1,
      owner: 0,
    };
    const state2 = makeState({ grid, bombs: [bomb2] });
    
    // Tick just before detonation - bomb should still exist
    const almostDone = update(state2, [], BOMB_TIMER - 0.01);
    expect(almostDone.bombs.length).toBe(1);
    expect(almostDone.explosions.length).toBe(0);
  });

  it('explosion extends in 4 directions', () => {
    const grid = makeLargeGrid(); // Use larger grid
    const bomb: BombState = {
      position: { row: 3, col: 3 },
      timer: 0.01, // Will detonate immediately
      range: 2,
      owner: 0,
    };
    const state = makeState({ grid, bombs: [bomb] });
    
    const detonated = update(state, [], 0.02);
    
    // Should have center + 2 in each of 4 directions = 1 + 8 = 9
    expect(detonated.explosions.length).toBe(9);
    
    // Check center
    expect(detonated.explosions.some(e => 
      e.position.row === 3 && e.position.col === 3
    )).toBe(true);
    
    // Check all 4 directions (2 tiles each)
    expect(detonated.explosions.some(e => 
      e.position.row === 2 && e.position.col === 3
    )).toBe(true); // Up 1
    expect(detonated.explosions.some(e => 
      e.position.row === 1 && e.position.col === 3
    )).toBe(true); // Up 2
    expect(detonated.explosions.some(e => 
      e.position.row === 4 && e.position.col === 3
    )).toBe(true); // Down 1
    expect(detonated.explosions.some(e => 
      e.position.row === 5 && e.position.col === 3
    )).toBe(true); // Down 2
  });

  it('explosion stops at walls', () => {
    const grid = makeGrid([[2, 0, TileType.Wall]]); // Wall to the north
    const bomb: BombState = {
      position: { row: 2, col: 2 },
      timer: 0.01,
      range: 2,
      owner: 0,
    };
    const state = makeState({ grid, bombs: [bomb] });
    
    const detonated = update(state, [], 0.02);
    
    // Should have explosion at (1,2) - one step up
    expect(detonated.explosions.some(e => 
      e.position.row === 1 && e.position.col === 2
    )).toBe(true);
    
    // Should NOT have explosion at (0,2) - that's the wall
    expect(detonated.explosions.some(e => 
      e.position.row === 0 && e.position.col === 2
    )).toBe(false);
  });

  it('explosion destroys destructible walls', () => {
    const grid = makeGrid([[1, 2, TileType.DestructibleWall]]);
    const bomb: BombState = {
      position: { row: 2, col: 2 },
      timer: 0.01,
      range: 2,
      owner: 0,
    };
    const state = makeState({ grid, bombs: [bomb] });
    
    const detonated = update(state, [], 0.02);
    
    // Destructible wall should be destroyed
    expect(detonated.grid[1][2]).toBe(TileType.Empty);
  });

  it('explosion stops after destroying destructible wall', () => {
    const grid = makeGrid([
      [1, 2, TileType.DestructibleWall],
      [0, 2, TileType.Empty],
    ]);
    const bomb: BombState = {
      position: { row: 2, col: 2 },
      timer: 0.01,
      range: 3,
      owner: 0,
    };
    const state = makeState({ grid, bombs: [bomb] });
    
    const detonated = update(state, [], 0.02);
    
    // Should have explosion at (1,2) where destructible wall was
    expect(detonated.explosions.some(e => 
      e.position.row === 1 && e.position.col === 2
    )).toBe(true);
    
    // Should NOT have explosion at (0,2) - explosion stopped by wall
    expect(detonated.explosions.some(e => 
      e.position.row === 0 && e.position.col === 2
    )).toBe(false);
  });

  it('explosion duration is EXPLOSION_DURATION seconds', () => {
    const explosion: ExplosionState = {
      position: { row: 2, col: 2 },
      timer: EXPLOSION_DURATION,
    };
    const state = makeState({ explosions: [explosion] });
    
    // Tick just before expiration
    const almostGone = update(state, [], EXPLOSION_DURATION - 0.01);
    expect(almostGone.explosions.length).toBe(1);
    
    // Tick past expiration
    const gone = update(state, [], EXPLOSION_DURATION + 0.01);
    expect(gone.explosions.length).toBe(0);
  });
});

// ── Player Death Tests ────────────────────────────────────────

describe('Player Death', () => {
  it('player dies when in explosion tile', () => {
    const explosion: ExplosionState = {
      position: { row: 1, col: 1 },
      timer: 0.3,
    };
    const state = makeState({ explosions: [explosion] });
    
    const updated = update(state, [], 0.01);
    
    expect(updated.player.alive).toBe(false);
  });

  it('game status changes to Lost when player dies', () => {
    const explosion: ExplosionState = {
      position: { row: 1, col: 1 },
      timer: 0.3,
    };
    const state = makeState({ explosions: [explosion] });
    
    const updated = update(state, [], 0.01);
    
    expect(updated.status).toBe(GameStatus.Lost);
  });
});

// ── Powerup Tests ─────────────────────────────────────────────

describe('Powerups', () => {
  it('player picks up powerup when on same tile', () => {
    const powerup: PowerupState = {
      position: { row: 1, col: 1 },
      type: PowerupType.ExtraBomb,
    };
    const state = makeState({ powerups: [powerup] });
    
    const updated = update(state, [], 0.01);
    
    expect(updated.powerups.length).toBe(0);
  });

  it('ExtraBomb increases maxBombs', () => {
    const powerup: PowerupState = {
      position: { row: 1, col: 1 },
      type: PowerupType.ExtraBomb,
    };
    const state = makeState({ powerups: [powerup] });
    const initialMaxBombs = state.player.maxBombs;
    
    const updated = update(state, [], 0.01);
    
    expect(updated.player.maxBombs).toBe(initialMaxBombs + 1);
  });

  it('BiggerRange increases bombRange', () => {
    const powerup: PowerupState = {
      position: { row: 1, col: 1 },
      type: PowerupType.BiggerRange,
    };
    const state = makeState({ powerups: [powerup] });
    const initialRange = state.player.bombRange;
    
    const updated = update(state, [], 0.01);
    
    expect(updated.player.bombRange).toBe(initialRange + 1);
  });

  it('Speed increases player speed', () => {
    const powerup: PowerupState = {
      position: { row: 1, col: 1 },
      type: PowerupType.Speed,
    };
    const state = makeState({ powerups: [powerup] });
    const initialSpeed = state.player.speed;
    
    const updated = update(state, [], 0.01);
    
    expect(updated.player.speed).toBe(initialSpeed + 30);
  });
});

// ── Game Status Tests ─────────────────────────────────────────

describe('Game Status', () => {
  it('game does not update when status is not Running', () => {
    const state = makeState({ status: GameStatus.Lost });
    const initialPos = { ...state.player.position };
    
    const updated = update(state, [InputAction.Right], 0.1);
    
    expect(updated.player.position).toEqual(initialPos);
  });

  it('game starts as Running', () => {
    const level = makeGrid();
    const state = createInitialState(level, []); // No enemies
    
    expect(state.status).toBe(GameStatus.Running);
  });
});

// ── Future Tests (Placeholders for McManus's work) ───────────

describe.skip('Enemies (TODO)', () => {
  it('enemy spawns at designated positions');
  it('enemy moves toward player');
  it('enemy dies in explosion');
  it('player dies on contact with enemy');
  it('killing all enemies wins the game');
});

describe.skip('Chain Explosions (TODO)', () => {
  it('explosion triggers nearby bombs immediately');
  it('chain reactions propagate correctly');
});

describe.skip('Powerup Drops (TODO)', () => {
  it('destroyed walls have chance to drop powerups');
  it('powerup type is random');
});
