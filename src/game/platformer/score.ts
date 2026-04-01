export interface ScoreInput {
  notesCollected: number;
  totalNotes: number;
  enemiesDefeated: number;
  hitsTaken: number;
  tagSwitches: number;
  timeMs: number;
}

export function calculateClearScore(input: ScoreInput): number {
  const noteScore = input.notesCollected * 140;
  const fullSetBonus = input.notesCollected === input.totalNotes ? 2200 : 0;
  const enemyScore = input.enemiesDefeated * 180;
  const tagBonus = Math.min(input.tagSwitches * 80, 800);
  const safetyBonus = Math.max(0, 1800 - input.hitsTaken * 320);
  const timeBonus = Math.max(0, 6500 - Math.floor(input.timeMs / 20));
  return noteScore + fullSetBonus + enemyScore + tagBonus + safetyBonus + timeBonus;
}

export function determineRank(score: number): "S" | "A" | "B" | "C" {
  if (score >= 9500) {
    return "S";
  }
  if (score >= 7600) {
    return "A";
  }
  if (score >= 5600) {
    return "B";
  }
  return "C";
}

export function formatRunTime(timeMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(timeMs / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
