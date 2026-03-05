import { describe, it, expect } from 'vitest';
import { createLevel1 } from '../levels';
import { TileType } from '../types';
import { GRID_WIDTH, GRID_HEIGHT } from '../constants';

describe('Level Generation', () => {
  it('grid has correct dimensions', () => {
    const { grid } = createLevel1();
    
    expect(grid.length).toBe(GRID_HEIGHT);
    expect(grid[0].length).toBe(GRID_WIDTH);
  });

  it('outer border is all walls', () => {
    const { grid } = createLevel1();
    
    // Top border
    for (let col = 0; col < GRID_WIDTH; col++) {
      expect(grid[0][col]).toBe(TileType.Wall);
    }
    
    // Bottom border
    for (let col = 0; col < GRID_WIDTH; col++) {
      expect(grid[GRID_HEIGHT - 1][col]).toBe(TileType.Wall);
    }
    
    // Left border
    for (let row = 0; row < GRID_HEIGHT; row++) {
      expect(grid[row][0]).toBe(TileType.Wall);
    }
    
    // Right border
    for (let row = 0; row < GRID_HEIGHT; row++) {
      expect(grid[row][GRID_WIDTH - 1]).toBe(TileType.Wall);
    }
  });

  it('pillars at even row/col intersections', () => {
    const { grid } = createLevel1();
    
    // Check all even row/col intersections (inside border)
    for (let row = 2; row < GRID_HEIGHT - 1; row += 2) {
      for (let col = 2; col < GRID_WIDTH - 1; col += 2) {
        expect(grid[row][col]).toBe(TileType.Wall);
      }
    }
  });

  it('player spawn zone is clear', () => {
    const { grid } = createLevel1();
    
    // Player spawns at (1,1) and needs adjacent tiles clear
    expect(grid[1][1]).toBe(TileType.Empty);
    expect(grid[1][2]).toBe(TileType.Empty);
    expect(grid[2][1]).toBe(TileType.Empty);
  });

  it('has some destructible walls', () => {
    const { grid } = createLevel1();
    
    let destructibleCount = 0;
    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH; col++) {
        if (grid[row][col] === TileType.DestructibleWall) {
          destructibleCount++;
        }
      }
    }
    
    // Should have at least some destructible walls (randomized but non-zero)
    expect(destructibleCount).toBeGreaterThan(0);
  });

  it('destructible walls are only in valid positions', () => {
    const { grid } = createLevel1();
    
    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH; col++) {
        if (grid[row][col] === TileType.DestructibleWall) {
          // Should not be on borders
          expect(row).toBeGreaterThan(0);
          expect(row).toBeLessThan(GRID_HEIGHT - 1);
          expect(col).toBeGreaterThan(0);
          expect(col).toBeLessThan(GRID_WIDTH - 1);
          
          // Should not be at pillar positions (even row & col)
          expect(row % 2 === 0 && col % 2 === 0).toBe(false);
          
          // Should not be in player spawn zone
          const isSpawnZone = (row === 1 && col === 1) ||
                             (row === 1 && col === 2) ||
                             (row === 2 && col === 1);
          expect(isSpawnZone).toBe(false);
        }
      }
    }
  });

  it('level is deterministic within constraints', () => {
    // Generate multiple levels and verify structure is consistent
    const { grid: grid1 } = createLevel1();
    const { grid: grid2 } = createLevel1();
    
    // Borders should be identical
    expect(grid1[0]).toEqual(grid2[0]);
    expect(grid1[GRID_HEIGHT - 1]).toEqual(grid2[GRID_HEIGHT - 1]);
    
    // Pillars should be identical
    for (let row = 2; row < GRID_HEIGHT - 1; row += 2) {
      for (let col = 2; col < GRID_WIDTH - 1; col += 2) {
        expect(grid1[row][col]).toBe(grid2[row][col]);
      }
    }
    
    // Spawn zone should be identical
    expect(grid1[1][1]).toBe(grid2[1][1]);
    expect(grid1[1][2]).toBe(grid2[1][2]);
    expect(grid1[2][1]).toBe(grid2[2][1]);
  });
});
