import { describe, expect, it } from "vitest";
import { GameSimulation } from "../../src/game/simulation/game-simulation";

describe("Integration Scenario", () => {
  it("emits start -> 3 segments -> boss -> clear order", () => {
    const simulation = new GameSimulation();
    const eventTypes: string[] = simulation.consumeEvents().map((event) => event.type);

    let guard = 0;
    while (simulation.getSnapshot().runState.clearState !== "cleared" && guard < 30) {
      simulation.debugDefeatEnemy();
      eventTypes.push(...simulation.consumeEvents().map((event) => event.type));
      guard += 1;
    }

    expect(simulation.getSnapshot().runState.clearState).toBe("cleared");

    const flow = eventTypes.filter((type) =>
      [
        "segment_started",
        "segment_cleared",
        "boss_started",
        "boss_defeated",
        "run_cleared"
      ].includes(type)
    );

    expect(flow).toEqual([
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
