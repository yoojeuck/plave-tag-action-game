import Phaser from "phaser";
import "./styles.css";
import { InputBindings } from "./game/input/bindings";
import { MEMBER_ORDER, MEMBER_DEFINITIONS } from "./game/content/members";
import { BootScene } from "./phaser/scenes/BootScene";
import { GameScene, type ShellState } from "./phaser/scenes/GameScene";
import { createHud, type HudApi } from "./ui/hud/createHud";
import { createVirtualControls } from "./ui/hud/virtualControls";

function renderBootError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  document.body.innerHTML = `
    <div style="display:grid;place-items:center;width:100vw;height:100vh;background:#f3fbff;padding:24px;font-family:Trebuchet MS,Segoe UI,sans-serif;">
      <div style="max-width:720px;padding:28px 30px;border-radius:28px;background:white;border:1px solid rgba(22,53,84,0.08);box-shadow:0 24px 60px rgba(21,53,85,0.12);">
        <div style="color:#ff9b37;font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;">Boot Error</div>
        <h1 style="margin:12px 0 0;color:#163554;font-size:42px;line-height:1;">PLAVE Dream Run failed to boot</h1>
        <p style="margin:16px 0 0;color:#4d6b87;font-size:16px;line-height:1.6;">${message}</p>
      </div>
    </div>
  `;
  console.error(error);
}

function bootstrap(): void {
  const canvasRoot = document.getElementById("game-canvas");
  const hudRoot = document.getElementById("hud-root");

  if (!canvasRoot || !hudRoot) {
    throw new Error("Root elements are missing.");
  }

  const touchMode =
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none)").matches ||
    navigator.maxTouchPoints > 0;
  const autoStart = new URLSearchParams(window.location.search).get("autostart") === "1";

  document.body.dataset.inputMode = touchMode ? "touch" : "keyboard";

  const inputBindings = new InputBindings();
  const shellState: ShellState = {
    started: autoStart,
    touchMode,
    pauseRequested: false,
    restartRequested: false
  };

  let hud: HudApi;

  hud = createHud(hudRoot, {
    touchMode,
    started: autoStart,
    members: MEMBER_ORDER.map((id) => MEMBER_DEFINITIONS[id]),
    onStart: () => {
      shellState.started = true;
      hud.setStarted(true);
      hud.showEnd(null);
    },
    onPauseToggle: () => {
      if (!shellState.started) {
        shellState.started = true;
        hud.setStarted(true);
        return;
      }
      shellState.pauseRequested = true;
    },
    onRestart: () => {
      shellState.started = true;
      shellState.pauseRequested = false;
      shellState.restartRequested = true;
      hud.setStarted(true);
      hud.setPaused(false);
      hud.showEnd(null);
    }
  });

  const mobileControls = createVirtualControls(hudRoot, inputBindings, {
    enabled: touchMode
  });

  GameScene.configure({
    hud,
    inputBindings,
    shellState
  });

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: canvasRoot,
    width: 1280,
    height: 720,
    backgroundColor: "#7fd8ff",
    scene: [BootScene, GameScene],
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 1100, x: 0 },
        debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720
    }
  });

  window.addEventListener("beforeunload", () => {
    mobileControls.destroy();
    hud.destroy();
    game.destroy(true);
  });
}

try {
  bootstrap();
} catch (error) {
  renderBootError(error);
}
