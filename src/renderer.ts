import { type GameState, TileType, GameStatus, PowerupType, type LevelTheme } from './types';
import { EXPLOSION_DURATION } from './constants';

// ── Theme-Based Color Palettes ─────────────────────────────────

interface ThemePalette {
  bgPrimary: string;
  bgSecondary: string;
  bgAccent: string;
  grassBase: string;
  grassDark: string;
  grassDetail: string;
  wallPrimary: string;
  wallDark: string;
  wallLight: string;
  wallDetail: string;
  cratePrimary: string;
  crateDark: string;
  crateDetail: string;
  glowColor: string;
  shadowColor: string;
  ambientLight: string;
  enemyColor: string;
  enemyGlow: string;
}

const THEME_PALETTES: Record<string, ThemePalette> = {
  garden: {
    bgPrimary: '#2d5a2d', bgSecondary: '#1a4a1a', bgAccent: '#4aa84a',
    grassBase: '#5dbf5d', grassDark: '#4aa84a', grassDetail: '#7dd87d',
    wallPrimary: '#6b7280', wallDark: '#4b5563', wallLight: '#9ca3af', wallDetail: '#374151',
    cratePrimary: '#a0826d', crateDark: '#7d5a47', crateDetail: '#c4a882',
    glowColor: '#ffd93d', shadowColor: 'rgba(0,50,0,0.3)', ambientLight: 'rgba(255,255,200,0.05)',
    enemyColor: '#ff5555', enemyGlow: 'rgba(255,85,85,0.3)',
  },
  dungeon: {
    bgPrimary: '#1a1a2e', bgSecondary: '#16213e', bgAccent: '#0f3460',
    grassBase: '#2a2a3e', grassDark: '#1e1e32', grassDetail: '#3a3a5e',
    wallPrimary: '#4a4a6a', wallDark: '#2a2a4a', wallLight: '#6a6a8a', wallDetail: '#1a1a3a',
    cratePrimary: '#5a4a3a', crateDark: '#3a2a1a', crateDetail: '#7a6a5a',
    glowColor: '#9b59b6', shadowColor: 'rgba(20,0,40,0.5)', ambientLight: 'rgba(155,89,182,0.03)',
    enemyColor: '#8e44ad', enemyGlow: 'rgba(142,68,173,0.4)',
  },
  lava: {
    bgPrimary: '#2d1a0a', bgSecondary: '#3d1a00', bgAccent: '#5a2d0a',
    grassBase: '#4a3020', grassDark: '#3a2010', grassDetail: '#5a4030',
    wallPrimary: '#5a3a2a', wallDark: '#3a2010', wallLight: '#7a5a4a', wallDetail: '#2a1000',
    cratePrimary: '#6a4a2a', crateDark: '#4a2a0a', crateDetail: '#8a6a4a',
    glowColor: '#ff4500', shadowColor: 'rgba(50,10,0,0.4)', ambientLight: 'rgba(255,69,0,0.05)',
    enemyColor: '#ff6347', enemyGlow: 'rgba(255,99,71,0.4)',
  },
  ice: {
    bgPrimary: '#0a1628', bgSecondary: '#0d1f3c', bgAccent: '#1a3a5c',
    grassBase: '#1a3050', grassDark: '#0a2040', grassDetail: '#2a4060',
    wallPrimary: '#4a7a9a', wallDark: '#2a5a7a', wallLight: '#7aaaca', wallDetail: '#1a4a6a',
    cratePrimary: '#3a6a8a', crateDark: '#2a5a7a', crateDetail: '#5a9aba',
    glowColor: '#00e5ff', shadowColor: 'rgba(0,20,50,0.4)', ambientLight: 'rgba(0,229,255,0.03)',
    enemyColor: '#1de9b6', enemyGlow: 'rgba(29,233,182,0.4)',
  },
  dark: {
    bgPrimary: '#0a0a0a', bgSecondary: '#0f0015', bgAccent: '#1a0030',
    grassBase: '#1a0a2a', grassDark: '#100020', grassDetail: '#2a1a3a',
    wallPrimary: '#3a2a4a', wallDark: '#1a0a2a', wallLight: '#5a4a6a', wallDetail: '#0a0020',
    cratePrimary: '#4a2a5a', crateDark: '#2a0a3a', crateDetail: '#6a4a7a',
    glowColor: '#ff0066', shadowColor: 'rgba(20,0,20,0.6)', ambientLight: 'rgba(255,0,102,0.03)',
    enemyColor: '#ff1744', enemyGlow: 'rgba(255,23,68,0.5)',
  },
};

// ── Fixed Color Constants (theme-independent) ────────────────

const FC = {
  playerBody: '#f8f8f0',
  playerOutline: '#2a2a2a',
  playerHelmet: '#ff6b6b',
  playerEye: '#2a2a2a',
  bombBody: '#1a1a1a',
  bombOutline: '#000',
  bombHighlight: '#3a3a3a',
  fuseOrange: '#ff6b35',
  fuseYellow: '#ffd93d',
  explosionCore: '#fff700',
  explosionMiddle: '#ffaa00',
  explosionOuter: '#ff4400',
  explosionRed: '#cc0000',
  powerupBomb: '#ff44ff',
  powerupRange: '#44ff44',
  powerupSpeed: '#44ddff',
  powerupOutline: '#2a2a2a',
  hudBg: 'rgba(0,0,0,0.75)',
  hudText: '#ffffff',
  hudIcon: '#ffd93d',
} as const;

// ── Floating Score Text ──────────────────────────────────────

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

// ── Animation State ──────────────────────────────────────────

interface AnimState {
  time: number;
  shakeX: number;
  shakeY: number;
}

// ── Renderer ─────────────────────────────────────────────────

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private anim: AnimState = { time: 0, shakeX: 0, shakeY: 0 };
  private lastPlayerPos = { x: 0, y: 0 };
  private floatingTexts: FloatingText[] = [];
  private lastScore = 0;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
  }

  // ── Main Render Entry Point ────────────────────────────────

  render(
    state: GameState,
    llmInfo?: {
      thinking: boolean;
      reasoning: string;
      model: string;
      reflecting?: boolean;
      reflectionMessage?: string;
      lessonCount?: number;
      customAgentEnabled?: boolean;
    },
    dt: number = 0.016,
  ): void {
    const ctx = this.ctx;
    const { tileSize, gridWidth, gridHeight, theme } = state.levelConfig;
    const palette = THEME_PALETTES[theme] ?? THEME_PALETTES.garden;
    const cw = gridWidth * tileSize;
    const ch = gridHeight * tileSize;

    this.anim.time += dt;
    this.updateShake(state);
    this.updateFloatingTexts(dt, state);

    ctx.save();
    ctx.translate(this.anim.shakeX, this.anim.shakeY);

    // Background fill
    ctx.fillStyle = palette.bgPrimary;
    ctx.fillRect(0, 0, cw, ch);

    // Render world layers
    this.renderGrid(state, palette, tileSize, gridWidth, gridHeight);
    this.renderAmbientLight(ctx, palette, cw, ch);
    this.renderPowerups(state, palette, tileSize);
    this.renderBombGlows(state, palette, tileSize);
    this.renderBombs(state, tileSize);
    this.renderExplosions(state, tileSize);
    this.renderEnemies(state, palette, tileSize);
    this.renderPlayer(state, tileSize);
    this.renderFloatingTexts(ctx);
    this.renderVignette(ctx, cw, ch, state.level);

    ctx.restore();

    // UI overlays (not affected by shake)
    this.renderHUD(state, palette, tileSize, gridWidth, llmInfo);
    if (llmInfo) this.renderLLMOverlay(llmInfo, state, palette);
    if (llmInfo?.reflecting) this.renderReflectionOverlay(llmInfo, state);
    this.renderGameStatus(state, tileSize, gridWidth, gridHeight);
  }

  // ── Screen Shake ───────────────────────────────────────────

  private updateShake(state: GameState): void {
    if (state.explosions.length > 0) {
      const intensity = Math.min(state.explosions.length * 2.5, 10);
      this.anim.shakeX = (Math.random() - 0.5) * intensity;
      this.anim.shakeY = (Math.random() - 0.5) * intensity;
    } else {
      this.anim.shakeX *= 0.8;
      this.anim.shakeY *= 0.8;
    }
  }

  // ── Floating Score Texts ───────────────────────────────────

  private updateFloatingTexts(dt: number, state: GameState): void {
    // Spawn new floating text on score change
    if (state.score > this.lastScore) {
      const diff = state.score - this.lastScore;
      const px = state.player.position.x;
      const py = state.player.position.y;
      this.floatingTexts.push({
        x: px + (Math.random() - 0.5) * 20,
        y: py - 20,
        text: `+${diff}`,
        color: diff >= 100 ? '#ffd700' : '#ffffff',
        life: 1.5,
        maxLife: 1.5,
      });
    }
    this.lastScore = state.score;

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 40 * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D): void {
    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  // ── Ambient Light Overlay ──────────────────────────────────

  private renderAmbientLight(
    ctx: CanvasRenderingContext2D,
    palette: ThemePalette,
    cw: number,
    ch: number,
  ): void {
    ctx.fillStyle = palette.ambientLight;
    ctx.fillRect(0, 0, cw, ch);
  }

  // ── Vignette Overlay ───────────────────────────────────────

  private renderVignette(
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    level: number,
  ): void {
    const intensity = 0.25 + (level - 1) * 0.1;
    const cx = cw / 2;
    const cy = ch / 2;
    const radius = Math.max(cw, ch) * 0.7;
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${Math.min(intensity, 0.7)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);
  }

  // ── Grid Rendering ─────────────────────────────────────────

  private renderGrid(
    state: GameState,
    palette: ThemePalette,
    ts: number,
    gw: number,
    gh: number,
  ): void {
    for (let row = 0; row < gh; row++) {
      for (let col = 0; col < gw; col++) {
        const x = col * ts;
        const y = row * ts;
        const tile = state.grid[row]?.[col] ?? TileType.Empty;
        switch (tile) {
          case TileType.Empty:
            this.drawFloorTile(x, y, ts, row, col, palette, state.levelConfig.theme);
            break;
          case TileType.Wall:
            this.drawWallTile(x, y, ts, palette);
            break;
          case TileType.DestructibleWall:
            this.drawCrateTile(x, y, ts, palette);
            break;
        }
      }
    }
  }

  // ── Floor Tile (theme-specific animated details) ───────────

  private drawFloorTile(
    x: number,
    y: number,
    ts: number,
    row: number,
    col: number,
    palette: ThemePalette,
    theme: LevelTheme | string,
  ): void {
    const ctx = this.ctx;
    const t = this.anim.time;

    // Base fill
    ctx.fillStyle = palette.grassBase;
    ctx.fillRect(x, y, ts, ts);

    // Checkerboard subtle variation
    if ((row + col) % 2 === 0) {
      ctx.fillStyle = palette.grassDark;
      ctx.fillRect(x, y, ts, ts);
    }

    // Subtle grid line
    ctx.strokeStyle = palette.shadowColor;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, ts, ts);

    // Theme-specific animated details
    const seed = row * 137 + col * 251;
    const hash = (seed * 2654435761) >>> 0;
    const frac = (hash & 0xffff) / 0xffff;

    if (frac > 0.65) {
      switch (theme) {
        case 'garden':
          this.drawFlowerDetail(ctx, x, y, ts, seed, t, palette);
          break;
        case 'dungeon':
          this.drawTorchDetail(ctx, x, y, ts, seed, t, palette);
          break;
        case 'lava':
          this.drawLavaCrack(ctx, x, y, ts, seed, t, palette);
          break;
        case 'ice':
          this.drawIceSparkle(ctx, x, y, ts, seed, t, palette);
          break;
        case 'dark':
          this.drawNeonRune(ctx, x, y, ts, seed, t, palette);
          break;
      }
    }
  }

  private drawFlowerDetail(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, ts: number,
    seed: number, t: number, _palette: ThemePalette,
  ): void {
    const fx = x + (seed % 7 + 4) * (ts / 14);
    const fy = y + ((seed * 3) % 7 + 4) * (ts / 14);
    const sway = Math.sin(t * 1.5 + seed) * 2;
    const colors = ['#ff6b9d', '#ffeb3b', '#ff5722', '#e91e63', '#ffffff'];
    const c = colors[seed % colors.length];

    // Stem
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fx, fy + 4);
    ctx.lineTo(fx + sway, fy - 4);
    ctx.stroke();

    // Petals
    ctx.fillStyle = c;
    for (let p = 0; p < 5; p++) {
      const angle = (p / 5) * Math.PI * 2 + t * 0.3;
      const px = fx + sway + Math.cos(angle) * 3;
      const py = fy - 4 + Math.sin(angle) * 3;
      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center
    ctx.fillStyle = '#fff176';
    ctx.beginPath();
    ctx.arc(fx + sway, fy - 4, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawTorchDetail(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, ts: number,
    seed: number, t: number, palette: ThemePalette,
  ): void {
    const tx = x + ts * 0.5;
    const ty = y + ts * 0.6;
    const flicker = Math.sin(t * 8 + seed * 3) * 0.4 + 0.6;

    // Bracket
    ctx.fillStyle = palette.wallDetail;
    ctx.fillRect(tx - 1.5, ty, 3, ts * 0.3);

    // Flame glow
    ctx.save();
    ctx.globalAlpha = 0.25 * flicker;
    const grad = ctx.createRadialGradient(tx, ty - 2, 0, tx, ty - 2, ts * 0.35);
    grad.addColorStop(0, '#ff9800');
    grad.addColorStop(1, 'rgba(255,152,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(tx, ty - 2, ts * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Flame
    ctx.fillStyle = `rgba(255,${140 + Math.floor(flicker * 60)},0,${0.7 + flicker * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(tx - 3, ty);
    ctx.quadraticCurveTo(tx - 1, ty - 8 * flicker, tx, ty - 10 * flicker);
    ctx.quadraticCurveTo(tx + 1, ty - 8 * flicker, tx + 3, ty);
    ctx.fill();
  }

  private drawLavaCrack(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, ts: number,
    seed: number, t: number, _palette: ThemePalette,
  ): void {
    const glow = 0.4 + Math.sin(t * 2 + seed) * 0.3;
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.strokeStyle = '#ff4500';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#ff4500';
    ctx.shadowBlur = 6;

    const sx = x + (seed % 5 + 2) * (ts / 9);
    const sy = y + ((seed * 7) % 5 + 2) * (ts / 9);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + ts * 0.2, sy + ts * 0.15);
    ctx.lineTo(sx + ts * 0.35, sy + ts * 0.05);
    ctx.stroke();

    // Ember dot
    if (Math.sin(t * 4 + seed * 2) > 0.6) {
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(sx + ts * 0.1, sy + ts * 0.08, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawIceSparkle(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, ts: number,
    seed: number, t: number, _palette: ThemePalette,
  ): void {
    const sparkle = Math.sin(t * 3 + seed * 1.7) * 0.5 + 0.5;
    if (sparkle < 0.3) return;

    const sx = x + (seed % 7 + 2) * (ts / 11);
    const sy = y + ((seed * 3) % 7 + 2) * (ts / 11);
    const sz = 2 + sparkle * 2;

    ctx.save();
    ctx.globalAlpha = sparkle * 0.8;
    ctx.fillStyle = '#e0f7fa';
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 0.5;

    // Diamond sparkle shape
    ctx.beginPath();
    ctx.moveTo(sx, sy - sz);
    ctx.lineTo(sx + sz * 0.6, sy);
    ctx.lineTo(sx, sy + sz);
    ctx.lineTo(sx - sz * 0.6, sy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawNeonRune(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, ts: number,
    seed: number, t: number, palette: ThemePalette,
  ): void {
    const pulse = Math.sin(t * 2 + seed * 0.5) * 0.5 + 0.5;
    if (pulse < 0.2) return;

    const cx = x + ts * 0.5;
    const cy = y + ts * 0.5;
    const r = ts * 0.25;
    const runeType = seed % 4;

    ctx.save();
    ctx.globalAlpha = pulse * 0.6;
    ctx.strokeStyle = palette.glowColor;
    ctx.shadowColor = palette.glowColor;
    ctx.shadowBlur = 8 * pulse;
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    switch (runeType) {
      case 0: // Circle rune
        ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
        ctx.moveTo(cx - r * 0.3, cy);
        ctx.lineTo(cx + r * 0.3, cy);
        break;
      case 1: // Triangle rune
        ctx.moveTo(cx, cy - r * 0.5);
        ctx.lineTo(cx + r * 0.45, cy + r * 0.35);
        ctx.lineTo(cx - r * 0.45, cy + r * 0.35);
        ctx.closePath();
        break;
      case 2: // Cross rune
        ctx.moveTo(cx, cy - r * 0.5);
        ctx.lineTo(cx, cy + r * 0.5);
        ctx.moveTo(cx - r * 0.5, cy);
        ctx.lineTo(cx + r * 0.5, cy);
        break;
      case 3: // Diamond rune
        ctx.moveTo(cx, cy - r * 0.5);
        ctx.lineTo(cx + r * 0.4, cy);
        ctx.lineTo(cx, cy + r * 0.5);
        ctx.lineTo(cx - r * 0.4, cy);
        ctx.closePath();
        break;
    }
    ctx.stroke();
    ctx.restore();
  }

  // ── Wall Tile ──────────────────────────────────────────────

  private drawWallTile(x: number, y: number, ts: number, palette: ThemePalette): void {
    const ctx = this.ctx;
    const bevel = Math.max(2, ts * 0.07);

    // Main fill
    ctx.fillStyle = palette.wallPrimary;
    ctx.fillRect(x, y, ts, ts);

    // 3D highlight (top-left)
    ctx.fillStyle = palette.wallLight;
    ctx.fillRect(x, y, ts, bevel);
    ctx.fillRect(x, y, bevel, ts);

    // 3D shadow (bottom-right)
    ctx.fillStyle = palette.wallDark;
    ctx.fillRect(x, y + ts - bevel, ts, bevel);
    ctx.fillRect(x + ts - bevel, y, bevel, ts);

    // Inner brick lines
    ctx.strokeStyle = palette.wallDetail;
    ctx.lineWidth = 2;
    const inset = ts * 0.12;
    ctx.strokeRect(x + inset, y + inset, ts - inset * 2, ts - inset * 2);

    // Mortar cross
    ctx.strokeStyle = palette.wallDark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + ts * 0.5, y + inset);
    ctx.lineTo(x + ts * 0.5, y + ts - inset);
    ctx.moveTo(x + inset, y + ts * 0.5);
    ctx.lineTo(x + ts - inset, y + ts * 0.5);
    ctx.stroke();

    // Cartoon outline
    ctx.strokeStyle = FC.playerOutline;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, ts, ts);
  }

  // ── Crate Tile ─────────────────────────────────────────────

  private drawCrateTile(x: number, y: number, ts: number, palette: ThemePalette): void {
    const ctx = this.ctx;
    const pad = Math.max(2, ts * 0.05);

    // Crate base
    ctx.fillStyle = palette.cratePrimary;
    ctx.fillRect(x + pad, y + pad, ts - pad * 2, ts - pad * 2);

    // Plank stripes
    ctx.fillStyle = palette.crateDetail;
    const stripeCount = 3;
    const stripeH = (ts - pad * 4) / (stripeCount * 2);
    for (let i = 0; i < stripeCount; i++) {
      const sy = y + pad * 2 + i * stripeH * 2;
      ctx.fillRect(x + pad * 2, sy, ts - pad * 4, stripeH);
    }

    // Cross beams
    ctx.strokeStyle = palette.crateDark;
    ctx.lineWidth = Math.max(2, ts * 0.06);
    ctx.beginPath();
    ctx.moveTo(x + pad * 2, y + pad * 2);
    ctx.lineTo(x + ts - pad * 2, y + ts - pad * 2);
    ctx.moveTo(x + ts - pad * 2, y + pad * 2);
    ctx.lineTo(x + pad * 2, y + ts - pad * 2);
    ctx.stroke();

    // Nails at corners
    ctx.fillStyle = '#ccc';
    const nd = pad * 3;
    for (const [nx, ny] of [[x + nd, y + nd], [x + ts - nd, y + nd], [x + nd, y + ts - nd], [x + ts - nd, y + ts - nd]]) {
      ctx.beginPath();
      ctx.arc(nx, ny, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outline
    ctx.strokeStyle = FC.playerOutline;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + pad, y + pad, ts - pad * 2, ts - pad * 2);
  }

  // ── Powerup Rendering ──────────────────────────────────────

  private renderPowerups(state: GameState, _palette: ThemePalette, ts: number): void {
    const ctx = this.ctx;
    const t = this.anim.time;
    const bounce = Math.sin(t * 3) * 3;

    for (const pu of state.powerups) {
      const cx = pu.position.col * ts + ts / 2;
      const cy = pu.position.row * ts + ts / 2 + bounce;
      const color =
        pu.type === PowerupType.BiggerRange ? FC.powerupRange :
        pu.type === PowerupType.Speed ? FC.powerupSpeed :
        FC.powerupBomb;

      // Radial glow
      ctx.save();
      ctx.globalAlpha = 0.25 + Math.sin(t * 4) * 0.1;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, ts * 0.45);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, ts * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Main disc
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, ts * 0.28, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(cx - ts * 0.06, cy - ts * 0.08, ts * 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Outline
      ctx.strokeStyle = FC.powerupOutline;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, ts * 0.28, 0, Math.PI * 2);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(12, ts * 0.35)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = pu.type === PowerupType.ExtraBomb ? 'B'
                  : pu.type === PowerupType.BiggerRange ? 'R' : 'S';
      ctx.fillText(label, cx, cy + 1);
    }
  }

  // ── Bomb Glow (dynamic, intensifies as timer decreases) ───

  private renderBombGlows(state: GameState, palette: ThemePalette, ts: number): void {
    const ctx = this.ctx;
    const bombTimer = state.levelConfig.bombTimer;

    for (const bomb of state.bombs) {
      const cx = bomb.position.col * ts + ts / 2;
      const cy = bomb.position.row * ts + ts / 2;
      const urgency = 1 - bomb.timer / bombTimer;
      const glowRadius = ts * (0.6 + urgency * 0.8);
      const alpha = 0.08 + urgency * 0.2;

      ctx.save();
      ctx.globalAlpha = alpha;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
      grad.addColorStop(0, palette.glowColor);
      grad.addColorStop(0.5, FC.explosionOuter + '40');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Bomb Rendering ─────────────────────────────────────────

  private renderBombs(state: GameState, ts: number): void {
    const ctx = this.ctx;
    const t = this.anim.time;
    const bombTimer = state.levelConfig.bombTimer;

    for (const bomb of state.bombs) {
      const cx = bomb.position.col * ts + ts / 2;
      const cy = bomb.position.row * ts + ts / 2;
      const timeRatio = bomb.timer / bombTimer;
      const urgency = 1 - timeRatio;
      const pulseSpeed = 6 + urgency * 14;
      const pulse = 1 + urgency * 0.2 * Math.sin(t * pulseSpeed);
      const radius = ts * 0.32 * pulse;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(cx + 2, cy + radius + 3, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = FC.bombBody;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = FC.bombHighlight;
      ctx.beginPath();
      ctx.arc(cx - radius * 0.3, cy - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Urgent red tint
      if (urgency > 0.6) {
        ctx.save();
        ctx.globalAlpha = (urgency - 0.6) * 1.5;
        ctx.fillStyle = '#cc000060';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Outline
      ctx.strokeStyle = FC.bombOutline;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Fuse stem
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx + radius * 0.3, cy - radius * 0.85);
      ctx.quadraticCurveTo(cx + radius * 0.6, cy - radius * 1.3, cx + radius * 0.1, cy - radius * 1.35);
      ctx.stroke();

      // Fuse spark
      const sparkSize = 2.5 + Math.random() * 3;
      const sparkColor = Math.random() > 0.5 ? FC.fuseYellow : FC.fuseOrange;
      ctx.fillStyle = sparkColor;
      ctx.beginPath();
      ctx.arc(cx + radius * 0.1, cy - radius * 1.35, sparkSize, 0, Math.PI * 2);
      ctx.fill();

      // Spark glow
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = FC.fuseYellow;
      ctx.beginPath();
      ctx.arc(cx + radius * 0.1, cy - radius * 1.35, sparkSize * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Explosion Rendering (with radial glow) ────────────────

  private renderExplosions(state: GameState, ts: number): void {
    const ctx = this.ctx;

    for (const exp of state.explosions) {
      const cx = exp.position.col * ts + ts / 2;
      const cy = exp.position.row * ts + ts / 2;
      const fade = exp.timer / EXPLOSION_DURATION;
      const scale = 0.8 + fade * 0.3;
      const seed = exp.position.row * 100 + exp.position.col;
      const rot = (seed % 8) * Math.PI / 4;

      // Radial glow behind explosion
      ctx.save();
      ctx.globalAlpha = fade * 0.5;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, ts * 0.9);
      grad.addColorStop(0, FC.explosionCore);
      grad.addColorStop(0.4, FC.explosionOuter + '80');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, ts * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Star burst
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot + this.anim.time * 2);
      ctx.globalAlpha = fade;
      this.drawExplosionBurst(0, 0, ts * 0.5 * scale);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  private drawExplosionBurst(x: number, y: number, size: number): void {
    const ctx = this.ctx;

    ctx.fillStyle = FC.explosionRed;
    this.drawStar(x, y, 8, size, size * 0.6);

    ctx.fillStyle = FC.explosionOuter;
    this.drawStar(x, y, 8, size * 0.8, size * 0.5);

    ctx.fillStyle = FC.explosionMiddle;
    this.drawStar(x, y, 8, size * 0.6, size * 0.35);

    ctx.fillStyle = FC.explosionCore;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawStar(x: number, y: number, points: number, outer: number, inner: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i * Math.PI) / points - Math.PI / 2;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  // ── Player Rendering ───────────────────────────────────────

  private renderPlayer(state: GameState, ts: number): void {
    const ctx = this.ctx;
    const player = state.player;
    if (!player.alive) return;

    const px = player.position.x;
    const py = player.position.y;
    const dx = px - this.lastPlayerPos.x;
    const dy = py - this.lastPlayerPos.y;
    const moving = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5;
    const bob = moving ? Math.sin(this.anim.time * 10) * 2 : 0;
    this.lastPlayerPos = { x: px, y: py };

    const bodyR = ts * 0.35;
    const eyeScale = Math.min(1, ts / 50);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(px, py + bodyR + 3, bodyR * 0.7, bodyR * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body glow (subtle)
    ctx.save();
    ctx.globalAlpha = 0.15;
    const glow = ctx.createRadialGradient(px, py + bob, bodyR * 0.3, px, py + bob, bodyR * 1.5);
    glow.addColorStop(0, '#ffffff');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px, py + bob, bodyR * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body
    ctx.fillStyle = FC.playerBody;
    ctx.beginPath();
    ctx.arc(px, py + bob, bodyR, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = FC.playerOutline;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Helmet dome
    ctx.fillStyle = FC.playerHelmet;
    ctx.beginPath();
    ctx.arc(px, py + bob - bodyR * 0.6, bodyR * 0.5, 0, Math.PI, true);
    ctx.fill();
    ctx.strokeStyle = FC.playerOutline;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Antenna tip
    ctx.fillStyle = FC.fuseYellow;
    ctx.beginPath();
    ctx.arc(px, py + bob - bodyR * 1.1, 3.5 * eyeScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = FC.playerOutline;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Eyes
    const eyeY = py + bob - 4 * eyeScale;
    const eyeSpacing = 8 * eyeScale;
    const eyeR = 5 * eyeScale;
    const pupilR = 2.5 * eyeScale;

    // Eye whites
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(px - eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
    ctx.arc(px + eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = FC.playerOutline;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pupils (look toward movement)
    const lookX = moving ? Math.sign(dx) * 1.5 : 0;
    const lookY = moving ? Math.sign(dy) * 0.8 : 0;
    ctx.fillStyle = FC.playerEye;
    ctx.beginPath();
    ctx.arc(px - eyeSpacing + lookX, eyeY + lookY, pupilR, 0, Math.PI * 2);
    ctx.arc(px + eyeSpacing + lookX, eyeY + lookY, pupilR, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(px - eyeSpacing + 1.5, eyeY - 1, 1.2 * eyeScale, 0, Math.PI * 2);
    ctx.arc(px + eyeSpacing + 1.5, eyeY - 1, 1.2 * eyeScale, 0, Math.PI * 2);
    ctx.fill();

    // Feet when moving
    if (moving) {
      const step = Math.sin(this.anim.time * 10) > 0 ? -1 : 1;
      ctx.fillStyle = FC.playerOutline;
      ctx.beginPath();
      ctx.ellipse(px - 7 * eyeScale, py + bodyR - 1, 4.5 * eyeScale, 2.5 * eyeScale, 0, 0, Math.PI * 2);
      ctx.ellipse(px + 7 * eyeScale, py + bodyR - 1 + step, 4.5 * eyeScale, 2.5 * eyeScale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Enemy Rendering ────────────────────────────────────────

  private renderEnemies(state: GameState, palette: ThemePalette, ts: number): void {
    if (!state.enemies || !Array.isArray(state.enemies)) return;
    const ctx = this.ctx;
    const t = this.anim.time;
    const eyeScale = Math.min(1, ts / 50);

    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      const ex = enemy.position.x;
      const ey = enemy.position.y;
      const bounce = Math.sin(t * 6 + enemy.id) * 3;
      const bodyR = ts * 0.32;

      // Enemy glow
      ctx.save();
      ctx.globalAlpha = 0.15 + Math.sin(t * 3 + enemy.id) * 0.05;
      const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, bodyR * 2);
      grad.addColorStop(0, palette.enemyGlow);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ex, ey, bodyR * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(ex, ey + bodyR + 3, bodyR * 0.7, bodyR * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = palette.enemyColor;
      ctx.beginPath();
      ctx.arc(ex, ey + bounce, bodyR, 0, Math.PI * 2);
      ctx.fill();

      // Body highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(ex - bodyR * 0.2, ey + bounce - bodyR * 0.25, bodyR * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Outline
      ctx.strokeStyle = FC.playerOutline;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ex, ey + bounce, bodyR, 0, Math.PI * 2);
      ctx.stroke();

      // Wavy bottom tentacles
      ctx.fillStyle = palette.enemyColor;
      const tentacles = 4;
      for (let i = 0; i < tentacles; i++) {
        const tx = ex - bodyR * 0.6 + (i / (tentacles - 1)) * bodyR * 1.2;
        const tWave = Math.sin(t * 5 + i * 1.5 + enemy.id) * 3;
        ctx.beginPath();
        ctx.moveTo(tx - 3, ey + bounce + bodyR * 0.7);
        ctx.quadraticCurveTo(tx + tWave, ey + bounce + bodyR * 1.2, tx + 3, ey + bounce + bodyR * 0.7);
        ctx.fill();
      }

      // Eyes (angry)
      const eEyeY = ey + bounce - 4 * eyeScale;
      const eSpacing = 7 * eyeScale;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex - eSpacing, eEyeY, 4.5 * eyeScale, 0, Math.PI * 2);
      ctx.arc(ex + eSpacing, eEyeY, 4.5 * eyeScale, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(ex - eSpacing, eEyeY + 1, 2.2 * eyeScale, 0, Math.PI * 2);
      ctx.arc(ex + eSpacing, eEyeY + 1, 2.2 * eyeScale, 0, Math.PI * 2);
      ctx.fill();

      // Angry eyebrows
      ctx.strokeStyle = FC.playerOutline;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex - eSpacing - 4, eEyeY - 5 * eyeScale);
      ctx.lineTo(ex - eSpacing + 3, eEyeY - 3 * eyeScale);
      ctx.moveTo(ex + eSpacing + 4, eEyeY - 5 * eyeScale);
      ctx.lineTo(ex + eSpacing - 3, eEyeY - 3 * eyeScale);
      ctx.stroke();
    }
  }

  // ── HUD Rendering ──────────────────────────────────────────

  private renderHUD(
    state: GameState,
    palette: ThemePalette,
    ts: number,
    gw: number,
    llmInfo?: {
      thinking: boolean;
      reasoning: string;
      model: string;
      reflecting?: boolean;
      reflectionMessage?: string;
      lessonCount?: number;
      customAgentEnabled?: boolean;
    },
  ): void {
    const ctx = this.ctx;
    const cw = gw * ts;
    const barH = 36;

    // HUD bar background
    ctx.fillStyle = FC.hudBg;
    ctx.fillRect(0, 0, cw, barH);

    // Accent line
    ctx.fillStyle = palette.glowColor;
    ctx.fillRect(0, barH - 2, cw, 2);

    ctx.font = 'bold 14px sans-serif';
    ctx.textBaseline = 'middle';
    const cy = barH / 2;
    let cursor = 10;

    // Lives ❤️
    ctx.fillStyle = '#ff4444';
    for (let i = 0; i < state.lives; i++) {
      ctx.fillText('❤️', cursor, cy);
      cursor += 20;
    }
    cursor += 8;

    // Separator
    ctx.fillStyle = '#666';
    ctx.fillText('|', cursor, cy);
    cursor += 14;

    // Score
    ctx.fillStyle = FC.hudIcon;
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${state.score}`, cursor, cy);
    cursor += ctx.measureText(`SCORE: ${state.score}`).width + 14;

    // Separator
    ctx.fillStyle = '#666';
    ctx.fillText('|', cursor, cy);
    cursor += 14;

    // Level name
    ctx.fillStyle = palette.glowColor;
    const levelText = `LEVEL ${state.level}: ${state.levelConfig.name}`;
    ctx.fillText(levelText, cursor, cy);
    cursor += ctx.measureText(levelText).width + 14;

    // Separator
    ctx.fillStyle = '#666';
    ctx.fillText('|', cursor, cy);
    cursor += 14;

    // Stats: bombs, range, timer
    ctx.fillStyle = FC.hudText;
    const stats = `💣×${state.player.bombCount} 🔥×${state.player.bombRange} ⚡×${Math.floor(state.timer)}`;
    ctx.fillText(stats, cursor, cy);
    cursor += ctx.measureText(stats).width + 14;

    // Custom Agent badge (right side of HUD)
    if (llmInfo?.customAgentEnabled) {
      const badgeText = `🧠 LEARNING${llmInfo.lessonCount ? ` (${llmInfo.lessonCount})` : ''}`;
      const badgeW = ctx.measureText(badgeText).width + 20;
      const badgeX = cw - badgeW - 8;
      const badgeY = 4;
      const badgeH = barH - 8;

      // Pulsing glow background
      const pulse = Math.sin(this.anim.time * 2.5) * 0.15 + 0.85;
      ctx.fillStyle = `rgba(0, 255, 200, ${0.12 * pulse})`;
      ctx.beginPath();
      this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 4);
      ctx.fill();

      ctx.strokeStyle = `rgba(0, 255, 200, ${0.5 * pulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 4);
      ctx.stroke();

      ctx.fillStyle = `rgba(0, 255, 200, ${pulse})`;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(badgeText, badgeX + 10, cy);
    }
  }

  // ── LLM Overlay (with pulsing border) ─────────────────────

  private renderLLMOverlay(
    llmInfo: {
      thinking: boolean;
      reasoning: string;
      model: string;
      reflecting?: boolean;
      reflectionMessage?: string;
      lessonCount?: number;
      customAgentEnabled?: boolean;
    },
    state: GameState,
    palette: ThemePalette,
  ): void {
    const ctx = this.ctx;
    const cw = state.levelConfig.gridWidth * state.levelConfig.tileSize;
    const panelW = Math.min(300, cw - 20);
    const panelH = 130;
    const px = cw - panelW - 10;
    const py = 46;

    // Panel background
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.beginPath();
    this.roundRect(ctx, px, py, panelW, panelH, 6);
    ctx.fill();

    // Border (pulsing when thinking)
    if (llmInfo.thinking) {
      const pulse = Math.sin(this.anim.time * 4) * 0.4 + 0.6;
      ctx.strokeStyle = `rgba(0,255,255,${pulse})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 8 * pulse;
    } else {
      ctx.strokeStyle = palette.glowColor + '80';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 0;
    }
    ctx.beginPath();
    this.roundRect(ctx, px, py, panelW, panelH, 6);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Title
    ctx.fillStyle = llmInfo.thinking ? '#0ff' : '#fff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const title = llmInfo.thinking ? '🤖 AI THINKING...' : '🤖 AI PLAYING';
    ctx.fillText(title, px + 10, py + 10);

    // Thinking spinner dots
    if (llmInfo.thinking) {
      const dots = '●'.repeat(Math.floor(this.anim.time * 3) % 4);
      ctx.fillStyle = '#0ff';
      ctx.fillText(dots, px + ctx.measureText(title).width + 16, py + 10);
    }

    // Model name + lesson count badge when custom agent enabled
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.fillText(llmInfo.model, px + 10, py + 28);

    if (llmInfo.customAgentEnabled && llmInfo.lessonCount !== undefined) {
      const lessonBadge = `🧠 ${llmInfo.lessonCount}`;
      const modelW = ctx.measureText(llmInfo.model).width;
      ctx.fillStyle = '#0ff';
      ctx.font = '10px monospace';
      ctx.fillText(lessonBadge, px + 10 + modelW + 10, py + 28);
    }

    // Divider
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(px + 10, py + 42);
    ctx.lineTo(px + panelW - 10, py + 42);
    ctx.stroke();

    // Reasoning text
    ctx.fillStyle = '#ccc';
    ctx.font = '11px monospace';
    const reasoning = llmInfo.reasoning || 'Analyzing game state...';
    this.wrapText(ctx, reasoning, px + 10, py + 50, panelW - 20, 14, 5);
  }

  // ── Reflection Overlay (death analysis) ────────────────────

  private renderReflectionOverlay(
    llmInfo: {
      reflecting?: boolean;
      reflectionMessage?: string;
      lessonCount?: number;
    },
    state: GameState,
  ): void {
    const ctx = this.ctx;
    const cw = state.levelConfig.gridWidth * state.levelConfig.tileSize;
    const ch = state.levelConfig.gridHeight * state.levelConfig.tileSize;
    const cx = cw / 2;
    const cy = ch / 2;
    const t = this.anim.time;

    // Full-screen dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
    ctx.fillRect(0, 0, cw, ch);

    // Scan-line effect
    ctx.save();
    ctx.globalAlpha = 0.04;
    for (let y = 0; y < ch; y += 3) {
      ctx.fillStyle = '#0ff';
      ctx.fillRect(0, y, cw, 1);
    }
    ctx.restore();

    // Center panel
    const panelW = Math.min(420, cw - 60);
    const panelH = 280;
    const px = cx - panelW / 2;
    const py = cy - panelH / 2;

    // Panel background
    ctx.fillStyle = 'rgba(5, 8, 20, 0.95)';
    ctx.beginPath();
    this.roundRect(ctx, px, py, panelW, panelH, 10);
    ctx.fill();

    // Neon border with pulsing glow
    const borderPulse = Math.sin(t * 2.5) * 0.4 + 0.6;
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15 * borderPulse;
    ctx.strokeStyle = `rgba(0, 255, 255, ${borderPulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.roundRect(ctx, px, py, panelW, panelH, 10);
    ctx.stroke();

    // Second border layer (purple accent)
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 10 * borderPulse;
    ctx.strokeStyle = `rgba(168, 85, 247, ${borderPulse * 0.4})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    this.roundRect(ctx, px - 3, py - 3, panelW + 6, panelH + 6, 12);
    ctx.stroke();
    ctx.restore();

    // Pulsing brain icon
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const brainPulse = Math.sin(t * 3) * 0.2 + 1;
    const brainGlow = Math.sin(t * 2) * 0.3 + 0.7;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 20 * brainGlow;
    ctx.font = `${Math.floor(36 * brainPulse)}px sans-serif`;
    ctx.fillText('🧠', cx, py + 40);
    ctx.restore();

    // Title: "ANALYZING DEATH..." with animated dots
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12 + Math.sin(t * 3) * 6;
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 20px monospace';
    const dotCount = Math.floor(t * 2) % 4;
    const titleDots = '.'.repeat(dotCount);
    ctx.fillText(`ANALYZING DEATH${titleDots}`, cx, py + 75);
    ctx.restore();

    // Divider line
    const divY = py + 95;
    const gradLine = ctx.createLinearGradient(px + 20, divY, px + panelW - 20, divY);
    gradLine.addColorStop(0, 'rgba(0,255,255,0)');
    gradLine.addColorStop(0.5, 'rgba(0,255,255,0.6)');
    gradLine.addColorStop(1, 'rgba(0,255,255,0)');
    ctx.strokeStyle = gradLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 20, divY);
    ctx.lineTo(px + panelW - 20, divY);
    ctx.stroke();

    // Reflection text area
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '13px monospace';
    const message = llmInfo.reflectionMessage || 'Processing...';

    // Typing effect: reveal characters based on time
    const charsRevealed = Math.min(message.length, Math.floor(t * 40) % (message.length + 60));
    const displayText = message.substring(0, charsRevealed);

    ctx.fillStyle = '#ddd';
    this.wrapText(ctx, displayText, px + 20, py + 110, panelW - 40, 18, 7);

    // Blinking cursor at end of text
    if (Math.floor(t * 3) % 2 === 0) {
      ctx.fillStyle = '#0ff';
      ctx.fillText('▌', px + 20 + (ctx.measureText(displayText.split('\n').pop() || '').width % (panelW - 40)), py + 110 + 18 * Math.min(6, Math.floor(displayText.length / 40)));
    }

    // Bottom section: lesson counter
    const bottomY = py + panelH - 40;

    // Divider
    const gradLine2 = ctx.createLinearGradient(px + 20, bottomY - 10, px + panelW - 20, bottomY - 10);
    gradLine2.addColorStop(0, 'rgba(168,85,247,0)');
    gradLine2.addColorStop(0.5, 'rgba(168,85,247,0.4)');
    gradLine2.addColorStop(1, 'rgba(168,85,247,0)');
    ctx.strokeStyle = gradLine2;
    ctx.beginPath();
    ctx.moveTo(px + 20, bottomY - 10);
    ctx.lineTo(px + panelW - 20, bottomY - 10);
    ctx.stroke();

    // Lesson counter
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 14px monospace';
    const lessonCount = llmInfo.lessonCount ?? 0;
    ctx.fillText(`📚 Lessons Learned: ${lessonCount}`, cx, bottomY + 8);
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
  ): void {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines = 999,
  ): void {
    const words = text.split(' ');
    let line = '';
    let cy = y;
    let count = 0;

    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxWidth && line !== '') {
        ctx.fillText(line, x, cy);
        line = word + ' ';
        cy += lineHeight;
        count++;
        if (count >= maxLines) return;
      } else {
        line = test;
      }
    }
    if (count < maxLines) ctx.fillText(line, x, cy);
  }

  // ── Game Status Overlays ───────────────────────────────────

  private renderGameStatus(
    state: GameState,
    ts: number,
    gw: number,
    gh: number,
  ): void {
    const ctx = this.ctx;
    const cw = gw * ts;
    const ch = gh * ts;
    const cx = cw / 2;
    const cy = ch / 2;
    const fontSize = Math.min(64, cw * 0.08);
    const subSize = Math.min(24, cw * 0.03);

    if (state.status === GameStatus.Lost) {
      // Dark overlay
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, cw, ch);

      // Fire glow behind text
      ctx.save();
      ctx.globalAlpha = 0.4;
      const fireGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cw * 0.35);
      fireGrad.addColorStop(0, '#ff4400');
      fireGrad.addColorStop(0.5, '#cc000060');
      fireGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fireGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, cw * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Explosion burst
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.translate(cx, cy);
      ctx.rotate(this.anim.time * 0.5);
      this.drawExplosionBurst(0, 0, 120);
      ctx.restore();

      // "GAME OVER" with fire glow
      ctx.save();
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 20 + Math.sin(this.anim.time * 3) * 8;
      ctx.fillStyle = FC.explosionOuter;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText('GAME OVER', cx, cy - 20);
      ctx.fillText('GAME OVER', cx, cy - 20);
      ctx.restore();

      // Score
      ctx.fillStyle = FC.hudIcon;
      ctx.font = `bold ${subSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`Final Score: ${state.score}`, cx, cy + 25);

      // Restart
      ctx.fillStyle = '#aaa';
      ctx.font = `${subSize * 0.85}px sans-serif`;
      ctx.fillText('Press R to restart', cx, cy + 55);

    } else if (state.status === GameStatus.Won) {
      // Victory overlay
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, cw, ch);

      // Golden glow
      ctx.save();
      ctx.globalAlpha = 0.3;
      const goldGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cw * 0.4);
      goldGrad.addColorStop(0, '#ffd700');
      goldGrad.addColorStop(0.5, '#ffaa0040');
      goldGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = goldGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, cw * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Orbiting stars
      ctx.fillStyle = FC.fuseYellow;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + this.anim.time * 0.8;
        const orbit = 80 + Math.sin(this.anim.time * 2 + i) * 20;
        const sx = cx + Math.cos(angle) * orbit * 1.4;
        const sy = cy + Math.sin(angle) * orbit * 0.8;
        const starSize = 8 + Math.sin(this.anim.time * 3 + i * 2) * 4;
        this.drawStar(sx, sy, 5, starSize, starSize * 0.4);
      }

      // "VICTORY!" with golden glow
      ctx.save();
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 25 + Math.sin(this.anim.time * 2) * 10;
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText('VICTORY!', cx, cy - 20);
      ctx.fillText('VICTORY!', cx, cy - 20);
      ctx.restore();

      // Score
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${subSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`Score: ${state.score}`, cx, cy + 25);

      // Next round
      ctx.fillStyle = '#ccc';
      ctx.font = `${subSize * 0.85}px sans-serif`;
      ctx.fillText('Press R for next round', cx, cy + 55);
    }
  }
}
