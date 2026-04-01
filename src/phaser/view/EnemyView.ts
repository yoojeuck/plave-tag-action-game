import Phaser from "phaser";

export class EnemyView {
  readonly body: Phaser.GameObjects.Rectangle;
  readonly hpBarBg: Phaser.GameObjects.Rectangle;
  readonly hpBar: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
  private readonly shadow: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, x: number, y: number, isBoss: boolean) {
    const width = isBoss ? 78 : 50;
    const height = isBoss ? 108 : 70;
    const color = isBoss ? 0xee6b6e : 0xff9f63;

    this.shadow = scene.add.ellipse(x, y + 20, width + 18, 18, 0x1f2937, 0.55);
    this.body = scene.add.rectangle(x, y, width, height, color, 1);
    this.body.setStrokeStyle(2, 0x111827, 0.6);

    this.hpBarBg = scene.add.rectangle(x, y - height / 2 - 18, width + 6, 8, 0x111827, 0.9);
    this.hpBar = scene.add.rectangle(x, y - height / 2 - 18, width + 4, 6, 0xf87171, 1).setOrigin(0.5);
    this.label = scene.add
      .text(x, y - height / 2 - 34, isBoss ? "MINI BOSS" : "ENEMY", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "11px",
        color: "#fef2f2",
        fontStyle: "bold"
      })
      .setOrigin(0.5);
  }

  setPosition(x: number, y: number): void {
    this.shadow.setPosition(x, y + 20);
    this.body.setPosition(x, y);
    this.hpBarBg.setPosition(x, this.hpBarBg.y);
    this.hpBar.setPosition(x, this.hpBar.y);
    this.label.setPosition(x, this.label.y);
  }

  setHealth(ratio: number): void {
    const clamped = Phaser.Math.Clamp(ratio, 0, 1);
    this.hpBar.scaleX = clamped;
    this.hpBar.setFillStyle(clamped < 0.35 ? 0xef4444 : 0xf87171, 1);
  }

  flashHit(): void {
    this.body.scene.tweens.add({
      targets: this.body,
      alpha: 0.35,
      duration: 60,
      yoyo: true
    });
  }

  destroy(): void {
    this.shadow.destroy();
    this.body.destroy();
    this.hpBarBg.destroy();
    this.hpBar.destroy();
    this.label.destroy();
  }
}
