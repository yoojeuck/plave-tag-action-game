import type { Action } from "./actions";

export interface InputSourceState {
  move: number;
  actions: Partial<Record<Action, boolean>>;
}

export interface InputSnapshot {
  move: number;
  actions: ReadonlySet<Action>;
}

export function createEmptySourceState(): InputSourceState {
  return {
    move: 0,
    actions: {}
  };
}

export function clampAxis(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

export function mergeInputStates(...sources: InputSourceState[]): InputSnapshot {
  const merged = new Set<Action>();
  let move = 0;

  for (const source of sources) {
    move += source.move;
    for (const [action, pressed] of Object.entries(source.actions) as Array<[Action, boolean | undefined]>) {
      if (pressed) {
        merged.add(action);
      }
    }
  }

  return {
    move: clampAxis(move),
    actions: merged
  };
}

export class InputBindings {
  private readonly pcState: InputSourceState = createEmptySourceState();
  private readonly mobileState: InputSourceState = createEmptySourceState();

  setPcMove(axis: number): void {
    this.pcState.move = clampAxis(axis);
  }

  setMobileMove(axis: number): void {
    this.mobileState.move = clampAxis(axis);
  }

  setPcAction(action: Action, pressed: boolean): void {
    this.pcState.actions[action] = pressed;
  }

  setMobileAction(action: Action, pressed: boolean): void {
    this.mobileState.actions[action] = pressed;
  }

  resetMobileState(): void {
    this.mobileState.move = 0;
    this.mobileState.actions = {};
  }

  getSnapshot(): InputSnapshot {
    return mergeInputStates(this.pcState, this.mobileState);
  }
}
