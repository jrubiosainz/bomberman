import { TileType, GridPosition, LevelConfig } from './types';

const W = TileType.Wall;
const D = TileType.DestructibleWall;
const E = TileType.Empty;

/**
 * Generates a configurable Bomberman level based on provided configuration.
 * - Outer border of indestructible walls
 * - Pillar grid at every even row/col intersection
 * - Random destructible walls based on density
 * - Player spawn area (top-left) guaranteed clear
 * - Enemy spawns distributed across the map
 */
export function generateLevel(config: LevelConfig): { grid: TileType[][]; enemySpawns: GridPosition[] } {
  const { gridWidth, gridHeight, destructibleWallDensity, enemyCount } = config;
  const grid: TileType[][] = [];

  // Create base grid structure
  for (let row = 0; row < gridHeight; row++) {
    grid[row] = [];
    for (let col = 0; col < gridWidth; col++) {
      // Outer walls
      if (row === 0 || row === gridHeight - 1 || col === 0 || col === gridWidth - 1) {
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

  // Scatter destructible walls based on density
  for (let row = 1; row < gridHeight - 1; row++) {
    for (let col = 1; col < gridWidth - 1; col++) {
      if (grid[row][col] !== E) continue;

      // Keep player spawn area clear (top-left corner)
      if (isPlayerSpawnZone(row, col)) continue;

      if (Math.random() < destructibleWallDensity) {
        grid[row][col] = D;
      }
    }
  }

  // Generate enemy spawn positions
  const enemySpawns = generateEnemySpawns(grid, gridWidth, gridHeight, enemyCount);

  return { grid, enemySpawns };
}

/** Player spawns at (1,1); keep adjacent tiles clear so they can move. */
function isPlayerSpawnZone(row: number, col: number): boolean {
  return (row === 1 && col === 1) ||
         (row === 1 && col === 2) ||
         (row === 2 && col === 1);
}

/** 
 * Generate enemy spawn positions distributed across the map.
 * Prefers corners and edges, ensures positions are empty and away from player.
 */
function generateEnemySpawns(
  grid: TileType[][],
  gridWidth: number,
  gridHeight: number,
  enemyCount: number
): GridPosition[] {
  const spawns: GridPosition[] = [];
  
  // Priority spawn positions (corners and edges, away from player)
  const candidates: GridPosition[] = [
    { row: gridHeight - 2, col: gridWidth - 2 },  // bottom-right
    { row: 1, col: gridWidth - 2 },                // top-right
    { row: gridHeight - 2, col: 1 },                // bottom-left
    { row: gridHeight - 2, col: Math.floor(gridWidth / 2) },  // bottom-center
    { row: Math.floor(gridHeight / 2), col: gridWidth - 2 },  // middle-right
    { row: 3, col: gridWidth - 4 },                // alt top-right
    { row: gridHeight - 4, col: 3 },                // alt bottom-left
    { row: 3, col: 3 },                            // near player but safe
  ];

  // Add more candidate positions for larger levels
  if (gridWidth >= 17 || gridHeight >= 13) {
    candidates.push(
      { row: Math.floor(gridHeight * 0.75), col: Math.floor(gridWidth * 0.75) },
      { row: Math.floor(gridHeight * 0.25), col: Math.floor(gridWidth * 0.75) },
      { row: Math.floor(gridHeight * 0.75), col: Math.floor(gridWidth * 0.25) }
    );
  }

  // Pick positions from candidates
  for (const pos of candidates) {
    if (spawns.length >= enemyCount) break;
    
    // Ensure spawn position is within bounds and empty
    if (pos.row > 0 && pos.row < gridHeight - 1 && 
        pos.col > 0 && pos.col < gridWidth - 1 &&
        grid[pos.row][pos.col] === TileType.Empty && 
        !isPlayerSpawnZone(pos.row, pos.col)) {
      spawns.push(pos);
    }
  }

  // Fill remaining spawns with random safe positions
  let attempts = 0;
  while (spawns.length < enemyCount && attempts < 100) {
    const row = Math.floor(Math.random() * (gridHeight - 4)) + 2;
    const col = Math.floor(Math.random() * (gridWidth - 4)) + 2;
    
    if (grid[row][col] === TileType.Empty && 
        !isPlayerSpawnZone(row, col) &&
        !spawns.some(s => s.row === row && s.col === col)) {
      spawns.push({ row, col });
    }
    attempts++;
  }

  return spawns;
}

// Legacy export for backward compatibility
export function createLevel1(): { grid: TileType[][]; enemySpawns: GridPosition[] } {
  // Use level 1 config for backward compatibility
  return generateLevel({
    level: 1,
    name: 'Classic',
    description: 'Classic level',
    gridWidth: 13,
    gridHeight: 11,
    tileSize: 60,
    enemyCount: 4,
    enemySpeed: 80,
    enemySmartness: 0.1,
    destructibleWallDensity: 0.4,
    powerupDropRate: 0.3,
    playerSpeed: 150,
    bombTimer: 3.0,
    theme: 'garden' as any,
  });
}
