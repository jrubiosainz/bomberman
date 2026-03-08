# Visual Revolution Architecture Decisions

**Date:** 2025-01-XX  
**Author:** Fenster (UI/Rendering Developer)  
**Status:** Implemented  
**Impact:** High — Defines visual identity and user experience for entire game

## Context

McManus completed the 5-level Bomberman engine with LLM support. Task was to create a "night and day" visual difference from the original, with spectacular graphics, full menu system, and LLM integration display.

## Key Decisions

### 1. Theme-Based Rendering System

**Decision:** Create 5 complete visual themes (Garden, Dungeon, Lava, Ice, Dark) with distinct color palettes and tile animations.

**Rationale:**
- Variable grid sizes (13×11 to 21×15) required flexible rendering
- Each level needed unique atmosphere to feel fresh
- Theme object (`THEMES[levelConfig.theme]`) provides clean lookup

**Implementation:**
```typescript
interface ThemePalette {
  background: string;
  empty: string;
  wall: string;
  destructibleWall: string;
  player: string;
  enemy: string;
  bomb: string;
  explosion: string[];
  powerup: string;
  vignette: number;
  accent: string;
}
```

**Alternatives Considered:**
- Single color scheme with saturation variation (rejected: too subtle)
- Separate renderer per level (rejected: code duplication)

**Team Impact:**
- McManus can add new themes by extending LevelTheme enum
- Future levels just need palette definition, rendering logic is shared

---

### 2. Canvas-Only Menu System

**Decision:** Render all menus (MainMenu, LevelSelect, LLMSetup) entirely on canvas, not DOM.

**Rationale:**
- Consistent visual style with game (same font rendering, same glow effects)
- No CSS/DOM complexity, easier to theme and animate
- Menu backgrounds can use same particle effects as game

**Implementation:**
- `MenuSystem` class with internal state machine
- Each menu has dedicated render method
- Keyboard input forwarded to menu handler
- Canvas resizes between menu (900×600) and gameplay (dynamic)

**Alternatives Considered:**
- DOM-based menus with HTML/CSS (rejected: style inconsistency, harder animations)
- Hybrid approach (rejected: adds complexity)

**Trade-offs:**
- Pro: Perfect visual consistency, easy theming, no DOM manipulation
- Con: Text input for API key requires character capture (acceptable)

---

### 3. Particle System as Separate Module

**Decision:** Create standalone `ParticleSystem` class in particles.ts, not embedded in renderer.

**Rationale:**
- Renderer already complex (theme handling, entity rendering, overlays)
- Particles have distinct lifecycle (spawn, update, render, die)
- McManus's engine emits `ParticleEvent[]` in state — clean separation

**Implementation:**
- `processEvents(events)` — spawns particles from game events
- `update(dt)` — updates positions, velocities, alpha
- `render(ctx)` — draws all particles
- Main.ts calls all three each frame

**Alternatives Considered:**
- Particles in renderer (rejected: makes renderer too large)
- No particle system (rejected: explosions would lack impact)

**Team Impact:**
- Anyone can add new particle effects (just extend ParticleEventType)
- Particle behavior tuning independent of rendering

---

### 4. Game Mode State Machine in Main.ts

**Decision:** Implement full state machine with 8 modes: MainMenu, LevelSelect, LLMSetup, Playing, LLMPlaying, LevelTransition, GameOver, Victory.

**Rationale:**
- Clear separation between menu navigation and gameplay
- LLM mode needs distinct async loop (await llmPlayer.tick)
- Level transitions provide visual polish between levels

**Implementation:**
- Global `mode: GameMode` variable
- Switch statement in game loop routes to mode handlers
- Each handler manages: rendering, input, state transitions
- `resizeCanvas()` called when switching between menu/gameplay

**Alternatives Considered:**
- Unified game loop with flags (rejected: becomes messy with 8 states)
- Separate loops per mode (rejected: harder to manage timing)

**Trade-offs:**
- Pro: Clear code structure, easy to debug, mode-specific logic isolated
- Con: Mode handlers duplicate some rendering calls (acceptable)

---

### 5. LLM Overlay as Renderer Feature

**Decision:** Render LLM status overlay inside renderer, not as separate UI layer.

**Rationale:**
- Overlay needs to adapt to canvas size (which varies per level)
- Uses same text wrapping and styling as game HUD
- Keeps all visual presentation in renderer

**Implementation:**
- `renderLLMOverlay(llmInfo, state)` method in renderer
- Receives `{thinking, reasoning, model}` from main.ts
- Semi-transparent panel, word-wrapped text, 4-line limit

**Alternatives Considered:**
- Separate LLMOverlay class (rejected: unnecessary abstraction)
- DOM overlay (rejected: inconsistent with canvas-only approach)

**Team Impact:**
- Future AI visualization enhancements stay in renderer
- McManus's LLMPlayer just exposes getters, no rendering concerns

---

### 6. Dynamic Canvas Sizing

**Decision:** Resize canvas dynamically based on level config (gameplay) or fixed 900×600 (menus).

**Rationale:**
- Level grids vary: 13×11 (Level 1) to 21×15 (Level 5)
- Tile size computed per level: `Math.floor(Math.min(900 / gridWidth, 60))`
- Menus need consistent size for UI layout

**Implementation:**
```typescript
function resizeCanvas(config?: LevelConfig): void {
  if (config) {
    canvas.width = config.gridWidth * config.tileSize;
    canvas.height = config.gridHeight * config.tileSize;
  } else {
    canvas.width = 900;
    canvas.height = 600;
  }
}
```

**Alternatives Considered:**
- Fixed canvas size with scaling (rejected: blurry rendering)
- Always use level size (rejected: menus would look weird)

**Trade-offs:**
- Pro: Crisp rendering at all sizes, no scaling artifacts
- Con: Slight flash during resize (acceptable for mode transitions)

---

## Success Criteria

- [x] Compiles without errors (only 2 unused import warnings in tests)
- [x] 5 distinct visual themes implemented
- [x] Full menu system functional (MainMenu, LevelSelect, LLMSetup)
- [x] Particle system with 7 effect types
- [x] LLM overlay displays AI status
- [x] Game mode transitions smooth (menu → level → victory)
- [x] Visual impact: "night and day" from original

## Lessons for Future Work

1. **Theme approach scales well** — Adding Level 6-10 just requires new palette definitions
2. **Canvas-only menus were correct choice** — Zero CSS/DOM headaches, consistent aesthetic
3. **Particle cap (500) is appropriate** — Could increase if needed, but performance is good
4. **Mode state machine is maintainable** — Easy to add new modes (e.g., Settings, Credits)
5. **Dynamic sizing worked perfectly** — No layout issues across all 5 levels
6. **LLM integration clean** — Renderer just needs `{thinking, reasoning, model}`, rest is abstraction

## Related Files

- `src/renderer.ts` — Theme rendering, LLM overlay
- `src/particles.ts` — Particle system
- `src/menu.ts` — Menu rendering
- `src/main.ts` — Game mode state machine
- `index.html` — Modern dark styling
