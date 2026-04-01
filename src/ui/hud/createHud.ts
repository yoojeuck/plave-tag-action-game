import { MEMBER_ORDER, MEMBER_PROFILES } from "../../game/content/members";
import type { SimulationEvent, SimulationSnapshot } from "../../game/simulation/types";

export interface HudOptions {
  touchMode: boolean;
  onStart: () => void;
  onPauseToggle: () => void;
}

export interface HudApi {
  update(snapshot: SimulationSnapshot): void;
  applyEvents(events: SimulationEvent[]): void;
  setPaused(paused: boolean): void;
  setStarted(started: boolean): void;
  destroy(): void;
}

function formatObjective(snapshot: SimulationSnapshot): string {
  if (snapshot.runState.clearState === "boss") {
    return "Mini boss showdown";
  }
  if (snapshot.runState.clearState === "cleared") {
    return "Run complete";
  }
  if (snapshot.runState.clearState === "failed") {
    return "Retry the stage";
  }
  return `Clear segment ${snapshot.runState.segmentIndex + 1}`;
}

function formatFeed(event: SimulationEvent): string | null {
  switch (event.type) {
    case "tag_switched":
      return `Tag shift: ${String(event.payload?.to ?? "").toUpperCase()}`;
    case "segment_started":
      return `Segment ${event.payload?.segment} start`;
    case "segment_cleared":
      return `Segment ${event.payload?.segment} clear`;
    case "boss_started":
      return "Mini boss entered the stage";
    case "boss_defeated":
      return "Mini boss down";
    case "run_cleared":
      return "Encore complete";
    case "run_failed":
      return "Team down";
    case "ultimate_landed":
      return "Ultimate burst";
    default:
      return null;
  }
}

export function createHud(root: HTMLElement, options: HudOptions): HudApi {
  const hud = document.createElement("div");
  hud.className = "hud-root";

  const leftPanel = document.createElement("section");
  leftPanel.className = "hud-panel hud-panel-left";
  leftPanel.innerHTML = `
    <div class="hud-panel-title">Shared vitality</div>
    <div class="hud-meter">
      <div class="hud-meter-fill" data-id="hp-fill"></div>
    </div>
    <div class="hud-inline-stats">
      <span class="hud-pill" data-id="hp">HP 0</span>
      <span class="hud-pill" data-id="combo">Combo 0</span>
      <span class="hud-pill" data-id="score">Score 0</span>
    </div>
    <div class="hud-hint" data-id="legend"></div>
  `;

  const centerFeed = document.createElement("div");
  centerFeed.className = "hud-feed";
  centerFeed.textContent = "5-member tag action online";

  const rightPanel = document.createElement("section");
  rightPanel.className = "hud-panel hud-panel-right";
  rightPanel.innerHTML = `
    <div class="hud-panel-title">Run status</div>
    <div class="hud-status-stack">
      <div class="hud-status-row">
        <span class="hud-pill hud-pill-strong" data-id="member">YEJUN</span>
        <span class="hud-pill" data-id="objective">Clear segment 1</span>
      </div>
      <div class="hud-status-row">
        <span class="hud-pill" data-id="tag">Tag ready</span>
        <span class="hud-pill" data-id="ult">Ultimate charging</span>
      </div>
    </div>
  `;

  const pauseButton = document.createElement("button");
  pauseButton.className = `touch-pause ${options.touchMode ? "" : "is-hidden"}`.trim();
  pauseButton.type = "button";
  pauseButton.textContent = "Pause";
  pauseButton.addEventListener("click", () => options.onPauseToggle());

  const roster = document.createElement("section");
  roster.className = "hud-roster";
  const rosterNodes = new Map<string, HTMLElement>();
  for (const memberId of MEMBER_ORDER) {
    const member = MEMBER_PROFILES[memberId];
    const item = document.createElement("div");
    item.className = "roster-member";
    item.dataset.memberId = memberId;
    item.style.setProperty("--member-accent", `#${member.accentColor.toString(16).padStart(6, "0")}`);
    item.innerHTML = `
      <div class="roster-swatch"></div>
      <div class="roster-copy">
        <div class="roster-name">${member.id.toUpperCase()}</div>
        <div class="roster-role">${member.role}</div>
      </div>
    `;
    rosterNodes.set(memberId, item);
    roster.append(item);
  }

  const helperStrip = document.createElement("div");
  helperStrip.className = "helper-strip";
  helperStrip.innerHTML = `
    <span class="helper-kicker">${options.touchMode ? "Touch mode" : "Keyboard mode"}</span>
    <span class="helper-copy">
      ${
        options.touchMode
          ? "Left pad to move, right buttons to jump, attack, dash, tag, and unleash the ultimate."
          : "Move with A/D or arrow keys. J attack, K dash, L tag, I ultimate, Esc pause."
      }
    </span>
  `;

  const startOverlay = document.createElement("section");
  startOverlay.className = "hud-overlay start-overlay";
  startOverlay.innerHTML = `
    <div class="overlay-card">
      <div class="overlay-kicker">PLAVE fan demo</div>
      <h1 class="overlay-title">Dimension Stage Rush</h1>
      <p class="overlay-copy">
        Switch between five members, chain burst attacks, and clear a three-act side-scrolling stage before the mini boss.
      </p>
      <div class="overlay-grid">
        <div class="overlay-chip">Tag rotation combat</div>
        <div class="overlay-chip">Desktop + mobile controls</div>
        <div class="overlay-chip">Prototype art, finished gameplay shell</div>
      </div>
      <button class="overlay-button" type="button">Start showcase</button>
      <div class="overlay-note">
        Official visuals are referenced for mood only. In-game presentation remains original fan-made placeholder art.
      </div>
    </div>
  `;

  const pauseOverlay = document.createElement("section");
  pauseOverlay.className = "hud-overlay pause-screen";
  pauseOverlay.hidden = true;
  pauseOverlay.innerHTML = `
    <div class="overlay-card overlay-card-small">
      <div class="overlay-kicker">Paused</div>
      <h2 class="overlay-title overlay-title-small">Take a breath</h2>
      <p class="overlay-copy">
        Resume when you're ready. The stage will continue from the exact same moment.
      </p>
      <button class="overlay-button overlay-button-secondary" type="button">Resume</button>
    </div>
  `;

  const startButton = startOverlay.querySelector<HTMLButtonElement>("button")!;
  const resumeButton = pauseOverlay.querySelector<HTMLButtonElement>("button")!;
  startButton.addEventListener("click", () => options.onStart());
  resumeButton.addEventListener("click", () => options.onPauseToggle());

  hud.append(leftPanel, centerFeed, rightPanel, pauseButton, roster, helperStrip, startOverlay, pauseOverlay);
  root.append(hud);

  const hpFill = leftPanel.querySelector<HTMLElement>('[data-id="hp-fill"]')!;
  const hpText = leftPanel.querySelector<HTMLElement>('[data-id="hp"]')!;
  const comboText = leftPanel.querySelector<HTMLElement>('[data-id="combo"]')!;
  const scoreText = leftPanel.querySelector<HTMLElement>('[data-id="score"]')!;
  const legendText = leftPanel.querySelector<HTMLElement>('[data-id="legend"]')!;
  const memberText = rightPanel.querySelector<HTMLElement>('[data-id="member"]')!;
  const objectiveText = rightPanel.querySelector<HTMLElement>('[data-id="objective"]')!;
  const tagText = rightPanel.querySelector<HTMLElement>('[data-id="tag"]')!;
  const ultText = rightPanel.querySelector<HTMLElement>('[data-id="ult"]')!;

  legendText.textContent = options.touchMode
    ? "Use the stage controls at the bottom edge."
    : "A/D move, J attack, K dash, L tag, I ultimate.";

  function pushFeed(text: string): void {
    centerFeed.textContent = text;
    centerFeed.classList.remove("pulse");
    void centerFeed.offsetWidth;
    centerFeed.classList.add("pulse");
  }

  return {
    update(snapshot) {
      const hpRatio = Math.max(0, Math.min(1, snapshot.runState.hpShared / 620));
      hpFill.style.width = `${Math.round(hpRatio * 100)}%`;
      hpText.textContent = `HP ${Math.max(0, Math.round(snapshot.runState.hpShared))}`;
      comboText.textContent = `Combo ${snapshot.runState.combo}`;
      scoreText.textContent = `Score ${Math.round(snapshot.runState.score)}`;
      memberText.textContent = snapshot.activeMember.id.toUpperCase();
      memberText.style.borderColor = `#${snapshot.activeMember.accentColor.toString(16).padStart(6, "0")}`;
      objectiveText.textContent = formatObjective(snapshot);
      tagText.textContent =
        snapshot.runState.tagCooldownMs > 0
          ? `Tag ${Math.ceil(snapshot.runState.tagCooldownMs / 1000)}s`
          : "Tag ready";
      ultText.textContent = snapshot.canUseUltimate ? "Ultimate ready" : "Ultimate charging";

      for (const memberId of MEMBER_ORDER) {
        const node = rosterNodes.get(memberId);
        if (!node) {
          continue;
        }
        node.classList.toggle("is-active", snapshot.activeMemberId === memberId);
      }
    },

    applyEvents(events) {
      if (events.length === 0) {
        return;
      }

      const latestFeed = [...events]
        .reverse()
        .map(formatFeed)
        .find((value): value is string => Boolean(value));

      if (latestFeed) {
        pushFeed(latestFeed);
      }
    },

    setPaused(paused) {
      pauseOverlay.hidden = !paused;
    },

    setStarted(started) {
      startOverlay.hidden = started;
    },

    destroy() {
      hud.remove();
    }
  };
}
