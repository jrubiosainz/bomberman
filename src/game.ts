import {
  type GameState,
  type PlayerState,
  type BombState,
  type ExplosionState,
  type EnemyState,
  type PowerupState,
  type GridPosition,
  type LevelConfig,
  TileType,
  InputAction,
  GameStatus,
  PowerupType,
  SoundEvent,
  ParticleEventType,
} from './types';
import {
  DEFAULT_BOMB_RANGE,
  DEFAULT_MAX_BOMBS,
  EXPLOSION_DURATION,
  INITIAL_LIVES,
  SCORE_ENEMY_KILL,
  SCORE_WALL_BREAK,
  SCORE_POWERUP,
  SCORE_LEVEL_CLEAR,
  LEVEL_CONFIGS,
} from './constants';
import { generateLevel } from './levels';

// ── Helpers ───────────────────────────────────────────────────

function pixelToGrid(x: number, y: number, tileSize: number): GridPosition {
  return {
    col: Math.floor(x / tileSize),
    row: Math.floor(y / tileSize),
  };
}

function gridCenter(row: number, col: number, tileSize: number): { x: number; y: number } {
  return {
    x: col * tileSize + tileSize / 2,
    y: row * tileSize + tileSize / 2,
  };
}

function isWalkable(
  grid: TileType[][],
  row: number,
  col: number,
  gridWidth: number,
  gridHeight: number,
  bombs: BombState[],
  excludeBombPos?: GridPosition | null,
): boolean {
  if (row < 0 || row >= gridHeight || col < 0 || col >= gridWidth) return false;
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

export function createInitialState(levelConfig: LevelConfig, lives?: number, score?: number): GameState {
  const { grid, enemySpawns } = generateLevel(levelConfig);
  const spawn = gridCenter(1, 1, levelConfig.tileSize);
  
  const player: PlayerState = {
    position: { x: spawn.x, y: spawn.y },
    gridPos: { row: 1, col: 1 },
    alive: true,
    bombCount: 0,
    maxBombs: DEFAULT_MAX_BOMBS,
    bombRange: DEFAULT_BOMB_RANGE,
    speed: levelConfig.playerSpeed,
    passThroughBomb: null,
    direction: { dx: 0, dy: 0 },
  };

  // Initialize enemies at spawn positions
  const enemies: EnemyState[] = enemySpawns.map((spawn, index) => {
    const center = gridCenter(spawn.row, spawn.col, levelConfig.tileSize);
    return {
      id: index,
      position: { x: center.x, y: center.y },
      gridPos: { row: spawn.row, col: spawn.col },
      alive: true,
      speed: levelConfig.enemySpeed,
      direction: randomDirection(),
    };
  });

  return {
    grid: grid.map((row) => [...row]),
    player,
    bombs: [],
    explosions: [],
    powerups: [],
    enemies,
    status: GameStatus.Running,
    timer: 0,
    level: levelConfig.level,
    lives: lives ?? INITIAL_LIVES,
    score: score ?? 0,
    soundEvents: [],
    particleEvents: [],
    levelConfig,
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
      direction: { ...state.player.direction },
    },
    soundEvents: [], // Clear events from previous frame
    particleEvents: [],
    levelConfig: state.levelConfig,
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

  // Update direction for animation
  const direction = dx !== 0 || dy !== 0 ? { dx, dy } : player.direction;

  if (dx === 0 && dy === 0) {
    return {
      ...state,
      player: { ...player, direction },
    };
  }

  // Normalize diagonal movement
  const len = Math.sqrt(dx * dx + dy * dy);
  dx /= len;
  dy /= len;

  const speed = player.speed * dt;
  const newX = player.position.x + dx * speed;
  const newY = player.position.y + dy * speed;

  const tileSize = state.levelConfig.tileSize;
  const halfSize = tileSize * 0.4;

  const canMoveX = canMoveTo(state.grid, state.bombs, newX, player.position.y, halfSize, tileSize, state.levelConfig.gridWidth, state.levelConfig.gridHeight, player.passThroughBomb);
  const canMoveY = canMoveTo(state.grid, state.bombs, player.position.x, newY, halfSize, tileSize, state.levelConfig.gridWidth, state.levelConfig.gridHeight, player.passThroughBomb);

  const finalX = canMoveX ? newX : player.position.x;
  const finalY = canMoveY ? newY : player.position.y;

  const gridPos = pixelToGrid(finalX, finalY, tileSize);

  let passThroughBomb = player.passThroughBomb;
  if (passThroughBomb) {
    const corners = [
      pixelToGrid(finalX - halfSize, finalY - halfSize, tileSize),
      pixelToGrid(finalX + halfSize, finalY - halfSize, tileSize),
      pixelToGrid(finalX - halfSize, finalY + halfSize, tileSize),
      pixelToGrid(finalX + halfSize, finalY + halfSize, tileSize),
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
      direction,
    },
  };
}

function canMoveTo(
  grid: TileType[][],
  bombs: BombState[],
  x: number,
  y: number,
  half: number,
  tileSize: number,
  gridWidth: number,
  gridHeight: number,
  excludeBombPos?: GridPosition | null,
): boolean {
  const corners = [
    { x: x - half, y: y - half },
    { x: x + half, y: y - half },
    { x: x - half, y: y + half },
    { x: x + half, y: y + half },
  ];

  return corners.every((c) => {
    const g = pixelToGrid(c.x, c.y, tileSize);
    return isWalkable(grid, g.row, g.col, gridWidth, gridHeight, bombs, excludeBombPos);
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
  if (state.bombs.some((b) => b.position.row === pos.row && b.position.col === pos.col)) {
    return state;
  }

  const bomb: BombState = {
    position: { row: pos.row, col: pos.col },
    timer: state.levelConfig.bombTimer,
    range: player.bombRange,
    owner: 0,
  };

  const center = gridCenter(pos.row, pos.col, state.levelConfig.tileSize);

  return {
    ...state,
    bombs: [...state.bombs, bomb],
    player: {
      ...state.player,
      passThroughBomb: { row: pos.row, col: pos.col },
    },
    soundEvents: [...state.soundEvents, SoundEvent.BombPlace],
    particleEvents: [...state.particleEvents, {
      type: ParticleEventType.BombSpark,
      x: center.x,
      y: center.y,
    }],
  };
}

// ── Bomb Tick & Detonation ────────────────────────────────────

function tickBombs(state: GameState, dt: number): GameState {
  const remaining: BombState[] = [];
  let newExplosions: ExplosionState[] = [...state.explosions];
  let grid = state.grid;
  let powerups = [...state.powerups];
  let toDetonate: BombState[] = [];
  let soundEvents = [...state.soundEvents];
  let particleEvents = [...state.particleEvents];
  let score = state.score;

  for (const bomb of state.bombs) {
    const updated = { ...bomb, timer: bomb.timer - dt };
    if (updated.timer <= 0) {
      toDetonate.push(updated);
    } else {
      remaining.push(updated);
    }
  }

  for (const bomb of remaining) {
    const hit = state.explosions.some(
      (e) => e.position.row === bomb.position.row && e.position.col === bomb.position.col,
    );
    if (hit) {
      toDetonate.push(bomb);
    }
  }

  const finalRemaining = remaining.filter(
    (b) =>
      !toDetonate.some((d) => d.position.row === b.position.row && d.position.col === b.position.col),
  );

  for (const bomb of toDetonate) {
    const result = detonate(grid, bomb, state.levelConfig);
    grid = result.grid;
    powerups = [...powerups, ...result.powerups];
    newExplosions = [...newExplosions, ...result.explosions];
    
    soundEvents.push(SoundEvent.BombExplode);
    
    const center = gridCenter(bomb.position.row, bomb.position.col, state.levelConfig.tileSize);
    particleEvents.push({
      type: ParticleEventType.Explosion,
      x: center.x,
      y: center.y,
    });

    score += result.wallsDestroyed * SCORE_WALL_BREAK;

    result.wallsDestroyed > 0 && soundEvents.push(SoundEvent.WallBreak);
    for (let i = 0; i < result.wallsDestroyed; i++) {
      const wallPos = result.explosions[Math.min(i + 1, result.explosions.length - 1)];
      const wallCenter = gridCenter(wallPos.position.row, wallPos.position.col, state.levelConfig.tileSize);
      particleEvents.push({
        type: ParticleEventType.WallBreak,
        x: wallCenter.x,
        y: wallCenter.y,
      });
    }
  }

  return {
    ...state,
    bombs: finalRemaining,
    explosions: newExplosions,
    grid,
    powerups,
    score,
    soundEvents,
    particleEvents,
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
  config: LevelConfig,
): { grid: TileType[][]; explosions: ExplosionState[]; powerups: PowerupState[]; wallsDestroyed: number } {
  const newGrid = grid.map((r) => [...r]);
  const explosions: ExplosionState[] = [];
  const powerups: PowerupState[] = [];
  let wallsDestroyed = 0;

  explosions.push({ position: { ...bomb.position }, timer: EXPLOSION_DURATION });

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

      if (row < 0 || row >= config.gridHeight || col < 0 || col >= config.gridWidth) break;

      const tile = newGrid[row][col];
      if (tile === TileType.Wall) break;

      explosions.push({ position: { row, col }, timer: EXPLOSION_DURATION });

      if (tile === TileType.DestructibleWall) {
        newGrid[row][col] = TileType.Empty;
        wallsDestroyed++;
        
        if (Math.random() < config.powerupDropRate) {
          powerups.push({
            position: { row, col },
            type: randomPowerupType(),
          });
        }
        break;
      }
    }
  }

  return { grid: newGrid, explosions, powerups, wallsDestroyed };
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
      return false;
    }
    return true;
  });

  if (remaining.length === state.powerups.length) return state;

  const picked = state.powerups.filter(
    (p) => p.position.row === player.gridPos.row && p.position.col === player.gridPos.col,
  );

  let updatedPlayer = { ...player };
  let score = state.score;
  let soundEvents = [...state.soundEvents];
  let particleEvents = [...state.particleEvents];

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
    
    score += SCORE_POWERUP;
    soundEvents.push(SoundEvent.PowerupPickup);
    
    const center = gridCenter(p.position.row, p.position.col, state.levelConfig.tileSize);
    particleEvents.push({
      type: ParticleEventType.PowerupPickup,
      x: center.x,
      y: center.y,
      data: { powerupType: p.type },
    });
  }

  return { ...state, player: updatedPlayer, powerups: remaining, score, soundEvents, particleEvents };
}

// ── Death Check ───────────────────────────────────────────────

function checkPlayerDeath(state: GameState): GameState {
  const player = state.player;
  if (!player.alive) return state;

  const hit = state.explosions.some(
    (e) => e.position.row === player.gridPos.row && e.position.col === player.gridPos.col,
  );

  if (hit) {
    const newLives = state.lives - 1;
    let soundEvents = [...state.soundEvents, SoundEvent.PlayerDeath];
    let particleEvents = [...state.particleEvents, {
      type: ParticleEventType.PlayerDeath,
      x: player.position.x,
      y: player.position.y,
    }];

    if (newLives <= 0) {
      soundEvents.push(SoundEvent.GameOver);
      return {
        ...state,
        player: { ...player, alive: false },
        status: GameStatus.Lost,
        lives: 0,
        soundEvents,
        particleEvents,
      };
    } else {
      // Respawn player at starting position
      const spawn = gridCenter(1, 1, state.levelConfig.tileSize);
      return {
        ...state,
        player: {
          ...player,
          position: { x: spawn.x, y: spawn.y },
          gridPos: { row: 1, col: 1 },
          alive: true,
          passThroughBomb: null,
        },
        lives: newLives,
        bombs: [], // Clear bombs on respawn
        explosions: [],
        soundEvents,
        particleEvents,
      };
    }
  }

  return state;
}

// ── Enemy AI ──────────────────────────────────────────────────

function moveEnemies(state: GameState, dt: number): GameState {
  const enemies = state.enemies.map((enemy) => {
    if (!enemy.alive) return enemy;

    const curRow = enemy.gridPos.row;
    const curCol = enemy.gridPos.col;

    const targetRow = curRow + enemy.direction.dr;
    const targetCol = curCol + enemy.direction.dc;
    const target = gridCenter(targetRow, targetCol, state.levelConfig.tileSize);

    if (!isWalkable(state.grid, targetRow, targetCol, state.levelConfig.gridWidth, state.levelConfig.gridHeight, state.bombs)) {
      const newDir = pickDirection(state, curRow, curCol, enemy.direction);
      return { ...enemy, direction: newDir };
    }

    const step = enemy.speed * dt;
    let newX = enemy.position.x + enemy.direction.dc * step;
    let newY = enemy.position.y + enemy.direction.dr * step;

    const reachedX =
      enemy.direction.dc === 0 ||
      (enemy.direction.dc > 0 ? newX >= target.x : newX <= target.x);
    const reachedY =
      enemy.direction.dr === 0 ||
      (enemy.direction.dr > 0 ? newY >= target.y : newY <= target.y);

    if (reachedX && reachedY) {
      newX = target.x;
      newY = target.y;
      const newGridPos = { row: targetRow, col: targetCol };

      const newDir = pickDirection(state, targetRow, targetCol, enemy.direction);
      return {
        ...enemy,
        position: { x: newX, y: newY },
        gridPos: newGridPos,
        direction: newDir,
      };
    }

    return {
      ...enemy,
      position: { x: newX, y: newY },
    };
  });

  return { ...state, enemies };
}

function pickDirection(
  state: GameState,
  row: number,
  col: number,
  current: { dr: number; dc: number },
): { dr: number; dc: number } {
  const dirs = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];

  const walkable = dirs.filter((d) =>
    isWalkable(state.grid, row + d.dr, col + d.dc, state.levelConfig.gridWidth, state.levelConfig.gridHeight, state.bombs),
  );

  if (walkable.length === 0) return current;

  // Smart AI: use pathfinding toward player based on smartness probability
  if (Math.random() < state.levelConfig.enemySmartness) {
    const playerPos = state.player.gridPos;
    const distances = walkable.map((d) => {
      const newRow = row + d.dr;
      const newCol = col + d.dc;
      const dist = Math.abs(newRow - playerPos.row) + Math.abs(newCol - playerPos.col);
      return { dir: d, dist };
    });
    
    distances.sort((a, b) => a.dist - b.dist);
    return distances[0].dir;
  }

  // Classic behavior: prefer continuing straight
  const straight = walkable.find((d) => d.dr === current.dr && d.dc === current.dc);
  if (straight && Math.random() < 0.75) {
    return straight;
  }

  return walkable[Math.floor(Math.random() * walkable.length)];
}

function checkEnemyCollision(state: GameState): GameState {
  const player = state.player;
  if (!player.alive) return state;

  const collision = state.enemies.some(
    (e) =>
      e.alive &&
      e.gridPos.row === player.gridPos.row &&
      e.gridPos.col === player.gridPos.col,
  );

  if (collision) {
    const newLives = state.lives - 1;
    let soundEvents = [...state.soundEvents, SoundEvent.PlayerDeath];
    let particleEvents = [...state.particleEvents, {
      type: ParticleEventType.PlayerDeath,
      x: player.position.x,
      y: player.position.y,
    }];

    if (newLives <= 0) {
      soundEvents.push(SoundEvent.GameOver);
      return {
        ...state,
        player: { ...player, alive: false },
        status: GameStatus.Lost,
        lives: 0,
        soundEvents,
        particleEvents,
      };
    } else {
      const spawn = gridCenter(1, 1, state.levelConfig.tileSize);
      return {
        ...state,
        player: {
          ...player,
          position: { x: spawn.x, y: spawn.y },
          gridPos: { row: 1, col: 1 },
          alive: true,
          passThroughBomb: null,
        },
        lives: newLives,
        bombs: [],
        explosions: [],
        soundEvents,
        particleEvents,
      };
    }
  }

  let enemies = state.enemies;
  let score = state.score;
  let soundEvents = [...state.soundEvents];
  let particleEvents = [...state.particleEvents];

  enemies = enemies.map((enemy) => {
    if (!enemy.alive) return enemy;

    const hit = state.explosions.some(
      (e) => e.position.row === enemy.gridPos.row && e.position.col === enemy.gridPos.col,
    );

    if (hit) {
      score += SCORE_ENEMY_KILL;
      soundEvents.push(SoundEvent.EnemyDeath);
      particleEvents.push({
        type: ParticleEventType.EnemyDeath,
        x: enemy.position.x,
        y: enemy.position.y,
      });
      return { ...enemy, alive: false };
    }

    return enemy;
  });

  return { ...state, enemies, score, soundEvents, particleEvents };
}

// ── Win Condition ─────────────────────────────────────────────

function checkWinCondition(state: GameState): GameState {
  const allEnemiesDead = state.enemies.every((e) => !e.alive);

  if (allEnemiesDead && state.status === GameStatus.Running) {
    const score = state.score + SCORE_LEVEL_CLEAR;
    let soundEvents = [...state.soundEvents, SoundEvent.LevelComplete];
    let particleEvents = [...state.particleEvents];

    const center = gridCenter(
      Math.floor(state.levelConfig.gridHeight / 2),
      Math.floor(state.levelConfig.gridWidth / 2),
      state.levelConfig.tileSize
    );
    particleEvents.push({
      type: ParticleEventType.LevelComplete,
      x: center.x,
      y: center.y,
    });

    // Check if this is the final level
    if (state.level >= 5) {
      soundEvents.push(SoundEvent.Victory);
    }

    return { ...state, status: GameStatus.Won, score, soundEvents, particleEvents };
  }

  return state;
}

// ── Level Transition ──────────────────────────────────────────

export function transitionToNextLevel(state: GameState): GameState | null {
  if (state.status !== GameStatus.Won) return null;
  if (state.level >= 5) return null; // No next level after level 5

  const nextLevelConfig = LEVEL_CONFIGS[state.level]; // level is 1-indexed, array is 0-indexed
  return createInitialState(nextLevelConfig, state.lives, state.score);
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
