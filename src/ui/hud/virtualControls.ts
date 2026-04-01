import type { Action } from "../../game/input/actions";
import type { InputBindings } from "../../game/input/bindings";

export interface VirtualControlsApi {
  destroy(): void;
}

function bindHoldAction(button: HTMLButtonElement, onChange: (pressed: boolean) => void): void {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.classList.add("active");
    onChange(true);
  });

  const release = () => {
    button.classList.remove("active");
    onChange(false);
  };

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
}

function makeActionButton(label: string, action: Action, bindings: InputBindings): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "vc-btn vc-action";
  button.textContent = label;
  bindHoldAction(button, (pressed) => bindings.setMobileAction(action, pressed));
  return button;
}

export function createVirtualControls(root: HTMLElement, bindings: InputBindings): VirtualControlsApi {
  const layer = document.createElement("div");
  layer.className = "virtual-controls";

  const leftPad = document.createElement("div");
  leftPad.className = "vc-pad vc-left";

  const rightPad = document.createElement("div");
  rightPad.className = "vc-pad vc-right";

  let leftPressed = false;
  let rightPressed = false;
  const syncAxis = () => {
    if (leftPressed === rightPressed) {
      bindings.setMobileMove(0);
      return;
    }
    bindings.setMobileMove(leftPressed ? -1 : 1);
  };

  const moveLeft = document.createElement("button");
  moveLeft.className = "vc-btn vc-move";
  moveLeft.textContent = "◀";
  bindHoldAction(moveLeft, (pressed) => {
    leftPressed = pressed;
    syncAxis();
  });

  const moveRight = document.createElement("button");
  moveRight.className = "vc-btn vc-move";
  moveRight.textContent = "▶";
  bindHoldAction(moveRight, (pressed) => {
    rightPressed = pressed;
    syncAxis();
  });

  leftPad.append(moveLeft, moveRight);

  const jumpBtn = makeActionButton("JUMP", "jump", bindings);
  const attackBtn = makeActionButton("ATK", "attack", bindings);
  const dashBtn = makeActionButton("DASH", "dash", bindings);
  const tagBtn = makeActionButton("TAG", "tag_next", bindings);
  const ultimateBtn = makeActionButton("ULT", "ultimate", bindings);
  const pauseBtn = makeActionButton("PAUSE", "pause", bindings);
  pauseBtn.classList.add("vc-small");

  rightPad.append(jumpBtn, attackBtn, dashBtn, tagBtn, ultimateBtn, pauseBtn);

  layer.append(leftPad, rightPad);
  root.append(layer);

  return {
    destroy() {
      layer.remove();
      bindings.resetMobileState();
    }
  };
}
