import { GameState, LLMConfig, LLMAction, InputAction, TileType, PowerupType } from './types';
import { LLM_TICK_INTERVAL } from './constants';

/**
 * LLM-powered player controller.
 * Makes decisions by sending the game state to an LLM and parsing its response.
 * Auth is handled server-side by the Vite proxy — no API key needed.
 */
export class LLMPlayer {
  private config: LLMConfig;
  private pendingAction: InputAction | null = null;
  private isThinking: boolean = false;
  private lastReasoning: string = '';
  private tickAccumulator: number = 0;
  private moveHistory: string[] = [];
  private errorCount: number = 0;
  private currentInterval: number = LLM_TICK_INTERVAL;
  private retryAfter: number = 0; // Cooldown timer for rate limit recovery

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /** Check whether the Vite proxy can authenticate with GitHub. */
  static async checkAuth(): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      return data.authenticated === true;
    } catch {
      return false;
    }
  }

  async tick(state: GameState, dt: number): Promise<InputAction[]> {
    this.tickAccumulator += dt;

    // Count down cooldown timer if in recovery mode
    if (this.retryAfter > 0) {
      this.retryAfter -= dt;
      if (this.retryAfter <= 0) {
        // Reset after cooldown expires
        this.retryAfter = 0;
        this.errorCount = 0;
        this.currentInterval = LLM_TICK_INTERVAL;
        this.lastReasoning = 'Recovered from errors, resuming...';
      } else {
        // Display countdown
        this.lastReasoning = `Rate limited, retrying in ${Math.ceil(this.retryAfter)}s...`;
      }
      return this.pendingAction ? [this.pendingAction] : [];
    }

    // Return pending action if LLM is still thinking
    if (this.isThinking) {
      return this.pendingAction ? [this.pendingAction] : [];
    }

    // Request new decision when interval elapsed
    if (this.tickAccumulator >= this.currentInterval) {
      this.tickAccumulator = 0;
      this.requestLLMDecision(state);
    }

    return this.pendingAction ? [this.pendingAction] : [];
  }

  private async requestLLMDecision(state: GameState): Promise<void> {
    this.isThinking = true;

    try {
      const stateStr = this.serializeState(state);
      const action = await this.callLLM(stateStr);
      
      this.pendingAction = action.action;
      this.lastReasoning = action.reasoning;
      
      // Success — reset error state and interval
      this.errorCount = 0;
      this.currentInterval = LLM_TICK_INTERVAL;

      // Track move history for learning
      if (action.action) {
        this.moveHistory.push(action.action);
        if (this.moveHistory.length > 10) {
          this.moveHistory.shift();
        }
      }
    } catch (error) {
      console.error('LLM error:', error);
      this.errorCount++;
      
      // Exponential backoff — double the interval on each error (max 30 seconds)
      this.currentInterval = Math.min(this.currentInterval * 2, 30);
      
      // Fallback to random movement on error
      this.pendingAction = this.randomAction();
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.lastReasoning = `Error (${this.errorCount}): ${errorMsg}. Retrying in ${this.currentInterval.toFixed(1)}s...`;
      
      // If too many errors, enter cooldown mode instead of giving up permanently
      if (this.errorCount > 5) {
        this.retryAfter = 10; // 10-second cooldown
        this.pendingAction = InputAction.Wait;
        this.lastReasoning = 'Too many errors. Cooling down for 10s...';
      }
    } finally {
      this.isThinking = false;
    }
  }

  private serializeState(state: GameState): string {
    const { grid, player, enemies, bombs, explosions, powerups, levelConfig } = state;
    
    let output = '=== BOMBERMAN STATE ===\n\n';
    
    // Game info
    output += `Level: ${levelConfig.level} (${levelConfig.name})\n`;
    output += `Lives: ${state.lives} | Score: ${state.score}\n`;
    output += `Player Stats: ${player.maxBombs} bombs, range ${player.bombRange}, speed ${Math.round(player.speed)}\n\n`;

    // For large grids (>15 width), send only a window around the player
    const COMPACT_THRESHOLD = 15;
    const WINDOW_SIZE = 11; // 11x11 window centered on player
    const useCompactView = grid[0].length > COMPACT_THRESHOLD;

    let startRow = 0, endRow = grid.length;
    let startCol = 0, endCol = grid[0].length;

    if (useCompactView) {
      const halfWindow = Math.floor(WINDOW_SIZE / 2);
      startRow = Math.max(0, player.gridPos.row - halfWindow);
      endRow = Math.min(grid.length, player.gridPos.row + halfWindow + 1);
      startCol = Math.max(0, player.gridPos.col - halfWindow);
      endCol = Math.min(grid[0].length, player.gridPos.col + halfWindow + 1);
      output += `GRID (${WINDOW_SIZE}x${WINDOW_SIZE} window around player):\n`;
    } else {
      output += 'GRID:\n';
    }

    // Grid visualization (respects compact window when active)
    for (let row = startRow; row < endRow; row++) {
      let line = '';
      for (let col = startCol; col < endCol; col++) {
        // Check for entities at this position
        const hasPlayer = player.gridPos.row === row && player.gridPos.col === col && player.alive;
        const hasEnemy = enemies.some(e => e.alive && e.gridPos.row === row && e.gridPos.col === col);
        const hasBomb = bombs.some(b => b.position.row === row && b.position.col === col);
        const hasExplosion = explosions.some(e => e.position.row === row && e.position.col === col);
        const hasPowerup = powerups.some(p => p.position.row === row && p.position.col === col);

        if (hasPlayer) {
          line += 'P';
        } else if (hasEnemy) {
          line += 'E';
        } else if (hasExplosion) {
          line += '*';
        } else if (hasBomb) {
          line += 'B';
        } else if (hasPowerup) {
          line += '+';
        } else {
          switch (grid[row][col]) {
            case TileType.Wall:
              line += '#';
              break;
            case TileType.DestructibleWall:
              line += 'X';
              break;
            default:
              line += '.';
          }
        }
      }
      output += line + '\n';
    }

    // Detailed info
    output += '\nENEMIES:\n';
    const aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length === 0) {
      output += 'None remaining!\n';
    } else {
      // If using compact view, list ALL enemy positions (even outside window)
      aliveEnemies.forEach(e => {
        const dist = Math.abs(e.gridPos.row - player.gridPos.row) + Math.abs(e.gridPos.col - player.gridPos.col);
        const inWindow = !useCompactView || 
                        (e.gridPos.row >= startRow && e.gridPos.row < endRow && 
                         e.gridPos.col >= startCol && e.gridPos.col < endCol);
        const marker = inWindow ? '' : ' (outside window)';
        output += `- Enemy at (${e.gridPos.row}, ${e.gridPos.col}), distance: ${dist}${marker}\n`;
      });
    }

    output += '\nBOMBS:\n';
    if (bombs.length === 0) {
      output += 'None\n';
    } else {
      bombs.forEach(b => {
        output += `- Bomb at (${b.position.row}, ${b.position.col}), timer: ${b.timer.toFixed(1)}s, range: ${b.range}\n`;
      });
    }

    output += '\nPOWERUPS:\n';
    if (powerups.length === 0) {
      output += 'None\n';
    } else {
      powerups.forEach(p => {
        const typeStr = p.type === PowerupType.ExtraBomb ? 'Extra Bomb' :
                        p.type === PowerupType.BiggerRange ? 'Bigger Range' : 'Speed';
        output += `- ${typeStr} at (${p.position.row}, ${p.position.col})\n`;
      });
    }

    output += '\nPLAYER POSITION: (' + player.gridPos.row + ', ' + player.gridPos.col + ')\n';

    return output;
  }

  private async callLLM(prompt: string): Promise<LLMAction> {
    const systemPrompt = `You are playing Bomberman. Your goal is to defeat all enemies without dying.

RULES:
- You are 'P' on the grid
- '#' = indestructible wall, 'X' = destructible wall, '.' = empty
- 'E' = enemy (kill all to win), 'B' = bomb, '*' = explosion (deadly!), '+' = powerup
- Explosions travel in 4 directions (up/down/left/right) and kill you if you're in their path
- Bombs explode after ~2-3 seconds
- You can only place bombs where you are standing
- Walls block explosions

ACTIONS: up, down, left, right, bomb, wait

STRATEGY:
- Place bombs to kill enemies and break walls
- ALWAYS escape after placing a bomb — explosions kill you too!
- Collect powerups to get stronger
- Trap enemies in bomb blasts
- Don't place bombs if you can't escape
- Watch bomb timers — get to safety before they explode

Respond with JSON ONLY: {"action": "up"|"down"|"left"|"right"|"bomb"|"wait", "reasoning": "brief explanation"}`;

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      // Check for rate limit (HTTP 429)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) : 10;
        this.retryAfter = waitTime;
        throw new Error(`Rate limited (HTTP 429). Retrying after ${waitTime}s...`);
      }
      // Treat 500/502/503/504 as transient — backoff and retry
      if (response.status >= 500) {
        throw new Error(`Server error (${response.status}). Will retry with backoff...`);
      }
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON response
    const jsonMatch = content.match(/\{.*\}/s);
    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const action = this.parseAction(parsed.action);
    const reasoning = parsed.reasoning || 'No reasoning provided';

    return { action, reasoning };
  }

  private parseAction(actionStr: string): InputAction | null {
    switch (actionStr?.toLowerCase()) {
      case 'up': return InputAction.Up;
      case 'down': return InputAction.Down;
      case 'left': return InputAction.Left;
      case 'right': return InputAction.Right;
      case 'bomb': return InputAction.PlaceBomb;
      case 'wait': return InputAction.Wait;
      default: return InputAction.Wait;
    }
  }

  private randomAction(): InputAction {
    const actions = [InputAction.Up, InputAction.Down, InputAction.Left, InputAction.Right, InputAction.Wait];
    return actions[Math.floor(Math.random() * actions.length)];
  }

  get thinking(): boolean {
    return this.isThinking;
  }

  get reasoning(): string {
    return this.lastReasoning;
  }

  get currentAction(): InputAction | null {
    return this.pendingAction;
  }
}
