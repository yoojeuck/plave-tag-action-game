import type { Action } from "../../game/input/actions";
import type { InputBindings } from "../../game/input/bindings";

export interface VirtualControlsOptions {
  enabled: boolean;
}

export interface VirtualControlsApi {
  destroy(): void;
}

function bindHoldAction(button: HTMLButtonElement, onChange: (pressed: boolean) => void): void {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.classList.add("active");
    button.setPointerCapture(event.pointerId);
    onChange(true);
  });

  const release = (event?: PointerEvent) => {
    if (event && button.hasPointerCapture(event.pointerId)) {
      button.releasePointerCapture(event.pointerId);
    }
    button.classList.remove("active");
    onChange(false);
  };

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", () => {
    button.classList.remove("active");
    onChange(false);
  });
}

function makeActionButton(label: string, action: Action, bindings: InputBindings): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "vc-btn vc-action";
  button.textContent = label;
  bindHoldAction(button, (pressed) => bindings.setMobileAction(action, pressed));
  return button;
}

export function createVirtualControls(
  root: HTMLElement,
  bindings: InputBindings,
  options: VirtualControlsOptions
): VirtualControlsApi {
  if (!options.enabled) {
    return {
      destroy() {
        bindings.resetMobileState();
      }
    };
  }

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

  rightPad.append(
    makeActionButton("JUMP", "jump", bindings),
    makeActionButton("ATK", "attack", bindings),
    makeActionButton("DASH", "dash", bindings),
    makeActionButton("TAG", "tag_next", bindings),
    makeActionButton("ULT", "ultimate", bindings)
  );

  layer.append(leftPad, rightPad);
  root.append(layer);

  return {
    destroy() {
      layer.remove();
      bindings.resetMobileState();
    }
  };
}
