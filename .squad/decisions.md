# Squad Decisions

## Active Decisions

### V1 Game Architecture (Keaton)

**Date:** 2025-07-25 | **Status:** Active

**Context:** Bomberman V1 project setup from scratch. Multiple team members working in parallel.

**Decision:**
- Pure Functional Game Logic: `update(state, actions, dt)` returns new GameState, no mutation
- Separated Concerns: game.ts (logic), renderer.ts (drawing), input.ts (keyboard), main.ts (wiring)
- Fixed Timestep: 60fps target with accumulator pattern, deterministic physics
- Data Over Classes: Players, bombs, explosions as plain objects conforming to interfaces

**Rationale:** Enables parallel work, zero-setup testing, deterministic debugging via snapshots.

---

### Chain Explosion Implementation (McManus)

**Date:** 2025-01-XX | **Status:** Implemented

**Context:** Classic Bomberman requires bombs to chain-react when hit by explosions.

**Decision:**
- Two-phase approach in `tickBombs()`:
  1. Timer Phase: Collect bombs with timer <= 0
  2. Chain Phase: Check remaining bombs against active explosions
  3. Filter Phase: Remove chain-detonated bombs
  4. Detonation Phase: Process all bombs sequentially

**Rationale:** Prevents infinite loops, single-pass processing, maintains pure functional style.

**Alternative Rejected:** Recursive detonation (stack depth, debugging complexity, overflow risk).

---

### Revolution Engine Architecture (McManus)

**Date:** 2026-03-07 | **Status:** Implemented

**Context:** Game needed major expansion from single-level Bomberman to full 5-level campaign with progressive difficulty, LLM player support, lives/score systems, and advanced enemy AI.

**Decision:**
- Pure functional core maintained: `update(state, actions, dt) → newState`
- Configuration-driven design with `LEVEL_CONFIGS` array defining all 5 levels
- Smart enemy AI with scaling `enemySmartness` probability (0.1 → 0.8)
- Lives & respawn system (3 lives, respawn at (1,1) on death)
- Score system: kills (100pts), wall breaks (10pts), powerups (50pts), level clear (500pts)
- Sound and particle events as pure data (arrays consumed by renderer/audio each frame)
- LLM player controller with async tick pattern (0.5s decision interval) and ASCII game state serialization

**Rationale:** Maintains testability and predictability while enabling multi-level progression, LLM integration, and difficulty scaling. Configuration-driven approach scales for future levels without code changes.

**Implementation:** types.ts, constants.ts, game.ts, levels.ts, audio.ts, llm-player.ts, vite.config.ts

**Team Impact:** Clear separation — McManus owns game logic, Fenster owns rendering/UI. API changes: `createInitialState(levelConfig)`, new `transitionToNextLevel(state)`.

---

### Visual Revolution Architecture (Fenster)

**Date:** 2026-03-07 | **Status:** Implemented | **Impact:** High

**Context:** Needed "night and day" visual difference from original Bomberman with spectacular graphics, full menu system, and LLM integration display.

**Key Decisions:**

1. **Theme-Based Rendering System** — 5 complete visual themes (Garden, Dungeon, Lava, Ice, Dark) with distinct color palettes and tile animations. Variable grid sizes (13×11 to 21×15) required flexible rendering. Theme object provides clean lookup.

2. **Canvas-Only Menu System** — Render all menus (MainMenu, LevelSelect, LLMSetup) entirely on canvas, not DOM. Consistent visual style, no CSS/DOM complexity, easier to theme and animate. MenuSystem class with internal state machine.

3. **Particle System as Separate Module** — Standalone ParticleSystem class in particles.ts (not embedded in renderer). Distinct lifecycle (spawn, update, render, die). Processes ParticleEvent[] from game state. Adds new particle effects by extending ParticleEventType.

4. **Game Mode State Machine** — 8 modes: MainMenu, LevelSelect, LLMSetup, Playing, LLMPlaying, LevelTransition, GameOver, Victory. Global mode variable with switch routing. Mode handlers manage rendering, input, state transitions independently.

5. **LLM Overlay as Renderer Feature** — Overlay renders inside renderer, not as separate UI layer. Adapts to canvas size (varies per level). Uses same text wrapping and styling as game HUD.

6. **Dynamic Canvas Sizing** — Resize canvas dynamically based on level config (gameplay) or fixed 900×600 (menus). Tile size computed per level: `Math.floor(Math.min(900 / gridWidth, 60))`. Prevents blurry rendering and scaling artifacts.

**Rationale:** Theme approach scales for future levels. Canvas-only menus provide perfect visual consistency. Particle system separation enables independent tuning. Mode state machine isolates mode-specific logic. Dynamic sizing prevents blurry rendering.

**Implementation:** renderer.ts (rewrite with themes, glow, vignette), particles.ts (new), menu.ts (new), main.ts (rewrite with mode machine), index.html (modern dark styling)

**Trade-offs:**
- Pro: Perfect visual consistency, easy theming, no DOM headaches, mode-specific logic isolated, crisp rendering at all sizes
- Con: Text input for API key requires character capture (acceptable), slight canvas resize flash during transitions (acceptable)

**Success Criteria:** [x] 5 distinct themes, [x] Full menu system functional, [x] Particle system with 7 effect types, [x] LLM overlay displays AI status, [x] Game mode transitions smooth, [x] Visual impact: "night and day" from original

**Lessons for Future Work:**
- Theme approach scales well — New levels need only palette definitions
- Canvas-only menus were correct choice — Zero CSS/DOM headaches
- Particle cap (500) appropriate — Good performance
- Mode state machine maintainable — Easy to add new modes (Settings, Credits)
- Dynamic sizing worked perfectly — No layout issues across levels
- LLM integration clean — Renderer just needs `{thinking, reasoning, model}`

**Related Files:** src/renderer.ts, src/particles.ts, src/menu.ts, src/main.ts, index.html

---

### LLM Auto-Auth via GitHub CLI Proxy (McManus)

**Date:** 2026-03-08 | **Status:** Implemented

**Context:** LLM player mode required manual GitHub PAT entry in menu. High friction and security risk (tokens in localStorage).

**Decision:**
- Auth handled entirely server-side in Vite dev proxy
- Proxy runs `gh auth token` on each `/api/chat/completions` request, injects `Authorization` header automatically
- New `/api/auth/status` endpoint lets frontend verify authentication state
- Frontend sends zero credentials — proxy handles everything
- `apiKey` removed from `LLMConfig` interface

**Rationale:**
- Zero-friction: Automatic auth for users with `gh auth login` (standard for Copilot CLI users)
- Security: Auth tokens never reach browser, no localStorage secrets
- Freshness: Token fetched per-request, rotated tokens picked up automatically
- Simplicity: Fewer menu items, no character-capture text input

**Trade-offs:**
- Requires `gh` CLI installed and authenticated (acceptable for dev tool)
- `execSync` blocks event loop ~50ms per request (acceptable for low-frequency calls)

**Team Impact:**
- `LLMConfig.apiKey` removed — any code constructing LLMConfig must be updated
- Menu system no longer stores `bomberman_llm_key` in localStorage

**Files Changed:** vite.config.ts, src/types.ts, src/llm-player.ts, src/menu.ts

---

### LLM Setup Screen Simplified (Fenster)

**Date:** 2026-03-08 | **Status:** Implemented

**Context:** With server-side auth via proxy, the manual API key input field on LLM setup screen became unnecessary.

**Decision:**
- Removed API key text input field from canvas menu entirely
- Auth status now checked via `LLMPlayer.checkAuth()` → `/api/auth/status`
- LLM setup screen has 3 focusable items: Model selector, Level selector, Start button
- Start button disabled when not authenticated
- Auth check re-runs each time LLM setup screen is entered

**Impact:**
- Reduced friction: No manual token copy-paste
- Cleaner UI: One fewer input field on canvas
- Simplified routing: No character-capture input handling needed
- Consistency: Aligns with McManus's server-side auth approach

**Rationale:** Canvas-only menu design already removed DOM complexity; removing one more input field maintains simplicity.

**Files Changed:** src/menu.ts

---

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
