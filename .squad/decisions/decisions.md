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
