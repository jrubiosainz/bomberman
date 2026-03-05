import { InputAction } from './types';

const KEY_MAP: Record<string, InputAction> = {
  ArrowUp: InputAction.Up,
  ArrowDown: InputAction.Down,
  ArrowLeft: InputAction.Left,
  ArrowRight: InputAction.Right,
  ' ': InputAction.PlaceBomb,
  w: InputAction.Up,
  s: InputAction.Down,
  a: InputAction.Left,
  d: InputAction.Right,
};

export class InputHandler {
  private pressed = new Set<InputAction>();

  constructor() {
    window.addEventListener('keydown', (e) => {
      const action = KEY_MAP[e.key];
      if (action !== undefined) {
        e.preventDefault();
        this.pressed.add(action);
      }
    });

    window.addEventListener('keyup', (e) => {
      const action = KEY_MAP[e.key];
      if (action !== undefined) {
        this.pressed.delete(action);
      }
    });
  }

  /** Returns the set of currently held actions. */
  getActions(): InputAction[] {
    return [...this.pressed];
  }
}
