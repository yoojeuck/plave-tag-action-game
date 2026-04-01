import { describe, expect, it } from "vitest";
import { calculateClearScore, determineRank, formatRunTime } from "../src/game/platformer/score";

describe("clear score", () => {
  it("rewards a strong clean run", () => {
    const score = calculateClearScore({
      notesCollected: 28,
      totalNotes: 28,
      enemiesDefeated: 8,
      hitsTaken: 0,
      tagSwitches: 6,
      timeMs: 180000
    });

    expect(score).toBeGreaterThan(9500);
    expect(determineRank(score)).toBe("S");
  });

  it("drops the rank when the run is slow and messy", () => {
    const score = calculateClearScore({
      notesCollected: 9,
      totalNotes: 28,
      enemiesDefeated: 2,
      hitsTaken: 4,
      tagSwitches: 1,
      timeMs: 420000
    });

    expect(score).toBeLessThan(6200);
    expect(determineRank(score)).toBe("C");
  });

  it("formats runtime as mm:ss", () => {
    expect(formatRunTime(125000)).toBe("02:05");
  });
});
