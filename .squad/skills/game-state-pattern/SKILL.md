---
name: "game-state-pattern"
description: "Pure functional game state management for Bomberman"
domain: "game-architecture"
confidence: "high"
source: "earned"
---

## Context
This project uses a pure functional approach to game state. All game logic is expressed as `(state, input, dt) → newState` with no side effects. This pattern applies whenever adding new game features, entities, or mechanics.

## Patterns

### State Shape
All game data lives in `GameState` (defined in `src/types.ts`). New features add properties here — never create separate global state.

### Update Pipeline
`src/game.ts` runs sub-updates in sequence:
1. `movePlayer` — apply input to player position
2. `handleBombPlacement` — check input + place bombs
3. `tickBombs` — countdown + detonate
4. `tickExplosions` — countdown + remove
5. `checkPowerupPickup` — collision with powerups
6. `checkPlayerDeath` — explosion collision

New mechanics insert into this pipeline at the right position.

### Adding a New Entity Type
1. Define interface in `src/types.ts`
2. Add array to `GameState`
3. Add tick function in `src/game.ts`
4. Add render function in `src/renderer.ts`
5. Wire into `update()` pipeline

### Grid Conventions
- Grid position: `{ row, col }` — row is Y, col is X
- Pixel position: `{ x, y }` — center of entity
- Convert with `pixelToGrid()` and `gridCenter()` in `src/game.ts`

## Examples
```typescript
// Pure update — no side effects
export function update(state: GameState, actions: InputAction[], dt: number): GameState {
  let next = deepCopyState(state);
  next = movePlayer(next, actions, dt);
  next = handleBombPlacement(next, actions);
  // ... more steps
  return next;
}
```

## Anti-Patterns
- **Don't mutate state** — always spread/copy before modifying
- **Don't put DOM/canvas code in game.ts** — renderer is separate
- **Don't use class inheritance for entities** — use plain data objects + interfaces
- **Don't store derived data in state** — compute it in render or update
