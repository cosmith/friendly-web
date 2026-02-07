import { InputState } from './types';

// ============================================================
// Input Manager - Keyboard input handling
// ============================================================

export class InputManager {
  private state: InputState = {
    keysDown: new Set(),
    keysPressed: new Set(),
    keysReleased: new Set(),
  };

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (!this.state.keysDown.has(e.code)) {
        this.state.keysPressed.add(e.code);
      }
      this.state.keysDown.add(e.code);
      // Prevent default for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.state.keysDown.delete(e.code);
      this.state.keysReleased.add(e.code);
    });
  }

  isDown(code: string): boolean {
    return this.state.keysDown.has(code);
  }

  isPressed(code: string): boolean {
    return this.state.keysPressed.has(code);
  }

  isReleased(code: string): boolean {
    return this.state.keysReleased.has(code);
  }

  endFrame(): void {
    this.state.keysPressed.clear();
    this.state.keysReleased.clear();
  }
}
