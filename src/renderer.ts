import { type GameState, TileType, GameStatus, PowerupType } from './types';
import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, BOMB_TIMER, EXPLOSION_DURATION } from './constants';

// ── Cartoon Color Palette ─────────────────────────────────────

const COLORS = {
  // Background & Grass
  background: '#2d5a2d',
  grass: '#5dbf5d',
  grassDark: '#4aa84a',
  grassBlade: '#3d8f3d',
  
  // Walls
  wallStone: '#6b7280',
  wallStoneDark: '#4b5563',
  wallStoneLight: '#9ca3af',
  crateWood: '#a0826d',
  crateWoodDark: '#7d5a47',
  cratePlank: '#8b6f5b',
  
  // Player (white/cream Bomberman)
  playerBody: '#f8f8f0',
  playerOutline: '#2a2a2a',
  playerHelmet: '#ff6b6b',
  playerEye: '#2a2a2a',
  
  // Bomb
  bombBody: '#1a1a1a',
  bombOutline: '#000',
  bombHighlight: '#3a3a3a',
  fuseOrange: '#ff6b35',
  fuseYellow: '#ffd93d',
  
  // Explosion
  explosionCore: '#fff700',
  explosionMiddle: '#ffaa00',
  explosionOuter: '#ff4400',
  explosionRed: '#cc0000',
  
  // Enemy (red/orange blob)
  enemyBody: '#ff5555',
  enemyOutline: '#cc0000',
  enemyEye: '#ffffff',
  
  // Powerups
  powerupBomb: '#ff44ff',
  powerupRange: '#44ff44',
  powerupSpeed: '#44ddff',
  powerupOutline: '#2a2a2a',
  
  // UI
  hudBg: 'rgba(0, 0, 0, 0.7)',
  hudText: '#ffffff',
  hudIcon: '#ffd93d',
} as const;

// ── Animation State ───────────────────────────────────────────

interface AnimationState {
  time: number;
  explosionShake: { x: number; y: number };
}

// ── Renderer ──────────────────────────────────────────────────

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private animState: AnimationState = {
    time: 0,
    explosionShake: { x: 0, y: 0 },
  };
  private lastPlayerPos: { x: number; y: number } = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
  }

  render(state: GameState): void {
    const ctx = this.ctx;
    this.animState.time += 0.016; // approx 60fps

    // Calculate screen shake from explosions
    this.updateExplosionShake(state);

    // Apply shake offset
    ctx.save();
    ctx.translate(this.animState.explosionShake.x, this.animState.explosionShake.y);

    // Clear with background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, GRID_WIDTH * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);

    // Render layers
    this.renderGrid(state);
    this.renderPowerups(state);
    this.renderExplosions(state);
    this.renderBombs(state);
    this.renderEnemies(state);
    this.renderPlayer(state);

    ctx.restore();

    // UI overlays (no shake)
    this.renderHUD(state);
    this.renderGameStatus(state);
  }

  // ── Screen Shake Effect ───────────────────────────────────

  private updateExplosionShake(state: GameState): void {
    if (state.explosions.length > 0) {
      const intensity = Math.min(state.explosions.length * 2, 8);
      this.animState.explosionShake.x = (Math.random() - 0.5) * intensity;
      this.animState.explosionShake.y = (Math.random() - 0.5) * intensity;
    } else {
      this.animState.explosionShake.x *= 0.8;
      this.animState.explosionShake.y *= 0.8;
    }
  }

  // ── Grid Rendering (Walls & Grass) ────────────────────────

  private renderGrid(state: GameState): void {
    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH; col++) {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        const tile = state.grid[row][col];

        switch (tile) {
          case TileType.Empty:
            this.drawGrassTile(x, y);
            break;
          case TileType.Wall:
            this.drawStoneBrick(x, y);
            break;
          case TileType.DestructibleWall:
            this.drawWoodenCrate(x, y);
            break;
        }
      }
    }
  }

  private drawGrassTile(x: number, y: number): void {
    const ctx = this.ctx;
    
    // Base grass
    ctx.fillStyle = COLORS.grass;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    
    // Darker grass patches for variety
    const seed = x * 7 + y * 13;
    if (seed % 3 === 0) {
      ctx.fillStyle = COLORS.grassDark;
      ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    }
    
    // Random grass blades
    ctx.strokeStyle = COLORS.grassBlade;
    ctx.lineWidth = 2;
    const rnd = (x * 17 + y * 23) % 5;
    for (let i = 0; i < 3; i++) {
      const bx = x + ((rnd + i * 7) % TILE_SIZE);
      const by = y + ((rnd + i * 11) % TILE_SIZE);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + 1, by - 4);
      ctx.stroke();
    }
  }

  private drawStoneBrick(x: number, y: number): void {
    const ctx = this.ctx;
    
    // Main stone block
    ctx.fillStyle = COLORS.wallStone;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    
    // 3D shading - top/left light
    ctx.fillStyle = COLORS.wallStoneLight;
    ctx.fillRect(x, y, TILE_SIZE, 4);
    ctx.fillRect(x, y, 4, TILE_SIZE);
    
    // 3D shading - bottom/right dark
    ctx.fillStyle = COLORS.wallStoneDark;
    ctx.fillRect(x, y + TILE_SIZE - 4, TILE_SIZE, 4);
    ctx.fillRect(x + TILE_SIZE - 4, y, 4, TILE_SIZE);
    
    // Brick lines
    ctx.strokeStyle = COLORS.wallStoneDark;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
    ctx.strokeRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
    
    // Cartoon outline
    ctx.strokeStyle = COLORS.playerOutline;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
  }

  private drawWoodenCrate(x: number, y: number): void {
    const ctx = this.ctx;
    
    // Crate base
    ctx.fillStyle = COLORS.crateWood;
    ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    
    // Wood planks
    ctx.fillStyle = COLORS.cratePlank;
    for (let i = 0; i < 4; i++) {
      const py = y + 5 + i * 13;
      ctx.fillRect(x + 4, py, TILE_SIZE - 8, 10);
    }
    
    // Cross beams
    ctx.strokeStyle = COLORS.crateWoodDark;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 8);
    ctx.lineTo(x + TILE_SIZE - 8, y + TILE_SIZE - 8);
    ctx.moveTo(x + TILE_SIZE - 8, y + 8);
    ctx.lineTo(x + 8, y + TILE_SIZE - 8);
    ctx.stroke();
    
    // Cartoon outline
    ctx.strokeStyle = COLORS.playerOutline;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
  }

  // ── Powerup Rendering ─────────────────────────────────────

  private renderPowerups(state: GameState): void {
    const ctx = this.ctx;
    const bounce = Math.sin(this.animState.time * 3) * 3;
    
    for (const pu of state.powerups) {
      const x = pu.position.col * TILE_SIZE + TILE_SIZE / 2;
      const y = pu.position.row * TILE_SIZE + TILE_SIZE / 2 + bounce;
      
      let color: string;
      
      if (pu.type === PowerupType.BiggerRange) {
        color = COLORS.powerupRange;
      } else if (pu.type === PowerupType.Speed) {
        color = COLORS.powerupSpeed;
      } else {
        color = COLORS.powerupBomb;
      }
      
      // Outer glow
      ctx.fillStyle = color + '40';
      ctx.beginPath();
      ctx.arc(x, y, TILE_SIZE * 0.35, 0, Math.PI * 2);
      ctx.fill();
      
      // Main circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, TILE_SIZE * 0.28, 0, Math.PI * 2);
      ctx.fill();
      
      // Outline
      ctx.strokeStyle = COLORS.powerupOutline;
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Icon/letter
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = pu.type === PowerupType.ExtraBomb ? 'B' 
                  : pu.type === PowerupType.BiggerRange ? 'R' : 'S';
      ctx.fillText(label, x, y);
    }
  }

  // ── Bomb Rendering ────────────────────────────────────────

  private renderBombs(state: GameState): void {
    const ctx = this.ctx;
    
    for (const bomb of state.bombs) {
      const x = bomb.position.col * TILE_SIZE + TILE_SIZE / 2;
      const y = bomb.position.row * TILE_SIZE + TILE_SIZE / 2;
      
      // Pulsing based on timer countdown
      const timeRatio = bomb.timer / BOMB_TIMER;
      const pulse = 1 + (1 - timeRatio) * 0.15 * Math.sin(this.animState.time * 8);
      const radius = TILE_SIZE * 0.32 * pulse;
      
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(x + 2, y + radius + 4, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Bomb body (black sphere)
      ctx.fillStyle = COLORS.bombBody;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Highlight
      ctx.fillStyle = COLORS.bombHighlight;
      ctx.beginPath();
      ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
      
      // Thick outline
      ctx.strokeStyle = COLORS.bombOutline;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Fuse
      ctx.strokeStyle = COLORS.bombOutline;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y - radius);
      ctx.lineTo(x + 2, y - radius - 8);
      ctx.stroke();
      
      // Fuse spark (flicker)
      const sparkSize = 3 + Math.random() * 3;
      const sparkColor = Math.random() > 0.5 ? COLORS.fuseYellow : COLORS.fuseOrange;
      ctx.fillStyle = sparkColor;
      ctx.beginPath();
      ctx.arc(x + 2, y - radius - 8, sparkSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Spark glow
      ctx.fillStyle = COLORS.fuseYellow + '60';
      ctx.beginPath();
      ctx.arc(x + 2, y - radius - 8, sparkSize * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Explosion Rendering ───────────────────────────────────

  private renderExplosions(state: GameState): void {
    const ctx = this.ctx;
    
    for (const exp of state.explosions) {
      const x = exp.position.col * TILE_SIZE + TILE_SIZE / 2;
      const y = exp.position.row * TILE_SIZE + TILE_SIZE / 2;
      
      // Fade out as timer decreases
      const fadeRatio = exp.timer / EXPLOSION_DURATION;
      const scale = 0.8 + fadeRatio * 0.3;
      
      // Random rotation for variety
      const seed = exp.position.row * 100 + exp.position.col;
      const rotation = (seed % 8) * Math.PI / 4;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = fadeRatio;
      
      // Star burst pattern
      this.drawExplosionBurst(0, 0, TILE_SIZE * 0.5 * scale);
      
      ctx.restore();
    }
    
    ctx.globalAlpha = 1;
  }

  private drawExplosionBurst(x: number, y: number, size: number): void {
    const ctx = this.ctx;
    
    // Outer red ring
    ctx.fillStyle = COLORS.explosionRed;
    this.drawStar(x, y, 8, size, size * 0.6);
    
    // Middle orange layer
    ctx.fillStyle = COLORS.explosionOuter;
    this.drawStar(x, y, 8, size * 0.8, size * 0.5);
    
    // Bright orange/yellow layer
    ctx.fillStyle = COLORS.explosionMiddle;
    this.drawStar(x, y, 8, size * 0.6, size * 0.35);
    
    // Bright yellow core
    ctx.fillStyle = COLORS.explosionCore;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawStar(x: number, y: number, points: number, outerRadius: number, innerRadius: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  // ── Player Rendering ──────────────────────────────────────

  private renderPlayer(state: GameState): void {
    const ctx = this.ctx;
    const player = state.player;
    if (!player.alive) return;
    
    const x = player.position.x;
    const y = player.position.y;
    
    // Movement animation (bobbing)
    const dx = x - this.lastPlayerPos.x;
    const dy = y - this.lastPlayerPos.y;
    const moving = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5;
    const bob = moving ? Math.sin(this.animState.time * 10) * 2 : 0;
    this.lastPlayerPos = { x, y };
    
    const bodyRadius = TILE_SIZE * 0.35;
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + bodyRadius + 3, bodyRadius * 0.7, bodyRadius * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body (white/cream sphere)
    ctx.fillStyle = COLORS.playerBody;
    ctx.beginPath();
    ctx.arc(x, y + bob, bodyRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Thick cartoon outline
    ctx.strokeStyle = COLORS.playerOutline;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Helmet/antenna (red dome on top)
    ctx.fillStyle = COLORS.playerHelmet;
    ctx.beginPath();
    ctx.arc(x, y + bob - bodyRadius * 0.6, bodyRadius * 0.5, 0, Math.PI, true);
    ctx.fill();
    ctx.strokeStyle = COLORS.playerOutline;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Antenna tip
    ctx.fillStyle = COLORS.fuseYellow;
    ctx.beginPath();
    ctx.arc(x, y + bob - bodyRadius * 1.1, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.playerOutline;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Eyes (big cartoon eyes)
    const eyeY = y + bob - 5;
    const eyeSpacing = 10;
    
    // White of eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - eyeSpacing, eyeY, 6, 0, Math.PI * 2);
    ctx.arc(x + eyeSpacing, eyeY, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye outline
    ctx.strokeStyle = COLORS.playerOutline;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Pupils
    ctx.fillStyle = COLORS.playerEye;
    ctx.beginPath();
    ctx.arc(x - eyeSpacing + 1, eyeY, 3, 0, Math.PI * 2);
    ctx.arc(x + eyeSpacing + 1, eyeY, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye shine
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - eyeSpacing + 2, eyeY - 1, 1.5, 0, Math.PI * 2);
    ctx.arc(x + eyeSpacing + 2, eyeY - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Simple feet (small ovals when moving)
    if (moving) {
      const footOffset = Math.sin(this.animState.time * 10) > 0 ? -1 : 1;
      ctx.fillStyle = COLORS.playerOutline;
      ctx.beginPath();
      ctx.ellipse(x - 8, y + bodyRadius - 2, 5, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 8, y + bodyRadius - 2 + footOffset, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Enemy Rendering (defensive - checks if enemies exist) ─

  private renderEnemies(state: GameState): void {
    // Defensive coding: McManus is adding enemies
    const enemies = (state as any).enemies;
    if (!enemies || !Array.isArray(enemies)) return;
    
    const ctx = this.ctx;
    
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      
      const x = enemy.position.x;
      const y = enemy.position.y;
      const bounce = Math.sin(this.animState.time * 6 + enemy.id) * 3;
      const bodyRadius = TILE_SIZE * 0.32;
      
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(x, y + bodyRadius + 3, bodyRadius * 0.7, bodyRadius * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Body (red blob/balloon)
      ctx.fillStyle = COLORS.enemyBody;
      ctx.beginPath();
      ctx.arc(x, y + bounce, bodyRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Outline
      ctx.strokeStyle = COLORS.enemyOutline;
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Eyes (angry look)
      const eyeY = y + bounce - 5;
      ctx.fillStyle = COLORS.enemyEye;
      ctx.beginPath();
      ctx.arc(x - 8, eyeY, 5, 0, Math.PI * 2);
      ctx.arc(x + 8, eyeY, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Pupils (looking forward)
      ctx.fillStyle = COLORS.playerOutline;
      ctx.beginPath();
      ctx.arc(x - 8, eyeY + 1, 2.5, 0, Math.PI * 2);
      ctx.arc(x + 8, eyeY + 1, 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Angry eyebrows
      ctx.strokeStyle = COLORS.enemyOutline;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 12, eyeY - 5);
      ctx.lineTo(x - 5, eyeY - 3);
      ctx.moveTo(x + 12, eyeY - 5);
      ctx.lineTo(x + 5, eyeY - 3);
      ctx.stroke();
    }
  }

  // ── HUD Rendering ─────────────────────────────────────────

  private renderHUD(state: GameState): void {
    const ctx = this.ctx;
    const padding = 10;
    const iconSize = 24;
    
    // HUD background bar
    ctx.fillStyle = COLORS.hudBg;
    ctx.fillRect(0, 0, GRID_WIDTH * TILE_SIZE, 40);
    
    // Bomb count
    this.drawBombIcon(padding + iconSize / 2, 20, iconSize / 2);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`× ${state.player.bombCount}/${state.player.maxBombs}`, padding + iconSize + 10, 20);
    
    // Explosion range
    const rangeX = padding + 150;
    this.drawRangeIcon(rangeX + iconSize / 2, 20, iconSize / 2);
    ctx.fillText(`× ${state.player.bombRange}`, rangeX + iconSize + 10, 20);
    
    // Timer (optional - showing game time)
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(state.timer)}s`, GRID_WIDTH * TILE_SIZE - padding, 20);
  }

  private drawBombIcon(x: number, y: number, r: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.bombBody;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.hudIcon;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawRangeIcon(x: number, y: number, r: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.explosionMiddle;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.hudIcon;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // ── Game Status Overlays ──────────────────────────────────

  private renderGameStatus(state: GameState): void {
    const ctx = this.ctx;
    const centerX = (GRID_WIDTH * TILE_SIZE) / 2;
    const centerY = (GRID_HEIGHT * TILE_SIZE) / 2;
    
    if (state.status === GameStatus.Lost) {
      // Dark overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, GRID_WIDTH * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);
      
      // Explosion behind text
      ctx.globalAlpha = 0.3;
      this.drawExplosionBurst(centerX, centerY, 150);
      ctx.globalAlpha = 1;
      
      // "GAME OVER" text
      ctx.fillStyle = COLORS.explosionOuter;
      ctx.strokeStyle = COLORS.playerOutline;
      ctx.lineWidth = 5;
      ctx.font = 'bold 64px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText('GAME OVER', centerX, centerY - 20);
      ctx.fillText('GAME OVER', centerX, centerY - 20);
      
      // Restart instruction
      ctx.fillStyle = COLORS.hudText;
      ctx.font = '24px sans-serif';
      ctx.fillText('Press R to restart', centerX, centerY + 40);
    } else if (state.status === GameStatus.Won) {
      // Victory overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, GRID_WIDTH * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);
      
      // Stars around text
      ctx.fillStyle = COLORS.fuseYellow;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + this.animState.time;
        const starX = centerX + Math.cos(angle) * 120;
        const starY = centerY + Math.sin(angle) * 80;
        this.drawStar(starX, starY, 5, 15, 7);
      }
      
      // "VICTORY!" text
      ctx.fillStyle = COLORS.powerupRange;
      ctx.strokeStyle = COLORS.playerOutline;
      ctx.lineWidth = 5;
      ctx.font = 'bold 64px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText('VICTORY!', centerX, centerY - 20);
      ctx.fillText('VICTORY!', centerX, centerY - 20);
      
      // Next round instruction
      ctx.fillStyle = COLORS.hudText;
      ctx.font = '24px sans-serif';
      ctx.fillText('Press R for next round', centerX, centerY + 40);
    }
  }
}
