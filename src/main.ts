import Phaser from "phaser";
import "./styles.css";
import { InputBindings } from "./game/input/bindings";
import { SceneBridge } from "./phaser/adapters/sceneBridge";
import { BootScene } from "./phaser/scenes/BootScene";
import { GameScene } from "./phaser/scenes/GameScene";
import { createHud } from "./ui/hud/createHud";
import { createVirtualControls } from "./ui/hud/virtualControls";

const canvasRoot = document.getElementById("game-canvas");
const hudRoot = document.getElementById("hud-root");

if (!canvasRoot || !hudRoot) {
  throw new Error("Root elements are missing.");
}

const inputBindings = new InputBindings();
const bridge = new SceneBridge();
const hud = createHud(hudRoot);
const mobileControls = createVirtualControls(hudRoot, inputBindings);

GameScene.configure({
  bridge,
  hud,
  inputBindings
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
