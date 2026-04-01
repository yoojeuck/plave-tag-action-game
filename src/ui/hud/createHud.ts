import type { SimulationEvent, SimulationSnapshot } from "../../game/simulation/types";

export interface HudApi {
  update(snapshot: SimulationSnapshot): void;
  applyEvents(events: SimulationEvent[]): void;
  setPaused(paused: boolean): void;
  destroy(): void;
}

function formatObjective(snapshot: SimulationSnapshot): string {
  if (snapshot.runState.clearState === "boss") {
    return "Objective: Mini Boss Defeat";
  }
  if (snapshot.runState.clearState === "cleared") {
    return "Objective: Run Complete";
  }
  if (snapshot.runState.clearState === "failed") {
    return "Objective: Retry";
  }
  return `Objective: Segment ${snapshot.runState.segmentIndex + 1} Clear`;
}

export function createHud(root: HTMLElement): HudApi {
  const hud = document.createElement("div");
  hud.className = "hud-root";

  const leftCluster = document.createElement("div");
  leftCluster.className = "hud-cluster hud-left";
  leftCluster.innerHTML = `
    <div class="hud-chip" data-id="hp">HP 0</div>
    <div class="hud-chip" data-id="combo">Combo 0</div>
    <div class="hud-chip" data-id="score">Score 0</div>
  `;

  const rightCluster = document.createElement("div");
  rightCluster.className = "hud-cluster hud-right";
  rightCluster.innerHTML = `
    <div class="hud-chip" data-id="member">Member -</div>
    <div class="hud-chip" data-id="objective">Objective -</div>
  `;

  const eventFeed = document.createElement("div");
  eventFeed.className = "hud-feed";
  eventFeed.textContent = "5-Member Tag Action Ready";

  const pauseOverlay = document.createElement("div");
  pauseOverlay.className = "pause-overlay";
  pauseOverlay.textContent = "PAUSED";
  pauseOverlay.hidden = true;

  hud.append(leftCluster, rightCluster, eventFeed, pauseOverlay);
  root.append(hud);

  const hpChip = leftCluster.querySelector<HTMLElement>('[data-id="hp"]')!;
  const comboChip = leftCluster.querySelector<HTMLElement>('[data-id="combo"]')!;
  const scoreChip = leftCluster.querySelector<HTMLElement>('[data-id="score"]')!;
  const memberChip = rightCluster.querySelector<HTMLElement>('[data-id="member"]')!;
  const objectiveChip = rightCluster.querySelector<HTMLElement>('[data-id="objective"]')!;

  function pushFeed(text: string): void {
    eventFeed.textContent = text;
    eventFeed.classList.remove("pulse");
    // Force restart for repeated same message.
    void eventFeed.offsetWidth;
    eventFeed.classList.add("pulse");
  }

  return {
    update(snapshot) {
      hpChip.textContent = `HP ${Math.max(0, Math.round(snapshot.runState.hpShared))}`;
      comboChip.textContent = `Combo ${snapshot.runState.combo}`;
      scoreChip.textContent = `Score ${Math.round(snapshot.runState.score)}`;
      memberChip.textContent = `Member ${snapshot.activeMember.id.toUpperCase()}`;
      objectiveChip.textContent = formatObjective(snapshot);
    },

    applyEvents(events) {
      if (events.length === 0) {
        return;
      }

      const recent = events[events.length - 1];
      switch (recent.type) {
        case "tag_switched":
          pushFeed(`Tag: ${String(recent.payload?.to ?? "").toUpperCase()}`);
          break;
        case "segment_started":
          pushFeed(`Segment ${recent.payload?.segment} Start`);
          break;
        case "segment_cleared":
          pushFeed(`Segment ${recent.payload?.segment} Clear`);
          break;
        case "boss_started":
          pushFeed("Mini Boss Appeared");
          break;
        case "boss_defeated":
          pushFeed("Mini Boss Defeated");
          break;
        case "run_cleared":
          pushFeed("Run Complete");
          break;
        case "run_failed":
          pushFeed("Down... Retry");
          break;
        default:
          break;
      }
    },

    setPaused(paused) {
      pauseOverlay.hidden = !paused;
    },

    destroy() {
      hud.remove();
    }
  };
}
