import type { EndState, HudState, MemberDefinition } from "../../game/platformer/types";

export interface HudOptions {
  touchMode: boolean;
  started?: boolean;
  members: MemberDefinition[];
  onStart: () => void;
  onPauseToggle: () => void;
  onRestart: () => void;
}

export interface HudApi {
  update(state: HudState): void;
  setStarted(started: boolean): void;
  setPaused(paused: boolean): void;
  showEnd(state: EndState | null): void;
  destroy(): void;
}

export function createHud(root: HTMLElement, options: HudOptions): HudApi {
  const hud = document.createElement("div");
  hud.className = "hud-root";

  const leftPanel = document.createElement("section");
  leftPanel.className = "hud-panel hud-panel-left";
  leftPanel.innerHTML = `
    <div class="hud-kicker">Dream run</div>
    <div class="hud-stage" data-id="stage"></div>
    <div class="hud-stat-grid">
      <div class="hud-stat">
        <span class="hud-stat-label">Lives</span>
        <span class="hud-stat-value hud-hearts" data-id="lives"></span>
      </div>
      <div class="hud-stat">
        <span class="hud-stat-label">Notes</span>
        <span class="hud-stat-value" data-id="notes"></span>
      </div>
      <div class="hud-stat hud-stat-score">
        <span class="hud-stat-label">Score</span>
        <span class="hud-stat-value" data-id="score"></span>
      </div>
    </div>
  `;

  const rightPanel = document.createElement("section");
  rightPanel.className = "hud-panel hud-panel-right";
  rightPanel.innerHTML = `
    <div class="member-panel">
      <img class="member-art" data-id="member-art" alt="" />
      <div class="member-copy">
        <div class="member-name" data-id="member-name"></div>
        <div class="member-role" data-id="member-role"></div>
        <div class="member-ability" data-id="member-ability"></div>
      </div>
    </div>
    <div class="objective-box">
      <div class="objective-label">Objective</div>
      <div class="objective-copy" data-id="objective"></div>
      <div class="objective-progress" data-id="progress"></div>
    </div>
  `;

  const helperStrip = document.createElement("div");
  helperStrip.className = "helper-strip";
  helperStrip.innerHTML = `
    <span class="helper-kicker">${options.touchMode ? "Touch mode" : "Keyboard mode"}</span>
    <span class="helper-copy">${
      options.touchMode
        ? "Move with the left pad. Jump, power, dash, tag, and use the member skill on the right."
        : "A/D or arrows move, Space jumps, J fires, K sprints, L tags, I uses the member skill."
    }</span>
  `;

  const touchPause = document.createElement("button");
  touchPause.className = `touch-pause ${options.touchMode ? "" : "is-hidden"}`.trim();
  touchPause.type = "button";
  touchPause.textContent = "Pause";
  touchPause.addEventListener("click", () => options.onPauseToggle());

  const roster = document.createElement("div");
  roster.className = "hud-roster";
  const rosterNodes = new Map<string, HTMLElement>();

  for (const member of options.members) {
    const node = document.createElement("article");
    node.className = "roster-member";
    node.dataset.memberId = member.id;
    node.innerHTML = `
      <img src="${member.imageUrl}" alt="${member.displayName}" class="roster-art" />
      <div class="roster-copy">
        <div class="roster-name">${member.displayName}</div>
        <div class="roster-role">${member.abilityLabel}</div>
      </div>
    `;
    node.style.setProperty("--member-accent", `#${member.accentColor.toString(16).padStart(6, "0")}`);
    rosterNodes.set(member.id, node);
    roster.append(node);
  }

  const startOverlay = document.createElement("section");
  startOverlay.className = `hud-overlay start-overlay ${options.started ? "is-hidden" : ""}`.trim();
  const memberCards = options.members
    .map(
      (member) => `
        <article class="start-member-card">
          <img src="${member.imageUrl}" alt="${member.displayName}" class="start-member-art" />
          <div class="start-member-name">${member.displayName}</div>
          <div class="start-member-role">${member.abilityLabel}</div>
          <div class="start-member-note">${member.silhouetteNote}</div>
        </article>
      `
    )
    .join("");
  startOverlay.innerHTML = `
    <div class="overlay-card overlay-card-wide">
      <div class="overlay-kicker">Fan-made platform action</div>
      <h1 class="overlay-title">PLAVE Dream Run</h1>
      <p class="overlay-copy">
        A fresh side-scrolling stage built around Mario-style running, jumping, block bumps, enemy stomps, and member swapping.
      </p>
      <div class="start-grid">${memberCards}</div>
      <div class="overlay-grid">
        <div class="overlay-chip">Original in-game character art</div>
        <div class="overlay-chip">Desktop + mobile controls</div>
        <div class="overlay-chip">Tag through 5 distinct movement skills</div>
      </div>
      <button class="overlay-button" type="button">Start Stage</button>
    </div>
  `;

  const pauseOverlay = document.createElement("section");
  pauseOverlay.className = "hud-overlay pause-overlay is-hidden";
  pauseOverlay.innerHTML = `
    <div class="overlay-card overlay-card-small">
      <div class="overlay-kicker">Paused</div>
      <h2 class="overlay-title overlay-title-small">Take five</h2>
      <p class="overlay-copy">Resume from the same jump, or restart the whole stage cleanly.</p>
      <div class="overlay-actions">
        <button class="overlay-button" data-action="resume" type="button">Resume</button>
        <button class="overlay-button overlay-button-secondary" data-action="restart" type="button">Restart</button>
      </div>
    </div>
  `;

  const endOverlay = document.createElement("section");
  endOverlay.className = "hud-overlay end-overlay is-hidden";
  endOverlay.innerHTML = `
    <div class="overlay-card overlay-card-small">
      <div class="overlay-kicker" data-id="end-kicker">Encore report</div>
      <h2 class="overlay-title overlay-title-small" data-id="end-title"></h2>
      <p class="overlay-copy" data-id="end-body"></p>
      <div class="end-rank" data-id="end-rank"></div>
      <div class="end-stats">
        <div class="end-stat" data-id="end-score"></div>
        <div class="end-stat" data-id="end-notes"></div>
        <div class="end-stat" data-id="end-time"></div>
      </div>
      <button class="overlay-button" data-action="restart" type="button">Play Again</button>
    </div>
  `;

  startOverlay.querySelector<HTMLButtonElement>("button")?.addEventListener("click", () => {
    startOverlay.classList.add("is-hidden");
    options.onStart();
  });
  pauseOverlay
    .querySelector<HTMLButtonElement>('[data-action="resume"]')
    ?.addEventListener("click", () => options.onPauseToggle());
  pauseOverlay
    .querySelector<HTMLButtonElement>('[data-action="restart"]')
    ?.addEventListener("click", () => options.onRestart());
  endOverlay
    .querySelector<HTMLButtonElement>('[data-action="restart"]')
    ?.addEventListener("click", () => options.onRestart());

  hud.append(leftPanel, rightPanel, helperStrip, touchPause, roster, startOverlay, pauseOverlay, endOverlay);
  root.append(hud);

  const stageText = leftPanel.querySelector<HTMLElement>('[data-id="stage"]')!;
  const livesText = leftPanel.querySelector<HTMLElement>('[data-id="lives"]')!;
  const notesText = leftPanel.querySelector<HTMLElement>('[data-id="notes"]')!;
  const scoreText = leftPanel.querySelector<HTMLElement>('[data-id="score"]')!;

  const memberArt = rightPanel.querySelector<HTMLImageElement>('[data-id="member-art"]')!;
  const memberName = rightPanel.querySelector<HTMLElement>('[data-id="member-name"]')!;
  const memberRole = rightPanel.querySelector<HTMLElement>('[data-id="member-role"]')!;
  const memberAbility = rightPanel.querySelector<HTMLElement>('[data-id="member-ability"]')!;
  const objectiveText = rightPanel.querySelector<HTMLElement>('[data-id="objective"]')!;
  const progressText = rightPanel.querySelector<HTMLElement>('[data-id="progress"]')!;

  const endTitle = endOverlay.querySelector<HTMLElement>('[data-id="end-title"]')!;
  const endBody = endOverlay.querySelector<HTMLElement>('[data-id="end-body"]')!;
  const endRank = endOverlay.querySelector<HTMLElement>('[data-id="end-rank"]')!;
  const endScore = endOverlay.querySelector<HTMLElement>('[data-id="end-score"]')!;
  const endNotes = endOverlay.querySelector<HTMLElement>('[data-id="end-notes"]')!;
  const endTime = endOverlay.querySelector<HTMLElement>('[data-id="end-time"]')!;

  let endVisible = false;

  return {
    update(state) {
      stageText.textContent = state.stageTitle;
      livesText.textContent = `${"♥".repeat(state.lives)}${"·".repeat(Math.max(0, 3 - state.lives))}`;
      notesText.textContent = `${state.notesCollected} / ${state.totalNotes}`;
      scoreText.textContent = state.score.toString();

      memberArt.src = state.member.imageUrl;
      memberArt.alt = state.member.displayName;
      memberName.textContent = state.member.displayName;
      memberRole.textContent = state.member.role;
      memberAbility.textContent = state.abilityStatus;
      objectiveText.textContent = state.objective;
      progressText.textContent = `${state.sectionLabel} • ${state.progressText}`;

      for (const member of options.members) {
        rosterNodes.get(member.id)?.classList.toggle("is-active", state.member.id === member.id);
      }
    },

    setStarted(started) {
      startOverlay.classList.toggle("is-hidden", started);
    },

    setPaused(paused) {
      pauseOverlay.classList.toggle("is-hidden", !paused || endVisible);
    },

    showEnd(state) {
      endVisible = Boolean(state);
      endOverlay.classList.toggle("is-hidden", !state);
      pauseOverlay.classList.add("is-hidden");

      if (!state) {
        return;
      }

      endTitle.textContent = state.title;
      endBody.textContent = state.body;
      endRank.textContent = `Rank ${state.rank}`;
      endScore.textContent = `Final score ${state.score}`;
      endNotes.textContent = state.notesLine;
      endTime.textContent = state.timeLine;
    },

    destroy() {
      hud.remove();
    }
  };
}
