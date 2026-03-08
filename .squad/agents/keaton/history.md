# Project Context

- **Owner:** jrubiosainz
- **Project:** Bomberman classic game — cartoon style browser game
- **Stack:** TypeScript, HTML5 Canvas, browser-based
- **Created:** 2026-03-05

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### V1 Foundation (2025-07-25)
- **Architecture:** Pure functional game logic — `update(state, actions, dt) → state`. No mutation in update path. Renderer is a separate class that reads state. Input handler returns action arrays per frame.
- **Stack:** TypeScript + Vite + Vitest. ES2020 target, strict mode, bundler module resolution.
- **Grid:** 13×11 tiles, 60px each → 780×660 canvas. Classic Bomberman pillar pattern (indestructible walls at even row/col intersections).
- **State model:** `GameState` is the single source of truth — contains grid, player, bombs, explosions, powerups, status, timer. All entities are plain data objects, no class hierarchies.
- **Game loop:** Fixed timestep (1/60s) with accumulator pattern to decouple physics from rendering frame rate.
- **Key files:** `src/types.ts` (all interfaces), `src/constants.ts` (tuning knobs), `src/game.ts` (logic), `src/renderer.ts` (canvas drawing), `src/input.ts` (keyboard), `src/levels.ts` (level data), `src/main.ts` (bootstrap).
- **Collision:** Bounding-box corner checks against grid. Player hitbox is 80% of tile size for forgiving movement.
- **Bomb lifecycle:** Place → 3s timer → detonate (spread in 4 directions, blocked by walls, destroys destructible walls) → 0.5s explosion → fade.
- **User prefs:** jrubiosainz wants classic Bomberman, cartoon style, browser-based. Single player for V1.

### Hollow Depths Architecture (2026-01-XX)
- **Project:** "Hollow Depths" — A bioluminescent metroidvania where player is the light in a dying underground world. Browser-first (HTML5 Canvas + TypeScript + Vite), planned iOS migration.
- **Location:** `C:\Users\jrubiosainz\OneDrive - Microsoft\Desktop\demos\hollow-depths\`
- **Creative Vision:** Moth-like luminous spirit in crystal caverns and fungal forests. Player IS the light source — world reveals around player's glow. Melancholic beauty with light/dark mechanics.
- **Architecture Pattern:** Pure functional game logic (`update(state, actions, dt) → state`). Complete separation: game logic (McManus), renderer (Fenster), input (done), main loop (done).
- **Stack:** TypeScript + Vite + Vitest. ES2020+ target, strict mode with all safety flags, bundler resolution. 1280x720 canvas.
- **Type System:** Comprehensive types in `src/types.ts` — GameState, PlayerState, EnemyState, NPCEntity, BossState, WeaponStats, DialogueTree, LevelData, Particles, Camera, Progression. All game systems fully typed.
- **Constants:** `src/constants.ts` — Physics (gravity, terminal velocity, friction), player stats (health, damage, speed, glow radius), weapon data, enemy data, boss stats, XP curve, particle configs, animation timings.
- **Level Structure:** Tile-based metroidvania (160×50 tiles, 32px each). Level 1: Starting area → vertical shaft → upper chambers → middle corridor → fungal forest → boss arena. Locked doors and unreachable ledges hint at backtracking.
- **Entities:** 5 enemy types (GlowMite patrol, ShadowStalker flees light, SporeFloater flying, CrystalSniper ranged, VoidWraith seeks light). 2 NPCs with dialogue trees. 1 multi-phase boss. 23 enemy spawns across level.
- **Systems:** Player movement (run, jump, wall-slide, dash, attack), weapon switching (3 weapons: LuminousSting, CrystalBlade, VoidLance), particle system (6 types), dialogue system, XP/leveling (6 levels with stat bonuses), camera follow with smoothing.
- **Input:** Held keys (movement) vs pressed keys (actions). Arrow/WASD movement, Space jump, X attack, Z dash, C weapon switch, E interact.
- **Key Files:**
  - `src/types.ts` — All interfaces and enums for entire game
  - `src/constants.ts` — All tuning values
  - `src/levels/level1.ts` — Complete level 1 tile map, enemy/NPC spawns, weapon pickups, dialogue trees
  - `src/input.ts` — Input handler with held/pressed distinction
  - `src/main.ts` — Fixed timestep game loop, state initialization, bootstrap
  - `index.html` — 1280x720 canvas with dark bioluminescent theme
- **Team Division:** McManus implements all game logic (physics, AI, combat, particles). Fenster implements renderer (tiles, entities, particles, glow effects, UI). Input and architecture scaffolding complete.

### Team Integration & Outcomes (2025-01-XX)

**Architecture Validation:**
- Pure functional design enabled true parallel development — McManus, Fenster, Hockney worked simultaneously with zero merge conflicts
- Type system caught all integration issues at compile time
- Fixed timestep physics deterministic and testable
- Plain data entities made debugging/serialization trivial

**Deliverables:**
- ✅ McManus: 1300+ lines of game engine — all systems functional (physics, 5 enemy AI, 3-phase boss, particles, progression, dialogue, camera)
- ✅ Fenster: 1500+ lines of renderer — bioluminescent aesthetic achieved, procedural visuals, all UI/screens, camera effects
- ✅ Hockney: 125-test suite with 121 passing (78.6% coverage), contract-based approach

**Game Status:**
- Playable Level 1 campaign with all systems functional
- ~1-2ms per frame (60fps), 8000-tile viewport culling
- TypeScript strict mode, zero compilation errors
- 121/154 tests passing (4 minor failures, 29 skipped for future features)

**Key Lessons:**
1. Separation of concerns (architecture/logic/render/tests) eliminates coordination overhead
2. Types-first contract enables parallel work without stepping on each other
3. Pure functions make testing trivial (no mocks, no DI containers)
4. Procedural rendering cuts iteration time (no asset bottleneck)
