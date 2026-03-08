import type { GameMode, LevelConfig, LLMConfig, InputAction } from './types';
import { LEVEL_CONFIGS, LLM_MODELS, LLM_API_ENDPOINT } from './constants';
import { LLMPlayer } from './llm-player';

export class MenuSystem {
  private mode: GameMode;
  private selectedIndex: number = 0;
  private selectedLevel: number = 0;
  private selectedModelIndex: number = 0;
  private soundEnabled: boolean = true;
  private authStatus: 'checking' | 'authenticated' | 'failed' = 'checking';

  constructor() {
    this.mode = 'main_menu' as GameMode;
    const savedSound = localStorage.getItem('bomberman_sound');
    this.soundEnabled = savedSound !== 'false';
    this.checkAuth();
  }

  private async checkAuth(): Promise<void> {
    this.authStatus = 'checking';
    try {
      const ok = await LLMPlayer.checkAuth();
      this.authStatus = ok ? 'authenticated' : 'failed';
    } catch {
      this.authStatus = 'failed';
    }
  }

  get currentMode(): GameMode {
    return this.mode;
  }

  get selectedLevelConfig(): LevelConfig {
    return LEVEL_CONFIGS[this.selectedLevel];
  }

  get llmConfig(): LLMConfig | null {
    if (this.authStatus !== 'authenticated') return null;
    const model = LLM_MODELS[this.selectedModelIndex];
    return {
      model: model.id,
      modelDisplayName: model.name,
      endpoint: LLM_API_ENDPOINT,
    };
  }

  get isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  handleInput(action: InputAction | 'enter' | 'escape' | 'backspace' | string): void {
    if (this.mode === 'main_menu') {
      this.handleMainMenu(action);
    } else if (this.mode === 'level_select') {
      this.handleLevelSelect(action);
    } else if (this.mode === 'llm_setup') {
      this.handleLLMSetup(action);
    }
  }

  private handleMainMenu(action: InputAction | 'enter' | 'escape' | string): void {
    if (action === 'up') {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    } else if (action === 'down') {
      this.selectedIndex = Math.min(2, this.selectedIndex + 1);
    } else if (action === 'enter') {
      if (this.selectedIndex === 0) {
        this.transitionTo('level_select' as GameMode);
      } else if (this.selectedIndex === 1) {
        this.transitionTo('llm_setup' as GameMode);
        this.checkAuth();
      } else if (this.selectedIndex === 2) {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('bomberman_sound', this.soundEnabled ? 'true' : 'false');
      }
    }
  }

  private handleLevelSelect(action: InputAction | 'enter' | 'escape' | string): void {
    if (action === 'left') {
      this.selectedLevel = Math.max(0, this.selectedLevel - 1);
    } else if (action === 'right') {
      this.selectedLevel = Math.min(LEVEL_CONFIGS.length - 1, this.selectedLevel + 1);
    } else if (action === 'enter') {
      this.transitionTo('playing' as GameMode);
    } else if (action === 'escape') {
      this.transitionTo('main_menu' as GameMode);
    }
  }

  private handleLLMSetup(action: InputAction | 'enter' | 'escape' | 'backspace' | string): void {
    // 3 focusable items: Model (0), Level (1), Start (2)
    if (action === 'up') {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    } else if (action === 'down') {
      this.selectedIndex = Math.min(2, this.selectedIndex + 1);
    } else if (action === 'left' && this.selectedIndex === 0) {
      this.selectedModelIndex = Math.max(0, this.selectedModelIndex - 1);
    } else if (action === 'right' && this.selectedIndex === 0) {
      this.selectedModelIndex = Math.min(LLM_MODELS.length - 1, this.selectedModelIndex + 1);
    } else if (action === 'left' && this.selectedIndex === 1) {
      this.selectedLevel = Math.max(0, this.selectedLevel - 1);
    } else if (action === 'right' && this.selectedIndex === 1) {
      this.selectedLevel = Math.min(LEVEL_CONFIGS.length - 1, this.selectedLevel + 1);
    } else if (action === 'enter') {
      if (this.selectedIndex === 2) {
        if (this.authStatus === 'failed') {
          this.checkAuth(); // retry auth check
        } else if (this.authStatus === 'authenticated') {
          this.transitionTo('llm_playing' as GameMode);
        }
      }
    } else if (action === 'escape') {
      this.transitionTo('main_menu' as GameMode);
    }
  }

  transitionTo(mode: GameMode): void {
    this.mode = mode;
    this.selectedIndex = 0;
  }

  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, time: number): void {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    this.renderBackground(ctx, canvasWidth, canvasHeight, time);

    if (this.mode === 'main_menu') {
      this.renderMainMenu(ctx, canvasWidth, canvasHeight, time);
    } else if (this.mode === 'level_select') {
      this.renderLevelSelect(ctx, canvasWidth, canvasHeight, time);
    } else if (this.mode === 'llm_setup') {
      this.renderLLMSetup(ctx, canvasWidth, canvasHeight, time);
    }
  }

  private renderBackground(ctx: CanvasRenderingContext2D, width: number, height: number, _time: number): void {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height));
    const pulse = Math.sin(_time * 0.5) * 0.3 + 0.7;
    gradient.addColorStop(0, `rgba(30, 0, 60, ${pulse * 0.4})`);
    gradient.addColorStop(0.5, `rgba(60, 0, 30, ${pulse * 0.3})`);
    gradient.addColorStop(1, 'rgba(0, 10, 30, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 20; i++) {
      const x = (width * i) / 20 + Math.sin(_time + i) * 50;
      const y = (height * ((i * 7) % 20)) / 20 + Math.cos(_time * 0.7 + i) * 30;
      const alpha = Math.sin(_time + i * 0.5) * 0.3 + 0.3;
      ctx.fillStyle = `rgba(100, 50, 200, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderMainMenu(ctx: CanvasRenderingContext2D, width: number, height: number, _time: number): void {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const bounce = Math.sin(_time * 2) * 10;
    ctx.save();
    ctx.translate(width / 2, height / 3 + bounce);

    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff6600';
    ctx.fillStyle = '#ff6600';
    ctx.font = 'bold 64px Arial';
    ctx.fillText('\u{1F4A3} BOMBERMAN \u{1F4A3}', 0, 0);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('REVOLUTION EDITION', 0, 50);
    ctx.restore();

    const options = [
      '\u25B6 PLAY GAME',
      '\u{1F916} LLM PLAYS BOMBERMAN',
      `\u{1F50A} SOUND: ${this.soundEnabled ? 'ON' : 'OFF'}`,
    ];

    const startY = height / 2 + 80;
    const spacing = 50;

    for (let i = 0; i < options.length; i++) {
      const y = startY + i * spacing;
      const selected = i === this.selectedIndex;

      if (selected) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 24px Arial';
        const pulse = Math.sin(_time * 5) * 0.2 + 1;
        ctx.save();
        ctx.translate(width / 2, y);
        ctx.scale(pulse, pulse);
        ctx.fillText(options[i], 0, 0);
        ctx.restore();
      } else {
        ctx.fillStyle = '#aaa';
        ctx.font = '20px Arial';
        ctx.fillText(options[i], width / 2, y);
      }
    }
  }

  private renderLevelSelect(ctx: CanvasRenderingContext2D, width: number, height: number, _time: number): void {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('SELECT LEVEL', width / 2, 80);

    const cardWidth = 150;
    const cardHeight = 200;
    const totalWidth = LEVEL_CONFIGS.length * cardWidth + (LEVEL_CONFIGS.length - 1) * 20;
    const startX = (width - totalWidth) / 2;
    const cardY = height / 2 - cardHeight / 2;

    for (let i = 0; i < LEVEL_CONFIGS.length; i++) {
      const level = LEVEL_CONFIGS[i];
      const x = startX + i * (cardWidth + 20);
      const selected = i === this.selectedLevel;

      ctx.fillStyle = selected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
      ctx.strokeStyle = selected ? '#ffd700' : '#666';
      ctx.lineWidth = selected ? 3 : 1;
      ctx.fillRect(x, cardY, cardWidth, cardHeight);
      ctx.strokeRect(x, cardY, cardWidth, cardHeight);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px Arial';
      ctx.fillText(`${level.level}`, x + cardWidth / 2, cardY + 40);

      ctx.font = 'bold 16px Arial';
      ctx.fillText(level.name.split(' ')[0], x + cardWidth / 2, cardY + 80);
      ctx.fillText(level.name.split(' ')[1] || '', x + cardWidth / 2, cardY + 100);

      const themeColors: Record<string, string> = {
        garden: '#90ee90',
        dungeon: '#7209b7',
        lava: '#ff6f00',
        ice: '#00acc1',
        dark: '#9d00ff',
      };
      ctx.fillStyle = themeColors[level.theme];
      ctx.fillRect(x + 10, cardY + 120, cardWidth - 20, 4);

      ctx.fillStyle = '#aaa';
      ctx.font = '12px Arial';
      ctx.fillText(`${level.gridWidth}x${level.gridHeight}`, x + cardWidth / 2, cardY + 145);
      ctx.fillText(`${level.enemyCount} enemies`, x + cardWidth / 2, cardY + 165);
    }

    ctx.fillStyle = '#999';
    ctx.font = '14px Arial';
    ctx.fillText('\u2190 \u2192 to navigate | ENTER to start | ESC to go back', width / 2, height - 40);
  }

  private renderLLMSetup(ctx: CanvasRenderingContext2D, width: number, height: number, _time: number): void {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('\u{1F916} LLM PLAYS BOMBERMAN', width / 2, 80);

    const startY = 170;
    const spacing = 70;
    const labelX = width / 2 - 200;
    const valueX = width / 2 + 50;

    // Auth status indicator
    const authY = startY;
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px Arial';
    if (this.authStatus === 'authenticated') {
      ctx.fillStyle = '#0f0';
      ctx.fillText('\u2705 GitHub Copilot connected', width / 2, authY);
    } else if (this.authStatus === 'checking') {
      ctx.fillStyle = '#ff0';
      ctx.fillText('\u23F3 Checking authentication...', width / 2, authY);
    } else {
      ctx.fillStyle = '#f44';
      ctx.fillText("\u274C Run 'gh auth login' to connect", width / 2, authY);
    }

    // Model selector
    const modelY = startY + spacing;
    ctx.textAlign = 'left';
    ctx.fillStyle = this.selectedIndex === 0 ? '#ffd700' : '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Model:', labelX, modelY);

    const model = LLM_MODELS[this.selectedModelIndex];
    ctx.fillStyle = this.selectedIndex === 0 ? '#0ff' : '#aaa';
    ctx.fillText(`< ${model.name} >`, valueX, modelY);

    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.fillText(`Provider: ${model.provider}`, valueX, modelY + 25);

    // Level selector
    const levelY = startY + spacing * 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = this.selectedIndex === 1 ? '#ffd700' : '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Level:', labelX, levelY);

    const level = LEVEL_CONFIGS[this.selectedLevel];
    ctx.fillStyle = this.selectedIndex === 1 ? '#0ff' : '#aaa';
    ctx.fillText(`< Level ${level.level}: ${level.name} >`, valueX, levelY);

    // Start button
    const btnY = startY + spacing * 3 + 10;
    ctx.textAlign = 'center';
    const canStart = this.authStatus === 'authenticated';
    if (this.selectedIndex === 2) {
      ctx.fillStyle = canStart ? '#0f0' : '#f44';
    } else {
      ctx.fillStyle = canStart ? '#aaa' : '#555';
    }
    ctx.font = 'bold 24px Arial';
    if (canStart) {
      const pulse = this.selectedIndex === 2 ? Math.sin(_time * 5) * 0.15 + 1 : 1;
      ctx.save();
      ctx.translate(width / 2, btnY);
      ctx.scale(pulse, pulse);
      ctx.fillText('\u25B6 START AI GAME', 0, 0);
      ctx.restore();
    } else {
      ctx.fillText('\u26A0 AUTH REQUIRED', width / 2, btnY);
    }

    // Instructions
    ctx.fillStyle = '#999';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('\u2191\u2193 to navigate | \u2190\u2192 to change | ENTER to select | ESC to go back', width / 2, height - 40);
  }
}