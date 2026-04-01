import type { RunState, SimulationEvent } from "./types";

type EmitEvent = (event: SimulationEvent) => void;

const REQUIRED_KILLS_BY_SEGMENT = [3, 4, 5] as const;

export class RunSystem {
  private defeatsInCurrentSegment = 0;

  init(runState: RunState, atMs: number, emit: EmitEvent): void {
    runState.segmentIndex = 0;
    runState.clearState = "running";
    this.defeatsInCurrentSegment = 0;

    emit({
      type: "segment_started",
      atMs,
      payload: { segment: 1 }
    });
  }

  onEnemyDefeated(runState: RunState, atMs: number, emit: EmitEvent, isBoss: boolean): void {
    if (runState.clearState === "cleared" || runState.clearState === "failed") {
      return;
    }

    if (isBoss) {
      emit({
        type: "boss_defeated",
        atMs
      });
      runState.clearState = "cleared";
      emit({
        type: "run_cleared",
        atMs,
        payload: { finalScore: runState.score }
      });
      return;
    }

    this.defeatsInCurrentSegment += 1;
    const required = REQUIRED_KILLS_BY_SEGMENT[runState.segmentIndex] ?? REQUIRED_KILLS_BY_SEGMENT[2];

    if (this.defeatsInCurrentSegment < required) {
      return;
    }

    emit({
      type: "segment_cleared",
      atMs,
      payload: { segment: runState.segmentIndex + 1 }
    });

    this.defeatsInCurrentSegment = 0;
    if (runState.segmentIndex < 2) {
      runState.segmentIndex += 1;
      emit({
        type: "segment_started",
        atMs,
        payload: { segment: runState.segmentIndex + 1 }
      });
      return;
    }

    runState.clearState = "boss";
    emit({
      type: "boss_started",
      atMs
    });
  }

  onPlayerDown(runState: RunState, atMs: number, emit: EmitEvent): void {
    if (runState.clearState === "failed" || runState.clearState === "cleared") {
      return;
    }
    runState.clearState = "failed";
    emit({
      type: "run_failed",
      atMs,
      payload: {
        finalScore: runState.score
      }
    });
  }
}
