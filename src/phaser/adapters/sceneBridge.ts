import { GameSimulation } from "../../game/simulation/game-simulation";
import type { FrameInput, SimulationEvent, SimulationSnapshot } from "../../game/simulation/types";

export class SceneBridge {
  private readonly simulation: GameSimulation;
  private snapshot: SimulationSnapshot;

  constructor(simulation?: GameSimulation) {
    this.simulation = simulation ?? new GameSimulation();
    this.snapshot = this.simulation.getSnapshot();
  }

  update(deltaMs: number, input: FrameInput): SimulationSnapshot {
    this.snapshot = this.simulation.update(deltaMs, input);
    return this.snapshot;
  }

  getSnapshot(): SimulationSnapshot {
    return this.snapshot;
  }

  consumeEvents(): SimulationEvent[] {
    return this.simulation.consumeEvents();
  }
}
