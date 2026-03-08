# Revolution Engine Architecture

## Decision
Complete game engine rewrite with multi-level progression, LLM player support, lives system, scoring, and smart enemy AI.

## Context
The game needed a major expansion from single-level Bomberman to a full 5-level campaign with:
- Progressive difficulty scaling
- LLM-powered player controller
- Lives and scoring systems
- Advanced enemy AI (pathfinding)
- Sound and particle event systems
- Level transitions with state preservation

## Rationale

### Pure Functional Core Maintained
- All game logic remains pure functions — `update(state, actions, dt) → newState`
- Sound and particle events are **data**, not side effects
- Renderer/audio systems consume event arrays each frame
- Enables testability and predictable behavior

### Configuration-Driven Design
- `LEVEL_CONFIGS` array defines all 5 levels
- Each level has: grid size, enemy count/speed/smartness, timers, theme, density
- Easy to add new levels or tune difficulty
- tileSize computed dynamically to fit canvas: `Math.floor(Math.min(900 / gridWidth, 60))`

### Smart Enemy AI
- `enemySmartness` probability (0.1 → 0.8 across levels)
- Uses Manhattan distance to pick direction toward player
- Fallback to classic "prefer straight" random walk
- Creates escalating challenge without complex pathfinding

### Lives & Respawn System
- Player starts with 3 lives (INITIAL_LIVES)
- On death: decrement lives, respawn at (1,1), clear bombs/explosions
- Game over only when lives reach 0
- More forgiving for new players, maintains tension

### Score System
- Points for: enemy kills (100), wall breaks (10), powerups (50), level clear (500)
- Encourages aggressive, skillful play
- Preserved across level transitions
- Visible feedback for player actions

### Sound & Particle Events
- Events added to `soundEvents[]` and `particleEvents[]` during game logic
- Arrays cleared at start of each frame
- Renderer/audio consume events without coupling to game logic
- Clean separation of concerns

### LLM Player Controller
- Async tick pattern with time accumulation (0.5s decision interval)
- Serializes game state as ASCII art for vision-language models
- System prompt explains rules and strategy
- Graceful error handling (fallback to random action)
- Enables AI vs AI gameplay or training

## Implementation Notes

### Files Modified
- `src/types.ts` — Added GameMode, LevelConfig, LLMConfig, SoundEvent, ParticleEvent
- `src/constants.ts` — LEVEL_CONFIGS array, LLM_MODELS, score constants
- `src/game.ts` — Lives, score, events, smart AI, level transitions, respawn
- `src/levels.ts` — Configurable generator using LevelConfig
- `src/audio.ts` — NEW: Web Audio oscillator-based sounds
- `src/llm-player.ts` — NEW: LLM player controller
- `vite.config.ts` — Proxy for GitHub Models API

### API Changes
- `createInitialState(levelConfig, lives?, score?)` — now takes LevelConfig instead of grid
- `transitionToNextLevel(state)` — NEW: creates next level state with preserved lives/score
- Test suite updated to use new API

### Backwards Compatibility
- Legacy constants exported for existing code (`GRID_WIDTH`, `GRID_HEIGHT`, etc.)
- `createLevel1()` still works (uses LEVEL_CONFIGS[0])
- Gradual migration path for Fenster's renderer

## Team Impact
- **Fenster** (renderer) will integrate: menus, level select, LLM setup UI, victory/game over screens
- **McManus** (game dev) owns: game.ts, types.ts, constants.ts, levels.ts, audio.ts, llm-player.ts
- Clear separation: McManus = logic, Fenster = rendering/UI
- main.ts will be rewritten by Fenster to use new API

## Future Considerations
- Could add more levels (pattern established)
- Boss fights could use same level config pattern
- Multiplayer could use same event system
- Sound system could be swapped for sample-based audio without changing game logic
- LLM player could be used for procedural testing or difficulty tuning

## Date
2024-01-XX

## Author
McManus (Game Dev)
