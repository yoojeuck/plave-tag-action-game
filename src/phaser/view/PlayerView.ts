import Phaser from "phaser";

export class PlayerView {
  readonly body: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
  private readonly aura: Phaser.GameObjects.Ellipse;
  private facing = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number, labelText: string) {
    this.aura = scene.add.ellipse(x, y + 14, 52, 18, color, 0.35);
    this.body = scene.add.rectangle(x, y, 34, 56, color, 1);
    this.body.setStrokeStyle(2, 0xffffff, 0.75);
    this.label = scene.add
      .text(x, y - 46, labelText.toUpperCase(), {
        fontFamily: "Verdana, sans-serif",
        fontSize: "12px",
        color: "#ecfeff",
        fontStyle: "bold"
      })
      .setOrigin(0.5);
  }

  setPosition(x: number, y: number): void {
    this.aura.setPosition(x, y + 14);
    this.body.setPosition(x, y);
    this.label.setPosition(x, y - 46);
  }

  setFacing(facing: -1 | 1): void {
    if (this.facing === facing) {
      return;
    }
    this.facing = facing;
    this.body.setScale(facing, 1);
  }

  setAccentColor(color: number): void {
    this.aura.setFillStyle(color, 0.35);
    this.body.setFillStyle(color, 1);
  }

  setLabel(text: string): void {
    this.label.setText(text.toUpperCase());
  }

  triggerAttackPulse(): void {
    this.body.scene.tweens.add({
      targets: this.body,
      scaleX: this.facing * 1.08,
      scaleY: 0.94,
      duration: 70,
      yoyo: true
    });
  }

  destroy(): void {
    this.aura.destroy();
    this.body.destroy();
    this.label.destroy();
  }
}
