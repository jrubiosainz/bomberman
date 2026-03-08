# Decisions Log

## Active Decisions

### Decision 1: Hollow Depths — Architecture & Game Design

**Date:** 2026-01-XX | **Author:** Keaton | **Status:** Implemented

**Context:** New metroidvania game inspired by Hollow Knight with creative twist. Browser-first (HTML5 Canvas + TypeScript + Vite).

**Decision:** Implement pure functional game state architecture with comprehensive type system and tile-based level structure.

**Key Principles:**
1. Pure Functional Game State: `update(state, actions, dt) → newState` with zero mutations
2. Comprehensive Type System First: Define all types before implementation (parallel development enablement)
3. Constants as Configuration: All tuning values in src/constants.ts
4. Tile-Based Metroidvania: 160×50 tiles, 32px each, familiar structure
5. Input Distinction: Held keys (movement) vs pressed keys (actions) prevent repeats
6. Fixed Timestep: 60fps deterministic physics
7. Plain Data Entities: No classes, serializable, testable
8. Team Separation: Keaton (architecture), McManus (logic), Fenster (render), Hockney (tests)

**Consequences:**
- ✅ Parallel development without merge conflicts
- ✅ Type-safe integration at compile time
- ✅ Easy testing (pure functions, no mocks)
- ✅ Deterministic behavior (debuggable, networkable)
- ⚠️ Verbose spread operators throughout

**Related:** Follows patterns from Bomberman V1 project.

**Status:** Implemented and validated. TypeScript compiles clean. All team members integrated successfully.

---

### Decision 2: Pure Functional Game Engine for Hollow Depths

**Date:** 2025-01-XX | **Decided by:** McManus | **Status:** Implemented

**Context:** Building core game logic for Hollow Depths with multiple complex systems (physics, AI, combat, progression, particles). Needs testability and maintainability.

**Decision:** Implement pure functional game engine with signature `update(state: GameState, actions: InputActions, dt: number) → GameState`. All logic is pure functions with no mutations.

**Rationale:**
1. **Testability** — State serializable, saveable, replayable. Zero mocks needed.
2. **Debuggability** — State transitions explicit, no hidden mutations. Can inspect state at any point.
3. **Determinism** — Same inputs always produce same outputs. Critical for multiplayer/networked games.
4. **Separation of Concerns** — Game logic has zero dependencies on rendering, input, or DOM. Headless testable.
5. **Single Entry Point** — All systems update in predictable order: physics → AI → combat → particles → camera

**Implementation:**
- Used TypeScript strict mode to catch mutations at compile time
- All entity arrays use .map() and .filter() (no in-place mods)
- Helper functions are pure: `checkTileCollision(hitbox, tileMap) → boolean`
- State transitions via status field: Playing, Dialogue, LevelUp, BossIntro, Victory, GameOver

**Alternatives Considered:**
1. OOP with mutations — Faster, but harder to debug/test. Hidden state changes.
2. ECS (Entity-Component-System) — Overkill for <100 entities. Adds complexity without benefit.
3. Reactive/observables — Framework dependency. Pure functions simpler.

**Trade-offs:**
- Performance: Copying state every frame slower than mutation. But for 60fps with <100 entities, negligible (~1-2ms/frame).
- Verbosity: Spread operators everywhere. But explicit is better than implicit.

**Consequences:**
- ✅ 1300+ lines of clean functional logic
- ✅ TypeScript strict mode compatible
- ✅ All systems working: physics, 5 enemy AI, boss 3-phase, particles, progression, dialogue
- ✅ 121 passing tests (78.6% coverage)
- ⚠️ More verbose than mutation-based approaches

**Status:** Complete. Engine fully functional and integrated with all systems operational.

---

### Decision 3: Hollow Depths Renderer Architecture — Additive Blending & Procedural Visuals

**Date:** 2025-01-XX | **Decider:** Fenster | **Status:** Implemented

**Context:** Building complete rendering system for "Hollow Depths" dark atmospheric metroidvania. Player is the light source in bioluminescent underground world.

**Decision:** Implement pure Canvas 2D procedural renderer with additive blending for ALL glow effects as signature visual technique.

**Key Architectural Choices:**

1. **No External Assets** — ALL visuals procedurally generated using Canvas 2D primitives. Tile textures with randomized shapes/gradients. Enemy designs from circles/ellipses/polygons.
   - Rationale: Full control, no asset loading delays, easier iteration

2. **Additive Blending as Core Visual Language** — Use `ctx.globalCompositeOperation = 'lighter'` for ALL glow effects. Radial gradients with alpha transparency create diffuse light.
   - Rationale: Creates authentic bioluminescent feel, glows "pop" against dark backgrounds, core to game identity

3. **Player Glow as Signature Mechanic** — Large radial gradient (200+ pixel radius), scales with player level, pulsing animation.
   - Rationale: Makes player feel powerful, creates natural lighting system, core to game identity

4. **Dark Environment First** — Base colors deep navy/midnight purple. Tiles/environment extremely dark. Light comes ONLY from glowing entities.
   - Rationale: Forces glow effects to carry aesthetic, creates tension

5. **Viewport Culling** — Only render tiles visible in camera viewport. Calculate visible range: `Math.floor(cameraX / TILE_SIZE)` to `Math.ceil((cameraX + width) / TILE_SIZE)`.
   - Rationale: Large level (160×50 = 8000 tiles), avoid rendering off-screen

6. **Layered Rendering Order** — Background → Tiles → NPCs → Enemies → Boss → Player → Particles → HUD → UI. Camera transform on world only.
   - Rationale: Proper depth sorting, player always visible, UI stable

7. **Phase-Based Boss Rendering** — Boss color shifts by phase (blue → pink → red). Appendages on Phase2+, cracks on Phase3.
   - Rationale: Visual feedback for difficulty escalation, dramatic moments

8. **Procedural Tile Variation** — Seed-based randomization: `Math.sin(row * 1000 + col)`. Each tile instance looks slightly different.
   - Rationale: Avoids repetitive look, organic cave feel

9. **Screen Shake with Decay** — Intensity-based random offset. Exponential decay. Applied to camera transform only.
   - Rationale: Juice for combat feel, doesn't affect UI, smoothly settles

10. **Particle Type Enum** — Switch on ParticleType for rendering. Each type has distinct visual. All use additive blending.
    - Rationale: Easy to add new types, consistent glow aesthetic

**Alternatives Considered:**
1. WebGL — Rejected: Canvas 2D sufficient for 2D sprites, lower complexity
2. Image Sprite Sheets — Rejected: Asset bottleneck, less atmospheric control
3. Fixed Lighting System — Rejected: Wanted dynamic player glow based on level
4. Single Glow Technique — Rejected: Different entities need different glow styles

**Consequences:**
- ✅ Unique atmospheric visual identity achieved
- ✅ Zero asset dependencies
- ✅ Easy visual iteration (just change code)
- ✅ Performance optimized with viewport culling
- ✅ 1500+ lines of clean rendering code
- ⚠️ Large file (1500+ lines) — consider splitting if grows beyond 2000 lines
- ⚠️ Procedural art limits fine detail (acceptable trade-off for style)
- ⚠️ Additive blending can oversaturate with many overlapping glows (monitor particle counts)

**Follow-Up Actions:**
1. Monitor renderer file size (split if >2000 lines)
2. Profile particle counts during intense combat (prevent oversaturation)
3. Future: Particle pooling if performance degrades

**Status:** Implemented and integrated. All visual systems functional. Bioluminescent aesthetic established.

---

### Decision 4: Revolution Engine Architecture

**Date:** 2026-01-XX | **Author:** McManus | **Status:** Implemented

**Context:** Game engine expansion from single-level Bomberman to full 5-level campaign with progressive difficulty, LLM player support, lives system, and advanced enemy AI.

**Decision:** Complete engine rewrite maintaining pure functional core while adding multi-level progression, LLM player controller, lives/scoring, smart enemy AI, and event-based sound/particle systems.

**Key Principles:**
1. Pure Functional Core: `update(state, actions, dt) → newState` with zero mutations
2. Configuration-Driven: LEVEL_CONFIGS array defines all 5 levels with grid size, difficulty, theme
3. Smart Enemy AI: enemySmartness probability scales from 0.1 to 0.8 across levels
4. Lives & Respawn: Player starts with 3 lives, respawns at (1,1) on death, game over at 0 lives
5. Score System: Points for kills (100), wall breaks (10), powerups (50), level clear (500)
6. Event-Based Systems: Sound and particle events as data, consumed by renderer/audio
7. LLM Player: Async tick pattern with ASCII art serialization for vision-language models

**Implementation:**
- Dynamic tile sizing: `Math.floor(Math.min(900 / gridWidth, 60))`
- Configurable enemy count, speed, and smartness per level
- Level transitions preserve lives and score
- Graceful LLM fallback to random action on error

**Consequences:**
- ✅ Seamless multi-level progression
- ✅ Pure functions remain testable and deterministic
- ✅ Easy to add new levels (just extend LEVEL_CONFIGS)
- ✅ LLM player enables AI vs AI gameplay
- ⚠️ Event arrays cleared each frame (minimal memory overhead)

**Team Impact:**
- McManus owns core logic (game.ts, engine systems)
- Fenster integrates rendering (menus, level select, victory screens)
- Clear separation enables parallel development

**Status:** Implemented and integrated with all systems operational.

---

### Decision 5: Visual Revolution Architecture Decisions

**Date:** 2026-03-08 | **Author:** Fenster | **Status:** Implemented

**Context:** Creating "night and day" visual difference from original with spectacular graphics, full menu system, and LLM integration display for multi-level Bomberman engine.

**Decision:** Implement theme-based rendering system with canvas-only menus, standalone particle system, game mode state machine, and dynamic canvas sizing.

**Key Architectural Choices:**

1. **Theme-Based Rendering System** — 5 complete visual themes (Garden, Dungeon, Lava, Ice, Dark) with distinct color palettes and animations. ThemePalette interface provides clean lookup.

2. **Canvas-Only Menu System** — All menus rendered on canvas (not DOM) for visual consistency with game. Same font rendering, glow effects, particle backgrounds.

3. **Particle System as Separate Module** — Standalone ParticleSystem class in particles.ts. Renderer focuses on theme/entity rendering, particles have distinct lifecycle.

4. **Game Mode State Machine** — 8 modes: MainMenu, LevelSelect, LLMSetup, Playing, LLMPlaying, LevelTransition, GameOver, Victory. Clear separation of concerns, mode-specific logic isolated.

5. **LLM Overlay as Renderer Feature** — Renders AI status overlay (thinking, reasoning, model) inside renderer. Adapts to canvas size, uses same text wrapping as game HUD.

6. **Dynamic Canvas Sizing** — Canvas resizes based on level (gameplay) or fixed 900×600 (menus). Tile size computed per level for crisp rendering.

**Implementation:**
- `resizeCanvas(config?)` handles menu vs gameplay sizing
- `renderLLMOverlay(llmInfo, state)` displays AI status
- `processEvents(events)` spawns particles from game events
- Mode handlers route game loop to appropriate state

**Consequences:**
- ✅ Unique visual identity across 5 themes
- ✅ Zero CSS/DOM complexity, consistent aesthetic
- ✅ Perfect scaling from 13×11 to 21×15 grids
- ✅ Particle system easy to extend (500 cap maintains performance)
- ✅ LLM integration clean and unobtrusive
- ⚠️ Canvas-only text input less feature-rich than DOM inputs

**Lessons:**
- Theme approach scales well for future levels
- Canvas-only menus eliminated CSS/DOM headaches
- Mode state machine is maintainable and extensible
- Dynamic sizing worked flawlessly across all levels

**Status:** Implemented and integrated with all visual systems operational.

---

### Decision 6: LLM Player Resilience & Rate Limit Handling

**Date:** 2026-03-08 | **Author:** McManus | **Status:** Implemented

**Context:** LLM player hitting rate limits on Level 2+ with large models (Claude Opus 4.5, GPT-5.4). User saw "Too many errors, waiting..." permanently stuck. GitHub Models API rate limits were saturated by aggressive 0.5s polling intervals.

**Problem:**
1. Too aggressive polling: LLM_TICK_INTERVAL = 0.5s way too fast for rate-limited APIs
2. Permanent failure: errorCount > 5 gave up forever, never recovering
3. No backoff: Retried at same interval on error, compounding rate limit issues
4. Large state payloads: Level 2+ grids sent 195-315 grid cells per request
5. No rate limit detection: HTTP 429 responses treated like generic errors
6. Poor UX: Ambiguous and permanent failure message

**Decision:** Implement exponential backoff, recovery cooldown, HTTP 429 detection, and compact state serialization.

**Implementation:**
1. **Base interval increased**: LLM_TICK_INTERVAL from 0.5s → 1.5s (3× slower baseline)
2. **Exponential backoff**: On each error, interval doubles (max 30s). Resets on success.
3. **Cooldown recovery**: After 5 errors, enter 10-second cooldown, then reset and retry. **Never permanently give up.**
4. **Rate limit detection**: HTTP 429 responses extract Retry-After header and set cooldown timer accordingly.
5. **Compact state**: Grids >15 wide send only 11×11 window centered on player. Reduces token usage ~60% on large levels.
6. **Better error display**: Show "Retrying in 7s..." countdown instead of permanent failure message.

**Rationale:**
- Exponential backoff is standard for rate-limited APIs (prevents thundering herd)
- Cooldown recovery borrowed from circuit breaker pattern (temporary ≠ permanent failure)
- Compact state critical for large grids (21×15 grid: 315 cells → 121 cells = 61% reduction)
- HTTP 429 detection enables respectful API usage
- Never give up aligns with user expectations

**Consequences:**
- ✅ Large models work on Level 2+ without immediate failure
- ✅ LLM self-recovers from rate limits after cooldown
- ✅ Token usage reduced ~60% on large grids
- ✅ Helpful countdown display instead of permanent failure
- ✅ Respectful API usage with Retry-After support
- ⚠️ Slightly slower decision-making (1.5s vs 0.5s), but necessary for stability

**Files Modified:**
- src/constants.ts: LLM_TICK_INTERVAL 0.5 → 1.5
- src/llm-player.ts: Added backoff, recovery, HTTP 429 handling, compact state

**Status:** Implemented, TypeScript clean, pushed to main.

---

## Decision Archive

*(No previous archived decisions from this sprint)*

---

## Lessons Learned

1. **Pure Functional = Parallel-Ready** — No shared mutable state enables true parallel team development without coordination overhead.
2. **Types-First Contracts** — Comprehensive type definitions upfront enable test-driven development before implementation.
3. **Additive Blending is Magical** — Single rendering technique (`globalCompositeOperation = 'lighter'`) carries entire aesthetic.
4. **Viewport Culling Critical** — 8000-tile level requires viewport culling to maintain 60fps performance.
5. **Procedural Assets Cut Iteration Time** — No asset bottleneck, fast visual experiments via code changes.

---

**Last Updated:** 2025-01-XX
