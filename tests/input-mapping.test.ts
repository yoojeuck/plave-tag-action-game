import { describe, expect, it } from "vitest";
import { InputBindings, mergeInputStates } from "../src/game/input/bindings";

describe("Input mapping", () => {
  it("merges mobile and pc states without action collision", () => {
    const merged = mergeInputStates(
      {
        move: -1,
        actions: { attack: true, dash: true }
      },
      {
        move: 1,
        actions: { attack: true, tag_next: true }
      }
    );

    expect(merged.move).toBe(0);
    expect(merged.actions.has("attack")).toBe(true);
    expect(merged.actions.has("dash")).toBe(true);
    expect(merged.actions.has("tag_next")).toBe(true);
  });

  it("keeps remaining source active when one source releases", () => {
    const bindings = new InputBindings();
    bindings.setPcAction("attack", true);
    bindings.setMobileAction("attack", true);
    expect(bindings.getSnapshot().actions.has("attack")).toBe(true);

    bindings.setMobileAction("attack", false);
    expect(bindings.getSnapshot().actions.has("attack")).toBe(true);

    bindings.setPcAction("attack", false);
    expect(bindings.getSnapshot().actions.has("attack")).toBe(false);
  });
});
