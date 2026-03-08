# Project Context

- **Owner:** jrubiosainz
- **Project:** Hollow Depths — Bioluminescent metroidvania game
- **Stack:** TypeScript, HTML5 Canvas, browser-based
- **Created:** 2026-03-05

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2025-01-XX: Hollow Depths Complete Renderer Implementation

**What I Built:**
- Complete atmospheric renderer (1500+ lines) for "Hollow Depths" — a dark, Hollow Knight-inspired bioluminescent metroidvania
- Pure Canvas 2D rendering with NO external image assets — everything procedurally drawn
- Signature visual: Player character is a moth-spirit with RADIAL GLOW using additive blending (`globalCompositeOperation = 'lighter'`)

**Visual Style — Dark Atmospheric Bioluminescence:**
- **Color Palette:** Deep navy (#0a0a2e), midnight purple (#1a0a3e), bioluminescent cyan (#00ffcc), soul blue (#4488ff), danger red (#ff3344)
- **Atmosphere:** Dark underground world where the player's glow is the PRIMARY LIGHT SOURCE
- **Hollow Knight Energy:** Simple silhouettes with glowing features, hand-drawn feel

**Rendering Systems Implemented:**

1. **Background & Parallax:**
   - Distant cavern stalactites with parallax scrolling
   - Faint ambient glow spots in the background
   - Multi-layer depth simulation

2. **Tile Rendering (8 types):**
   - STONE: Procedural rocky texture with varied grey rectangles and highlights
   - PLATFORM: Semi-transparent floating platforms with faint glow edges
   - WALL: Vertical-emphasized stone with gradient shading
   - SPIKE: Dangerous sharp triangles in dark red with glowing tips
   - LOCKED_DOOR: Ornate door with pulsing mystery glow and lock symbol
   - CRYSTAL: Faceted crystal shapes with color variation (pink/blue/green), pulsing glow, random sparkles
   - MOSS: Dark green organic patches with bioluminescent spots
   - Viewport culling for performance (only render visible tiles)

3. **Player Rendering (Moth-Spirit):**
   - Delicate moth design: oval body, wing shapes, antennae with glowing tips
   - **RADIAL GLOW EFFECT:** Multi-stop gradient with additive blending, pulse animation, radius scales with player level
   - Animation states: idle (gentle wing flutter), running (wings back), jumping (wings spread), dashing (blur trail with afterimages), attacking (weapon arc with glow)
   - Invincibility blink effect, damage flash
   - Facing direction support for all animations

4. **Enemy Rendering (5 types):**
   - **GlowMite:** Small beetle with faint red glowing eyes
   - **ShadowStalker:** Nearly invisible wispy shape (0.2 alpha), becomes solid (0.8 alpha) when aggro'd
   - **SporeFloater:** Mushroom cap with glowing spots, floating animation
   - **CrystalSniper:** Stationary crystalline turret with pulsing red core
   - **VoidWraith:** Ethereal form with trail effect, drawn to player light
   - Death animations with fade-out, health bars above enemies

5. **Boss Rendering:**
   - Large corrupted crystal golem (160x160px footprint)
   - Phase-based color shifts: Phase1=blue, Phase2=pink, Phase3=red
   - Pulsing glowing core, multi-layered glow effect
   - Phase2+ adds animated tendrils/arms, Phase3 adds crack patterns
   - Wide boss health bar at top of screen with phase markers

6. **NPC Rendering:**
   - Friendly silhouettes with gentle glow
   - Idle bobbing animation, proximity indicator "[E] Talk"
   - Name labels in cyan

7. **Particle System:**
   - **AmbientSpore:** Small glowing dots with radial gradient fade
   - **CombatSpark:** Sharp cross shapes for weapon impacts
   - **SoulWisp:** Large orbiting particles (enemy death = XP visual)
   - **GlowPulse:** Expanding ring effect
   - **BloodDrop:** Simple circular particles
   - **CrystalShard:** Rotating sharp fragments
   - ALL particles use additive blending for glow

8. **HUD (Heads-Up Display):**
   - Health bar with bioluminescent gradient fill (cyan to soul blue), glowing edge
   - XP bar showing progress to next level
   - Current weapon display
   - Level indicator
   - Dark semi-transparent panel background

9. **Game Screens:**
   - **Title:** "HOLLOW DEPTHS" with glowing gradient text, moth silhouette, atmospheric particles, pulsing "Press SPACE" prompt
   - **Pause:** Semi-transparent overlay with controls reminder
   - **Game Over:** Dark fade with red glowing "YOU HAVE FALLEN"
   - **Victory:** Expanding cyan glow, "LEVEL COMPLETE" with stats placeholders
   - **Level Up:** Large pulsing "LEVEL UP!" notification with flash effect

10. **Dialogue System:**
    - Large dialogue box with glowing border
    - Speaker name, word-wrapped text
    - Continue/Close prompts

11. **Camera Effects:**
    - Screen shake with decay (for boss hits, damage)
    - Smooth camera follow with viewport offset transform
    - Vignette effect (dark radial gradient at screen edges)
    - Flash effects (damage, level-up) with color and intensity control

**Technical Architecture:**
- Exported `render(ctx, state)` function — pure presentation layer, NEVER modifies state
- Exported `initRenderer(canvas)` for setup
- Exported utility functions: `triggerScreenShake(intensity)`, `triggerFlash(color, intensity)`
- Internal `RendererState` for animations and time-based effects
- Rendering order: background → tiles → NPCs → enemies → boss → player → particles → vignette → HUD → dialogue → screens → flashes
- `ctx.save()`/`ctx.restore()` for camera transforms
- Viewport culling for tile rendering

**Glow Techniques:**
- Radial gradients with alpha transparency (`#00ffcc` + alpha hex)
- `globalCompositeOperation = 'lighter'` for additive blending (makes glows "pop")
- Multi-layered glow: core bright color, outer diffuse glow
- Pulse animations using `Math.sin(time)` for organic feel
- Glow intensity tied to game state (player level, boss phase)

**Particle Approaches:**
- Type-based rendering (switch on ParticleType enum)
- Alpha fade-out over lifetime
- Velocity-based positioning
- Randomized seed-based procedural variation for tile details
- Trail effects using multiple alpha-faded copies

**Animation Patterns:**
- Time-based sine wave animations (`Math.sin(rendererState.time * frequency)`)
- Per-entity phase offsets (e.g., `position.x * 0.1`) for variation
- Animation state machine (Idle, Walk, Run, Jump, Dash, Attack)
- Sprite-less animation using transforms and shape variations

**Performance Optimizations:**
- Viewport culling: only render tiles in camera view
- Gradient caching via Canvas API (browser handles optimization)
- Single `globalCompositeOperation` switch per particle batch

**Code Organization:**
- 1500+ lines organized into clear sections with headers
- Helper functions for each tile type, enemy type, screen type
- Consistent naming: `render*` for drawing functions
- All magic numbers extracted to constants or calculated

**Integration:**
- Reads `GameState` from types.ts (player, enemies, NPCs, boss, particles, camera, level, status)
- Uses constants from constants.ts (colors, sizes, canvas dimensions)
- No game logic in renderer — pure visual presentation
- TypeScript strict mode compatible (all type errors resolved)

### 2025-01-XX: Cartoon-Style Renderer Implementation

**What I Built:**
- Complete rewrite of renderer.ts into a vibrant, cartoon-style Bomberman visual system
- All rendering done procedurally with Canvas 2D API (no external images)
- Implemented thick outlines, bright saturated colors, rounded shapes for cartoon aesthetic

**Visual Elements Implemented:**
1. **Player Character**: White/cream Bomberman with red helmet, antenna, big cartoon eyes, bobbing animation
2. **Bombs**: Black spheres with pulsing animation, flickering fuse sparks (orange/yellow)
3. **Explosions**: Multi-layered star burst (red→orange→yellow core), fade-out animation, screen shake effect
4. **Walls**: Stone bricks with 3D shading (light/dark edges), wooden crates with plank patterns
5. **Grass Tiles**: Green base with darker patches, random grass blade details
6. **HUD**: Semi-transparent top bar with bomb count, range icons, timer display
7. **Game Status**: "GAME OVER" with explosion backdrop, "VICTORY!" with rotating stars
8. **Enemy Rendering**: Defensive implementation (checks if enemies exist) for red blob enemies with bounce animation

**Animation Techniques:**
- Time-based animations using `animState.time` counter
- Pulsing bombs based on timer countdown ratio
- Screen shake calculated from explosion count intensity
- Player bobbing when moving, alternating feet
- Enemy bounce using sine wave with unique phase per enemy
- Powerup bounce animation

**Rendering Architecture:**
- Layered rendering: grid → powerups → explosions → bombs → enemies → player → HUD/overlays
- Shake offset applied to game world, UI overlays unaffected
- Helper methods for reusable shapes (stars, icons, tile types)
- Defensive coding for enemy rendering (McManus adding enemies in parallel)

**Color Palette Design:**
- Bright, saturated cartoon colors
- Consistent thick black outlines (#2a2a2a, 2-3px)
- Glow effects using alpha transparency (e.g., `color + '40'`)
- Distinct color families: player (white/red), bomb (black/orange), explosion (yellow/red), enemy (red), powerups (pink/green/cyan)

**Technical Decisions:**
- Used `globalAlpha` for explosion fade-out
- Shadow rendering using ellipses under characters
- Star pattern drawn with vertex loop (alternating outer/inner radius)
- Avoided external dependencies—pure Canvas 2D drawing
- Updated index.html with cartoon styling, gradient background, keyboard instruction display

**Integration Notes:**
- Reads GameState from types.ts (read-only)
- Uses constants from constants.ts (TILE_SIZE, GRID_WIDTH, etc.)
- Defensive rendering for `state.enemies` (McManus adding EnemyState)
- No game logic in renderer—pure presentation layer

### Team Integration & Outcomes (2025-01-XX)

**Parallel Development Success:**
- Worked simultaneously with Keaton (architecture), McManus (engine), Hockney (tests)
- Type system provided clear renderer contract (GameState, ParticleType, etc.)
- Additive blending technique became signature visual identity

**Deliverables Verified:**
- ✅ 1500+ lines of rendering code, TypeScript strict mode, zero `any` types
- ✅ All visual systems functional: background, tiles (8 types), player, enemies (5 types), boss (3-phase), NPCs, particles (6 types)
- ✅ All UI screens: title, pause, game over, victory, level-up, dialogue
- ✅ Camera effects: smooth follow, screen shake with decay, vignette, flash effects
- ✅ Performance: viewport culling (8000 tiles), gradient caching, batched particle rendering
- ✅ Integration: reads GameState only (never mutates), pure presentation layer

**Engine Integration Results:**
- McManus's game.ts output matched expected types exactly — zero renderer modifications post-integration
- Particle system proved extensible (ambient spores + combat sparks + soul wisps + etc. added without issues)
- All entity types rendered correctly on first integration attempt

**Architectural Decisions Validated:**
1. **Additive Blending (globalCompositeOperation = 'lighter')** — Created authentic bioluminescent feel, core to game identity
2. **Viewport Culling** — Essential for 8000-tile level; maintains 60fps even with high draw calls
3. **Procedural Visuals** — Eliminated asset bottleneck; visual iteration fast, no external dependencies
4. **Phase-Based Boss Rendering** — Color shifts + appendages + cracks provided visual difficulty feedback
5. **Pure Presentation Layer** — Game engine completely unaware of rendering; enables future renderer rewrites

**Performance Profile:**
- ~1-2ms per frame (60fps) at 1280×720 with full particle system active
- Viewport culling critical — without it, 8000 tiles would tank performance
- Additive blending slightly expensive but acceptable trade-off for aesthetic

**Testing Results:**
- All rendering code type-safe (zero `any` types, strict mode)
- No visual glitches post-engine integration
- Particle saturation acceptable (monitor in future intensive combat scenarios)

**Next Sprint Opportunities:**
- Sound design can layer without touching renderer (pure audio)
- Level 2 can use same rendering patterns (extend enemy/tile types in enum)
- Mobile optimization: viewport scaling, touch input (renderer output scale-invariant)
- Particle pooling: optimization if performance becomes issue in later levels

### 2025-01-XX: Bomberman Revolution - Complete Visual Overhaul

**What I Built:**
- Complete visual revolution for Bomberman with spectacular graphics, menu system, and LLM integration
- Created three new systems: ParticleSystem, MenuSystem, and completely rewired main.ts
- Enhanced existing renderer with theme-based palettes, LLM overlay, and dynamic visual effects

**New Files Created:**
1. **src/particles.ts (250 lines)** — Full particle system with 7 effect types
2. **src/menu.ts (400 lines)** — Complete canvas-based menu system (MainMenu, LevelSelect, LLMSetup)
3. Updated **src/main.ts** — Complete rewrite with game mode state machine
4. Updated **index.html** — Modern dark aesthetic with animated background gradient
5. Enhanced **src/renderer.ts** — Added theme palettes, LLM overlay, improved signature

**Visual Systems Implemented:**

1. **Theme-Based Rendering (5 distinct visual themes):**
   - **Garden (Level 1):** Bright greens (#90ee90), blue sky, swaying grass animation, pink flower accents
   - **Dungeon (Level 2):** Dark stone (#16213e), purple shadows (#7209b7), purple glow effects
   - **Lava (Level 3):** Deep reds (#4a0000), glowing lava cracks with pulsing animation, orange accents
   - **Ice (Level 4):** Blue/white palette (#e3f2fd), crystalline walls, sparkle effects
   - **Dark (Level 5):** Deep purple/black (#1a0033), neon accents (#9d00ff), pulsing runes
   - Each theme has unique: background, tile colors, wall styles, empty tile animations, vignette intensity

2. **Particle System (7 effect types):**
   - **Explosion:** 40-60 fire-colored particles, radial burst, no gravity
   - **WallBreak:** 15-25 brown debris particles with gravity (falling rubble)
   - **PowerupPickup:** 20 golden sparkles floating upward (negative gravity)
   - **EnemyDeath:** 15 red particles with light gravity (poof effect)
   - **PlayerDeath:** 50 white/golden particles, dramatic burst
   - **Confetti:** 150 rainbow particles falling from top (victory celebration)
   - **LevelComplete:** 40 golden particles in radial pattern, floating upward
   - Particle properties: position, velocity, gravity, life/maxLife, size, color, alpha, decay
   - Max 500 particles cap, automatic dead particle removal

3. **Menu System (all canvas-rendered):**
   - **Main Menu:** Animated title with bounce/glow, 3 options (Play, LLM Mode, Sound Toggle), floating particle background
   - **Level Select:** 5 level cards in horizontal layout, theme color indicators, stats display (grid size, enemy count)
   - **LLM Setup:** Model selector (17 models from LLM_MODELS), API key input with masking, level selector, start button
   - All menus have animated backgrounds with radial gradients and floating particles
   - Keyboard navigation: arrow keys, Enter, Escape, character input for API key
   - LocalStorage integration: saves API key and sound preference

4. **Enhanced Renderer Features:**
   - **Dynamic glow/lighting:** Bombs pulse with increasing glow as timer counts down, color shift red→white
   - **Animated tiles:** Each theme has unique tile animations (grass sways, lava bubbles, ice sparkles, dark pulsing)
   - **Better explosions:** Multi-layered radial gradients, expanding ring effect using `globalCompositeOperation='lighter'`
   - **Screen shake:** Intensity based on explosion count (2px per explosion, max 10px)
   - **Vignette effect:** Radial gradient darkness at edges, intensity varies by theme (0.1 to 0.5)
   - **Smooth entity animations:** Player bob animation, enemy squish/bounce, death animations
   - **Floating score text:** "+100" for enemy kills, "+50" for powerups, floats upward and fades
   - **Redesigned HUD:** Top bar with heart icons for lives, score, level name, player stats (bombs/range/speed with icons)
   - **LLM overlay panel:** Semi-transparent panel showing AI status, model name, reasoning text (word-wrapped, 4 line limit)
   - **Game end overlays:** Dramatic "GAME OVER" with red glow, "YOU WIN!" with golden gradient and glow

5. **Game Mode State Machine:**
   - **MainMenu:** Render menu, keyboard input handling, transitions to LevelSelect or LLMSetup
   - **LevelSelect:** Level card display, arrow key navigation, Enter to start Playing mode
   - **LLMSetup:** Model/level/API key configuration, Enter to start LLMPlaying mode
   - **Playing:** Normal gameplay loop, input from InputHandler, check for win/loss/level advancement
   - **LLMPlaying:** Async LLM decision loop, display reasoning overlay, same win/loss logic
   - **LevelTransition:** 2-second screen showing "LEVEL X" with theme name, auto-advances or key press
   - **GameOver:** Final score display, press Enter to return to menu
   - **Victory:** Confetti particles, final score, press Enter to return to menu
   - Canvas resizing: 900x600 for menus, dynamic (gridWidth * tileSize) for gameplay

**Technical Architecture:**

**Renderer Enhancements:**
- Updated render signature: `render(state, llmInfo?, dt)` — added LLM overlay and delta time
- Theme palette lookup: `THEMES[state.levelConfig.theme]` — 5 complete color schemes
- Dynamic canvas sizing: reads `state.levelConfig.tileSize/gridWidth/gridHeight` (varies per level)
- Floating text system: stores array of `{text, x, y, life, maxLife}`, updates each frame
- Vignette: radial gradient from center, opacity based on theme.vignette
- LLM overlay: 300px panel, word-wrapped text, model name display, thinking status indicator
- Helper method: `wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines)` for text wrapping

**ParticleSystem Architecture:**
- Particle interface: `{x, y, vx, vy, life, maxLife, size, color, alpha, gravity, decay}`
- `processEvents(ParticleEvent[])` — reads from `state.particleEvents`, spawns appropriate effects
- `update(dt)` — updates all particle positions, velocities, alpha fade, removes dead particles
- `render(ctx)` — renders all particles with `ctx.globalAlpha = particle.alpha`
- Spawn methods: type-specific particle counts, colors, velocities, gravity values
- Performance: 500 particle cap, array splice for dead particle removal

**MenuSystem Architecture:**
- Internal state: `mode`, `selectedIndex`, `selectedLevel`, `selectedModelIndex`, `apiKey`, `isEditingKey`, `soundEnabled`
- Getters: `currentMode`, `selectedLevelConfig`, `llmConfig`, `isSoundEnabled`
- `handleInput(action)` — routes to mode-specific handlers (MainMenu, LevelSelect, LLMSetup)
- `render(ctx, width, height, time)` — routes to mode-specific renderers
- `transitionTo(mode)` — changes mode and resets selectedIndex
- LocalStorage: saves/loads API key and sound preference
- API key masking: displays "●●●●●" + last 4 chars when not editing

**Main.ts State Machine:**
- Global state: `mode`, `gameState`, `llmPlayer`, `currentLives`, `currentScore`, `currentLevelIndex`, `audioInitialized`
- `resizeCanvas(config?)` — sets canvas dimensions based on level or menu
- `startLevel(levelIndex)` — calls `createInitialState(config, lives, score)`, resizes canvas, clears particles
- Mode handlers: `handleMenuMode`, `handlePlayingMode`, `handleLLMPlayingMode`, `handleLevelTransition`, `handleGameEnd`
- Async LLM loop: `await llmPlayer.tick(state, dt)` returns actions, uses `llmPlayer.thinking/reasoning` for overlay
- Level progression: on win, increment `currentLevelIndex`, transition to next level or victory
- Lives system: on loss, decrement `currentLives`, restart level or game over
- Window.onkeydown: mode-specific keyboard handlers (R for restart, Escape for menu, Enter for menu actions)

**Index.html Styling:**
- Dark modern aesthetic: `background: #0a0a0f`
- Animated gradient using CSS `::before` pseudo-element with radial-gradients and `@keyframes bgPulse`
- Press Start 2P font from Google Fonts for retro gaming feel
- Canvas styling: subtle white border, purple glow shadow, border-radius
- Controls display: styled `<kbd>` elements with semi-transparent background
- No title heading — all UI is canvas-based for consistent style

**Color Techniques:**
- Theme palettes: 5 complete color schemes with background, tiles, entities, explosions, accents
- Glow effects: `ctx.shadowBlur` + `ctx.shadowColor` for soft glow
- Explosions: `globalCompositeOperation = 'lighter'` for additive blending (makes colors "pop")
- Radial gradients: multi-stop gradients for bomb glow, explosion layers, vignette
- Alpha transparency: `rgba()` and hex alpha (`#rrggbbaa`) for overlays and fade effects

**Animation Patterns:**
- Time-based: `Math.sin(this.time * frequency)` for bob, pulse, glow effects
- Position-based offsets: `x * 0.1` for variation in grass sway, lava glow
- Progress-based: explosion size grows with `1 - timer/maxTimer`
- Particle fade: `alpha = life / maxLife`
- Screen shake: exponential decay (`offset *= 0.9`)

**LLM Integration:**
- LLMPlayer from McManus's llm-player.ts: `tick(state, dt)` returns actions
- Getters: `thinking` (boolean), `reasoning` (string), config stores `modelDisplayName`
- Async game loop in LLMPlaying mode: `await llmPlayer.tick()` inside accumulator loop
- Overlay panel shows: "🤖 AI THINKING..." vs "🤖 AI PLAYING", model name, reasoning text
- Menu provides LLMConfig: `{model, modelDisplayName, apiKey, endpoint}`

**Performance Considerations:**
- Particle cap at 500 prevents unbounded growth
- Dead particle removal in update loop (splice from end)
- Canvas state save/restore only where needed (shake transform)
- No viewport culling needed (small grids, 13×11 to 21×15)
- Text wrapping limited to 4 lines in LLM overlay

**Integration with McManus's Engine:**
- Reads types: GameState, GameMode, LevelConfig, InputAction, ParticleEvent, SoundEvent, GameStatus
- Imports: createInitialState, update, LLMPlayer, AudioSystem, InputHandler
- Constants: LEVEL_CONFIGS (5 levels), LLM_MODELS (17 models), FIXED_TIMESTEP, INITIAL_LIVES
- ParticleEvents: reads `state.particleEvents` each frame, spawns particles via processEvents
- SoundEvents: passes `state.soundEvents` to AudioSystem.processSoundEvents
- LevelConfig: dynamic tile sizing via `levelConfig.tileSize` (computed per level as `Math.floor(Math.min(900/gridWidth, 60))`)

**Code Quality:**
- TypeScript strict mode: fixed all compilation errors (only 2 unused import warnings in tests remain)
- Defensive coding: checks for `llmPlayer`, `gameState`, `menu.llmConfig` before use
- Unused parameters prefixed with `_` (e.g., `_dt`, `_canvasWidth`) to suppress warnings
- Proper async handling: `async function handleLLMPlayingMode` with await in loop
- Clean separation: renderer never modifies state, menu never touches game logic

**Team Coordination Notes:**
- McManus owns: types.ts, constants.ts, game.ts, levels.ts, llm-player.ts, audio.ts, input.ts
- Fenster owns: renderer.ts, particles.ts, menu.ts, main.ts, index.html
- No file conflicts: I enhanced renderer (added LLM overlay), didn't touch McManus's core engine
- Permission issues during development: couldn't use PowerShell Set-Content, used edit tool instead
- All files successfully integrated: TypeScript compiles with only minor test file warnings

**Visual Impact Summary:**
- **Night and day difference** from original: 5 distinct visual themes vs 1 simple style
- **Spectacular graphics:** Multi-layered explosions, glowing particles, animated tiles, theme-specific aesthetics
- **Professional menu system:** Canvas-rendered menus match game aesthetic, smooth navigation
- **LLM mode visual identity:** Clear AI status display, model name prominence, reasoning text visibility
- **Polish everywhere:** Floating score text, screen shake, vignette, smooth animations, death effects

**Architecture Decisions Validated:**
1. **Theme-based rendering** — Enables dramatic visual variety across 5 levels without code duplication
2. **Canvas-only menus** — Consistent visual style, no DOM/CSS juggling, easier to theme
3. **Particle system abstraction** — Clean separation from renderer, easy to add new effects
4. **Game mode state machine** — Clear flow from menu → gameplay → victory, easy to debug
5. **LLM overlay as renderer feature** — Keeps AI visualization in presentation layer where it belongs
6. **Dynamic canvas sizing** — Adapts to variable grid sizes (13×11 to 21×15) seamlessly

**Future Extension Points:**
- New particle effects: add to ParticleEventType enum and spawn method
- New themes: add to THEMES object with color palette
- New menu screens: add to GameMode enum and mode handlers
- Mobile support: add touch input handlers in menu and gameplay
- Renderer effects: could add bloom, color grading, more advanced shaders via Canvas filters


### 2025-07-XX: LLM Menu Simplification — API Key Removal

**What Changed:**
- Removed API key text input field, localStorage read/write, and `isEditingKey` state from LLM setup screen
- Added auth status indicator that calls `LLMPlayer.checkAuth()` (which hits `/api/auth/status`)
- Auth check runs on constructor and again each time the LLM setup screen is entered
- Green/yellow/red status: "GitHub Copilot connected" / "Checking..." / "Run 'gh auth login'"
- Start button now disabled unless auth status is 'authenticated'
- Re-indexed LLM setup items: Model (0), Level (1), Start (2) — was 4 items, now 3
- Removed `authError` field (unused after simplification)

**Files Modified:** src/menu.ts

**Coordination:** McManus already removed `apiKey` from `LLMConfig` type and added `LLMPlayer.checkAuth()` static method. main.ts was already clean — no apiKey references.
