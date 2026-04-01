import Phaser from "phaser";
import "./styles.css";
import { InputBindings } from "./game/input/bindings";
import { SceneBridge } from "./phaser/adapters/sceneBridge";
import { BootScene } from "./phaser/scenes/BootScene";
import { GameScene, type ShellState } from "./phaser/scenes/GameScene";
import { createHud } from "./ui/hud/createHud";
import { createVirtualControls } from "./ui/hud/virtualControls";

const canvasRoot = document.getElementById("game-canvas");
const hudRoot = document.getElementById("hud-root");

if (!canvasRoot || !hudRoot) {
  throw new Error("Root elements are missing.");
}

const touchMode =
  window.matchMedia("(pointer: coarse)").matches ||
  window.matchMedia("(hover: none)").matches ||
  navigator.maxTouchPoints > 0;

document.body.dataset.inputMode = touchMode ? "touch" : "keyboard";

const inputBindings = new InputBindings();
const bridge = new SceneBridge();
const shellState: ShellState = {
  started: false,
  touchMode,
  pauseRequested: false
};

const hud = createHud(hudRoot, {
  touchMode,
  onStart: () => {
    shellState.started = true;
    hud.setStarted(true);
  },
  onPauseToggle: () => {
    if (!shellState.started) {
      shellState.started = true;
      hud.setStarted(true);
      return;
    }
    shellState.pauseRequested = true;
  }
});

const mobileControls = createVirtualControls(hudRoot, inputBindings, {
  enabled: touchMode
});

GameScene.configure({
  bridge,
  hud,
  inputBindings,
  shellState
});

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: canvasRoot,
  width: 960,
  height: 540,
  backgroundColor: "#041220",
  scene: [BootScene, GameScene],
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 980, x: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540
  }
});

window.addEventListener("beforeunload", () => {
  mobileControls.destroy();
  hud.destroy();
  game.destroy(true);
});
