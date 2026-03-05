import {
  type GameState,
  type PlayerState,
  type BombState,
  type ExplosionState,
  type EnemyState,
  type PowerupState,
  type GridPosition,
  TileType,
  InputAction,
  GameStatus,
  PowerupType,
} from './types';
import {
  TILE_SIZE,
  PLAYER_SPEED,
  DEFAULT_BOMB_RANGE,
  DEFAULT_MAX_BOMBS,
  BOMB_TIMER,
  EXPLOSION_DURATION,
  GRID_WIDTH,
  GRID_HEIGHT,
  ENEMY_SPEED,
  POWERUP_DROP_RATE,
} from './constants';

// ── Helpers ───────────────────────────────────────────────────

function pixelToGrid(x: number, y: number): GridPosition {
  return {
    col: Math.floor(x / TILE_SIZE),
    row: Math.floor(y / TILE_SIZE),
  };
}

function gridCenter(row: number, col: number): { x: number; y: number } {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2,
  };
}

function isWalkable(
  grid: TileType[][],
  row: number,
  col: number,
  bombs: BombState[],
  excludeBombPos?: GridPosition | null,
): boolean {
  if (row < 0 || row >= GRID_HEIGHT || col < 0 || col >= GRID_WIDTH) return false;
  if (grid[row][col] !== TileType.Empty) return false;
  // Bombs block movement (skip the pass-through bomb the player is still standing on)
  if (
    bombs.some(
      (b) =>
        b.position.row === row &&
        b.position.col === col &&
        !(excludeBombPos && b.position.row === excludeBombPos.row && b.position.col === excludeBombPos.col),
    )
  )
    return false;
  return true;
}

// ── State Creation ────────────────────────────────────────────

export function createInitialState(
  level: TileType[][],
  enemySpawns: GridPosition[],
): GameState {
  const spawn = gridCenter(1, 1);
  const player: PlayerState = {
    position: { x: spawn.x, y: spawn.y },
    gridPos: { row: 1, col: 1 },
    alive: true,
    bombCount: 0,
    maxBombs: DEFAULT_MAX_BOMBS,
    bombRange: DEFAULT_BOMB_RANGE,
    speed: PLAYER_SPEED,
    passThroughBomb: null,
  };

  // Initialize enemies at spawn positions
  const enemies: EnemyState[] = enemySpawns.map((spawn, index) => {
    const center = gridCenter(spawn.row, spawn.col);
    return {
      id: index,
      position: { x: center.x, y: center.y },
      gridPos: { row: spawn.row, col: spawn.col },
      alive: true,
      speed: ENEMY_SPEED,
      direction: randomDirection(),
    };
  });

  return {
    grid: level.map((row) => [...row]),
    player,
    bombs: [],
    explosions: [],
    powerups: [],
    enemies,
    status: GameStatus.Running,
    timer: 0,
  };
}

// ── Update (pure: state in → state out) ───────────────────────

export function update(state: GameState, actions: InputAction[], dt: number): GameState {
  if (state.status !== GameStatus.Running) return state;

  let next: GameState = {
    ...state,
    timer: state.timer + dt,
    grid: state.grid.map((row) => [...row]),
    bombs: state.bombs.map((b) => ({ ...b, position: { ...b.position } })),
    explosions: state.explosions.map((e) => ({ ...e, position: { ...e.position } })),
    powerups: state.powerups.map((p) => ({ ...p, position: { ...p.position } })),
    enemies: state.enemies.map((e) => ({
      ...e,
      position: { ...e.position },
      gridPos: { ...e.gridPos },
      direction: { ...e.direction },
    })),
    player: {
      ...state.player,
      position: { ...state.player.position },
      gridPos: { ...state.player.gridPos },
      passThroughBomb: state.player.passThroughBomb
        ? { ...state.player.passThroughBomb }
        : null,
    },
  };

  next = movePlayer(next, actions, dt);
  next = moveEnemies(next, dt);
  next = handleBombPlacement(next, actions);
  next = tickBombs(next, dt);
  next = tickExplosions(next, dt);
  next = checkPowerupPickup(next);
  next = checkPlayerDeath(next);
  next = checkEnemyCollision(next);
  next = checkWinCondition(next);

  return next;
}

// ── Movement ──────────────────────────────────────────────────

function movePlayer(state: GameState, actions: InputAction[], dt: number): GameState {
  const player = state.player;
  if (!player.alive) return state;

  let dx = 0;
  let dy = 0;
  if (actions.includes(InputAction.Up)) dy -= 1;
  if (actions.includes(InputAction.Down)) dy += 1;
  if (actions.includes(InputAction.Left)) dx -= 1;
  if (actions.includes(InputAction.Right)) dx += 1;

  if (dx === 0 && dy === 0) return state;

  // Normalize diagonal movement
  const len = Math.sqrt(dx * dx + dy * dy);
  dx /= len;
  dy /= len;

  const speed = player.speed * dt;
  const newX = player.position.x + dx * speed;
  const newY = player.position.y + dy * speed;

  // Collision: check the bounding box corners against the grid
  const halfSize = TILE_SIZE * 0.4; // slightly smaller than tile for forgiving collision

  const canMoveX = canMoveTo(state.grid, state.bombs, newX, player.position.y, halfSize, player.passThroughBomb);
  const canMoveY = canMoveTo(state.grid, state.bombs, player.position.x, newY, halfSize, player.passThroughBomb);

  const finalX = canMoveX ? newX : player.position.x;
  const finalY = canMoveY ? newY : player.position.y;

  const gridPos = pixelToGrid(finalX, finalY);

  // Clear pass-through only when the player's ENTIRE bounding box has left the bomb tile
  let passThroughBomb = player.passThroughBomb;
  if (passThroughBomb) {
    const corners = [
      pixelToGrid(finalX - halfSize, finalY - halfSize),
      pixelToGrid(finalX + halfSize, finalY - halfSize),
      pixelToGrid(finalX - halfSize, finalY + halfSize),
      pixelToGrid(finalX + halfSize, finalY + halfSize),
    ];
    const stillOverlapping = corners.some(
      (c) => c.row === passThroughBomb!.row && c.col === passThroughBomb!.col,
    );
    if (!stillOverlapping) {
      passThroughBomb = null;
    }
  }

  return {
    ...state,
    player: {
      ...player,
      position: { x: finalX, y: finalY },
      gridPos,
      passThroughBomb,
    },
  };
}

function canMoveTo(
  grid: TileType[][],
  bombs: BombState[],
  x: number,
  y: number,
  half: number,
  excludeBombPos?: GridPosition | null,
): boolean {
  // Check all four corners of the player's bounding box
  const corners = [
    { x: x - half, y: y - half },
    { x: x + half, y: y - half },
    { x: x - half, y: y + half },
    { x: x + half, y: y + half },
  ];

  return corners.every((c) => {
    const g = pixelToGrid(c.x, c.y);
    return isWalkable(grid, g.row, g.col, bombs, excludeBombPos);
  });
}

// ── Bomb Placement ────────────────────────────────────────────

function handleBombPlacement(state: GameState, actions: InputAction[]): GameState {
  if (!actions.includes(InputAction.PlaceBomb)) return state;
  if (!state.player.alive) return state;

  const player = state.player;
  const activeBombs = state.bombs.filter((b) => b.owner === 0).length;
  if (activeBombs >= player.maxBombs) return state;

  const pos = player.gridPos;
  // Don't place if a bomb already exists here
  if (state.bombs.some((b) => b.position.row === pos.row && b.position.col === pos.col)) {
    return state;
  }

  const bomb: BombState = {
    position: { row: pos.row, col: pos.col },
    timer: BOMB_TIMER,
    range: player.bombRange,
    owner: 0,
  };

  return {
    ...state,
    bombs: [...state.bombs, bomb],
    player: {
      ...state.player,
      passThroughBomb: { row: pos.row, col: pos.col },
    },
  };
}

// ── Bomb Tick & Detonation ────────────────────────────────────

function tickBombs(state: GameState, dt: number): GameState {
  const remaining: BombState[] = [];
  let newExplosions: ExplosionState[] = [...state.explosions];
  let grid = state.grid;
  let powerups = [...state.powerups];
  let toDetonate: BombState[] = [];

  // Check which bombs need to explode (timer expired)
  for (const bomb of state.bombs) {
    const updated = { ...bomb, timer: bomb.timer - dt };
    if (updated.timer <= 0) {
      toDetonate.push(updated);
    } else {
      remaining.push(updated);
    }
  }

  // Chain explosions: check if existing explosions hit any remaining bombs
  for (const bomb of remaining) {
    const hit = state.explosions.some(
      (e) => e.position.row === bomb.position.row && e.position.col === bomb.position.col,
    );
    if (hit) {
      toDetonate.push(bomb);
    }
  }

  // Remove chain-detonated bombs from remaining
  const finalRemaining = remaining.filter(
    (b) =>
      !toDetonate.some((d) => d.position.row === b.position.row && d.position.col === b.position.col),
  );

  // Detonate all bombs
  for (const bomb of toDetonate) {
    const result = detonate(grid, bomb);
    grid = result.grid;
    powerups = [...powerups, ...result.powerups];
    newExplosions = [...newExplosions, ...result.explosions];
  }

  return { ...state, bombs: finalRemaining, explosions: newExplosions, grid, powerups,
    // Clear pass-through if the bomb the player was overlapping got detonated
    player: state.player.passThroughBomb &&
      toDetonate.some(
        (b) =>
          b.position.row === state.player.passThroughBomb!.row &&
          b.position.col === state.player.passThroughBomb!.col,
      )
      ? { ...state.player, passThroughBomb: null }
      : state.player,
  };
}

function detonate(
  grid: TileType[][],
  bomb: BombState,
): { grid: TileType[][]; explosions: ExplosionState[]; powerups: PowerupState[] } {
  const newGrid = grid.map((r) => [...r]);
  const explosions: ExplosionState[] = [];
  const powerups: PowerupState[] = [];

  // Center
  explosions.push({ position: { ...bomb.position }, timer: EXPLOSION_DURATION });

  // Four directions
  const dirs = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];

  for (const dir of dirs) {
    for (let i = 1; i <= bomb.range; i++) {
      const row = bomb.position.row + dir.dr * i;
      const col = bomb.position.col + dir.dc * i;

      if (row < 0 || row >= GRID_HEIGHT || col < 0 || col >= GRID_WIDTH) break;

      const tile = newGrid[row][col];
      if (tile === TileType.Wall) break;

      explosions.push({ position: { row, col }, timer: EXPLOSION_DURATION });

      if (tile === TileType.DestructibleWall) {
        newGrid[row][col] = TileType.Empty;
        // Random powerup drop
        if (Math.random() < POWERUP_DROP_RATE) {
          powerups.push({
            position: { row, col },
            type: randomPowerupType(),
          });
        }
        break; // Explosion stops after destroying a wall
      }
    }
  }

  return { grid: newGrid, explosions, powerups };
}

// ── Explosion Tick ────────────────────────────────────────────

function tickExplosions(state: GameState, dt: number): GameState {
  const explosions = state.explosions
    .map((e) => ({ ...e, timer: e.timer - dt }))
    .filter((e) => e.timer > 0);

  return { ...state, explosions };
}

// ── Powerup Pickup ────────────────────────────────────────────

function checkPowerupPickup(state: GameState): GameState {
  const player = state.player;
  if (!player.alive) return state;

  const remaining = state.powerups.filter((p) => {
    if (p.position.row === player.gridPos.row && p.position.col === player.gridPos.col) {
      return false; // picked up
    }
    return true;
  });

  if (remaining.length === state.powerups.length) return state;

  // Apply powerup effects
  const picked = state.powerups.filter(
    (p) => p.position.row === player.gridPos.row && p.position.col === player.gridPos.col,
  );

  let updatedPlayer = { ...player };
  for (const p of picked) {
    switch (p.type) {
      case 'extra_bomb':
        updatedPlayer = { ...updatedPlayer, maxBombs: updatedPlayer.maxBombs + 1 };
        break;
      case 'bigger_range':
        updatedPlayer = { ...updatedPlayer, bombRange: updatedPlayer.bombRange + 1 };
        break;
      case 'speed':
        updatedPlayer = { ...updatedPlayer, speed: updatedPlayer.speed + 30 };
        break;
    }
  }

  return { ...state, player: updatedPlayer, powerups: remaining };
}

// ── Death Check ───────────────────────────────────────────────

function checkPlayerDeath(state: GameState): GameState {
  const player = state.player;
  if (!player.alive) return state;

  const hit = state.explosions.some(
    (e) => e.position.row === player.gridPos.row && e.position.col === player.gridPos.col,
  );

  if (hit) {
    return {
      ...state,
      player: { ...player, alive: false },
      status: GameStatus.Lost,
    };
  }

  return state;
}

// ── Enemy AI ──────────────────────────────────────────────────

function moveEnemies(state: GameState, dt: number): GameState {
  const enemies = state.enemies.map((enemy) => {
    if (!enemy.alive) return enemy;

    const speed = enemy.speed * dt;
    let newX = enemy.position.x + enemy.direction.dc * speed;
    let newY = enemy.position.y + enemy.direction.dr * speed;

    // Check if next position is walkable
    const nextGrid = pixelToGrid(newX, newY);
    const canMove = isWalkable(state.grid, nextGrid.row, nextGrid.col, state.bombs);

    if (!canMove) {
      // Hit a wall or bomb, pick new random direction
      const newDir = randomDirection();
      return { ...enemy, direction: newDir };
    }

    // Move enemy
    const gridPos = pixelToGrid(newX, newY);
    return {
      ...enemy,
      position: { x: newX, y: newY },
      gridPos,
    };
  });

  return { ...state, enemies };
}

function checkEnemyCollision(state: GameState): GameState {
  const player = state.player;
  if (!player.alive) return state;

  // Check if player collides with any enemy
  const collision = state.enemies.some(
    (e) =>
      e.alive &&
      e.gridPos.row === player.gridPos.row &&
      e.gridPos.col === player.gridPos.col,
  );

  if (collision) {
    return {
      ...state,
      player: { ...player, alive: false },
      status: GameStatus.Lost,
    };
  }

  // Kill enemies hit by explosions
  const enemies = state.enemies.map((enemy) => {
    if (!enemy.alive) return enemy;

    const hit = state.explosions.some(
      (e) => e.position.row === enemy.gridPos.row && e.position.col === enemy.gridPos.col,
    );

    if (hit) {
      return { ...enemy, alive: false };
    }

    return enemy;
  });

  return { ...state, enemies };
}

// ── Win Condition ─────────────────────────────────────────────

function checkWinCondition(state: GameState): GameState {
  const allEnemiesDead = state.enemies.every((e) => !e.alive);

  if (allEnemiesDead && state.status === GameStatus.Running) {
    return { ...state, status: GameStatus.Won };
  }

  return state;
}

// ── Helpers ───────────────────────────────────────────────────

function randomDirection(): { dr: number; dc: number } {
  const dirs = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];
  return dirs[Math.floor(Math.random() * dirs.length)];
}

function randomPowerupType(): PowerupType {
  const types = [PowerupType.ExtraBomb, PowerupType.BiggerRange, PowerupType.Speed];
  return types[Math.floor(Math.random() * types.length)];
}
