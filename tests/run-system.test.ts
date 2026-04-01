import { describe, expect, it } from "vitest";
import { RunSystem } from "../src/game/simulation/run-system";
import type { RunState, SimulationEvent } from "../src/game/simulation/types";

function createRunState(): RunState {
  return {
    segmentIndex: 0,
    hpShared: 600,
    combo: 0,
    tagCooldownMs: 0,
    score: 0,
    clearState: "running"
  };
}

describe("RunSystem", () => {
  it("progresses 3 segments then starts boss and clears on boss defeat", () => {
    const runSystem = new RunSystem();
    const runState = createRunState();
    const events: SimulationEvent[] = [];

    runSystem.init(runState, 0, (event) => events.push(event));

    for (let i = 0; i < 3; i += 1) {
      runSystem.onEnemyDefeated(runState, 100 + i, (event) => events.push(event), false);
    }
    for (let i = 0; i < 4; i += 1) {
      runSystem.onEnemyDefeated(runState, 200 + i, (event) => events.push(event), false);
    }
    for (let i = 0; i < 5; i += 1) {
      runSystem.onEnemyDefeated(runState, 300 + i, (event) => events.push(event), false);
    }

    expect(runState.clearState).toBe("boss");
    runSystem.onEnemyDefeated(runState, 999, (event) => events.push(event), true);
    expect(runState.clearState).toBe("cleared");

    expect(events.map((event) => event.type)).toEqual([
      "segment_started",
      "segment_cleared",
      "segment_started",
      "segment_cleared",
      "segment_started",
      "segment_cleared",
      "boss_started",
      "boss_defeated",
      "run_cleared"
    ]);
  });
});
