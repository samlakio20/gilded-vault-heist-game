// Keyboard and mouse input, read fresh every frame. Movement keys are
// WASD and the arrow keys; Shift sprints; E picks up; Q drops a smoke bomb;
// F fires the EMP; P pauses; M mutes; Enter confirms; R restarts a level.

export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_SMOKE = 'smoke';
export const ACTION_EMP = 'emp';
export const ACTION_PICKUP = 'pickup';
export const ACTION_MUTE = 'mute';
export const ACTION_RESTART = 'restart';

const KEY_ACTIONS = {
  Enter: ACTION_CONFIRM,
  ' ': ACTION_CONFIRM,
  p: ACTION_PAUSE,
  P: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  q: ACTION_SMOKE,
  Q: ACTION_SMOKE,
  f: ACTION_EMP,
  F: ACTION_EMP,
  e: ACTION_PICKUP,
  E: ACTION_PICKUP,
  m: ACTION_MUTE,
  M: ACTION_MUTE,
  r: ACTION_RESTART,
  R: ACTION_RESTART,
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, clicked: false, down: false };

  function keyOf(event) {
    return event.key.length === 1 ? event.key : event.key;
  }

  window.addEventListener('keydown', (event) => {
    const key = keyOf(event);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(key);
    held.add(key);
  });
  window.addEventListener('keyup', (event) => held.delete(keyOf(event)));
  window.addEventListener('blur', () => {
    held.clear();
    mouse.down = false;
  });

  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.down = true;
    mouse.clicked = true;
  });
  window.addEventListener('pointerup', () => {
    mouse.down = false;
  });

  function axis(neg, pos) {
    return (held.has(pos) ? 1 : 0) - (held.has(neg) ? 1 : 0);
  }

  return {
    /** Normalised movement vector for this frame. */
    move() {
      const x = axis('a', 'd') + axis('ArrowLeft', 'ArrowRight');
      const y = axis('w', 's') + axis('ArrowUp', 'ArrowDown');
      const len = Math.hypot(x, y);
      return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
    },
    sprint() {
      return held.has('Shift');
    },
    /** True once, on the frame the action key went down. */
    action(name) {
      for (const key of pressed) {
        if (KEY_ACTIONS[key] === name) return true;
      }
      return false;
    },
    mouse,
    /** Call at the end of each frame: pressed keys and clicks are one-frame. */
    endFrame() {
      pressed.clear();
      mouse.clicked = false;
    },
  };
}
