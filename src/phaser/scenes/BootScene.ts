import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "boot-scene" });
  }

  create(): void {
    this.scene.start("game-scene");
  }
}
