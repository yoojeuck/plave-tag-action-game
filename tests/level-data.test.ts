import { describe, expect, it } from "vitest";
import { DREAM_STAGE_LEVEL } from "../src/game/platformer/level-data";

describe("dream stage level", () => {
  it("places the goal after the start and includes checkpoints", () => {
    expect(DREAM_STAGE_LEVEL.goalX).toBeGreaterThan(DREAM_STAGE_LEVEL.startX);
    expect(DREAM_STAGE_LEVEL.checkpoints.length).toBeGreaterThan(0);
    expect(DREAM_STAGE_LEVEL.sections.length).toBe(3);
  });

  it("contains a meaningful amount of collectibles and patrols", () => {
    expect(DREAM_STAGE_LEVEL.notes.length).toBeGreaterThanOrEqual(20);
    expect(DREAM_STAGE_LEVEL.enemies.length).toBeGreaterThanOrEqual(6);
    expect(DREAM_STAGE_LEVEL.blocks.filter((block) => block.reward === "note").length).toBeGreaterThan(0);
  });
});
