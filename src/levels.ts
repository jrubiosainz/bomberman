import { TileType, GridPosition } from './types';
import { GRID_WIDTH, GRID_HEIGHT, ENEMY_COUNT } from './constants';

const W = TileType.Wall;
const D = TileType.DestructibleWall;
const E = TileType.Empty;

/**
 * Classic Bomberman level layout:
 * - Outer border of indestructible walls
 * - Pillar grid at every even row/col intersection
 * - Random destructible walls (~40% of remaining empty tiles)
 * - Player spawn area (top-left) guaranteed clear
 */
export function createLevel1(): { grid: TileType[][]; enemySpawns: GridPosition[] } {
  const grid: TileType[][] = [];

  for (let row = 0; row < GRID_HEIGHT; row++) {
    grid[row] = [];
    for (let col = 0; col < GRID_WIDTH; col++) {
      // Outer walls
      if (row === 0 || row === GRID_HEIGHT - 1 || col === 0 || col === GRID_WIDTH - 1) {
        grid[row][col] = W;
      }
      // Pillar grid: indestructible walls at even row & col (inside border)
      else if (row % 2 === 0 && col % 2 === 0) {
        grid[row][col] = W;
      }
      // Everything else starts empty
      else {
        grid[row][col] = E;
      }
    }
  }

  // Scatter destructible walls (~40% of empty interior tiles)
  for (let row = 1; row < GRID_HEIGHT - 1; row++) {
    for (let col = 1; col < GRID_WIDTH - 1; col++) {
      if (grid[row][col] !== E) continue;

      // Keep player spawn area clear (top-left 3 tiles)
      if (isPlayerSpawnZone(row, col)) continue;

      if (Math.random() < 0.4) {
        grid[row][col] = D;
      }
    }
  }

  // Generate enemy spawn positions (corners and safe spots, away from player)
  const enemySpawns: GridPosition[] = generateEnemySpawns(grid);

  return { grid, enemySpawns };
}

/** Player spawns at (1,1); keep adjacent tiles clear so they can move. */
function isPlayerSpawnZone(row: number, col: number): boolean {
  return (row === 1 && col === 1) ||
         (row === 1 && col === 2) ||
         (row === 2 && col === 1);
}

/** Generate enemy spawn positions in safe corners, away from player. */
function generateEnemySpawns(grid: TileType[][]): GridPosition[] {
  const spawns: GridPosition[] = [];
  const candidates: GridPosition[] = [
    // Corners (away from player at 1,1)
    { row: GRID_HEIGHT - 2, col: GRID_WIDTH - 2 },  // bottom-right
    { row: 1, col: GRID_WIDTH - 2 },                // top-right
    { row: GRID_HEIGHT - 2, col: 1 },                // bottom-left
    { row: GRID_HEIGHT - 2, col: Math.floor(GRID_WIDTH / 2) },  // bottom-center
    { row: Math.floor(GRID_HEIGHT / 2), col: GRID_WIDTH - 2 },  // middle-right
    { row: 3, col: GRID_WIDTH - 4 },                // alternative positions
  ];

  // Pick ENEMY_COUNT positions, preferring corners first
  for (let i = 0; i < Math.min(ENEMY_COUNT, candidates.length); i++) {
    const pos = candidates[i];
    // Ensure spawn position is empty
    if (grid[pos.row][pos.col] === TileType.Empty) {
      spawns.push(pos);
    }
  }

  // Fill remaining spawns with random safe positions if needed
  while (spawns.length < ENEMY_COUNT) {
    const row = Math.floor(Math.random() * (GRID_HEIGHT - 4)) + 2;
    const col = Math.floor(Math.random() * (GRID_WIDTH - 4)) + 2;
    
    if (grid[row][col] === TileType.Empty && 
        !isPlayerSpawnZone(row, col) &&
        !spawns.some(s => s.row === row && s.col === col)) {
      spawns.push({ row, col });
    }
  }

  return spawns;
}
