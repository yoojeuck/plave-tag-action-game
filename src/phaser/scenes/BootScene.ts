import Phaser from "phaser";
import { ASSET_MANIFEST } from "../../game/assets/manifest";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "boot-scene" });
  }

  preload(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.setBackgroundColor("#82d7ff");

    const title = this.add
      .text(width / 2, height / 2 - 40, "PLAVE Dream Run", {
        fontFamily: "Trebuchet MS, Verdana, sans-serif",
        fontSize: "40px",
        color: "#15314d",
        fontStyle: "bold"
      })
      .setOrigin(0.5);

    const hint = this.add
      .text(width / 2, height / 2 + 8, "Loading character art, note blocks, and stage props...", {
        fontFamily: "Trebuchet MS, Verdana, sans-serif",
        fontSize: "16px",
        color: "#244968"
      })
      .setOrigin(0.5);

    const barBg = this.add.rectangle(width / 2, height / 2 + 54, 360, 18, 0xffffff, 0.45).setOrigin(0.5);
    const barFill = this.add.rectangle(width / 2 - 176, height / 2 + 54, 8, 12, 0x23587e, 1).setOrigin(0, 0.5);

    this.load.on("progress", (progress: number) => {
      barFill.width = 352 * progress;
    });

    this.load.on("complete", () => {
      title.destroy();
      hint.destroy();
      barBg.destroy();
      barFill.destroy();
    });

    for (const asset of ASSET_MANIFEST.svg) {
      this.load.svg(asset.key, asset.path, {
        width: asset.width,
        height: asset.height
      });
    }
  }

  create(): void {
    this.scene.start("game-scene");
  }
}
