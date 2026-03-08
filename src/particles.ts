import type { ParticleEvent } from './types';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  gravity: number;
  decay: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private readonly maxParticles = 500;

  processEvents(events: ParticleEvent[]): void {
    for (const event of events) {
      switch (event.type) {
        case 'explosion':
          this.spawnExplosion(event.x, event.y);
          break;
        case 'wall_break':
          this.spawnWallBreak(event.x, event.y);
          break;
        case 'powerup_pickup':
          this.spawnPowerupPickup(event.x, event.y);
          break;
        case 'enemy_death':
          this.spawnEnemyDeath(event.x, event.y);
          break;
        case 'player_death':
          this.spawnPlayerDeath(event.x, event.y);
          break;
        case 'level_complete':
          this.spawnLevelComplete(event.x, event.y);
          break;
      }
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= p.decay;
      p.vy *= p.decay;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Cap particle count
    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  spawnExplosion(x: number, y: number): void {
    const colors = ['#ff6600', '#ff9900', '#ffcc00', '#fff', '#ff3300'];
    const count = 40 + Math.random() * 20;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 150;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        gravity: 0,
        decay: 0.95,
      });
    }
  }

  spawnWallBreak(x: number, y: number): void {
    const colors = ['#8b4513', '#a0522d', '#d2b48c', '#deb887'];
    const count = 15 + Math.random() * 10;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 0.8 + Math.random() * 0.4,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        gravity: 300,
        decay: 0.98,
      });
    }
  }

  spawnPowerupPickup(x: number, y: number): void {
    const colors = ['#ffd700', '#ffed4e', '#fff', '#ffaa00'];
    const count = 20;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 0.6 + Math.random() * 0.4,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        gravity: -50,
        decay: 0.97,
      });
    }
  }

  spawnEnemyDeath(x: number, y: number): void {
    const colors = ['#ff4500', '#ff6347', '#ff0000', '#8b0000'];
    const count = 15;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.5 + Math.random() * 0.3,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        gravity: 100,
        decay: 0.96,
      });
    }
  }

  spawnPlayerDeath(x: number, y: number): void {
    const colors = ['#fff', '#ffea00', '#ffd700', '#ff69b4'];
    const count = 50;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8 + Math.random() * 0.5,
        maxLife: 0.8 + Math.random() * 0.5,
        size: 3 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        gravity: 50,
        decay: 0.94,
      });
    }
  }

  spawnConfetti(_canvasWidth: number, _canvasHeight: number): void {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffd700', '#ff69b4'];
    const count = 150;
    
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 900; // Use reasonable default
      this.particles.push({
        x,
        y: -20,
        vx: (Math.random() - 0.5) * 50,
        vy: Math.random() * 100 + 100,
        life: 3 + Math.random() * 2,
        maxLife: 3 + Math.random() * 2,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        gravity: 150,
        decay: 0.99,
      });
    }
  }

  spawnLevelComplete(x: number, y: number): void {
    const colors = ['#ffd700', '#ffed4e', '#fff', '#ffaa00', '#ff8c00'];
    const count = 40;
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 100 + Math.random() * 50;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 100,
        life: 1 + Math.random() * 0.5,
        maxLife: 1 + Math.random() * 0.5,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        gravity: -30,
        decay: 0.96,
      });
    }
  }

  clear(): void {
    this.particles = [];
  }
}
