import Phaser from "phaser";

export class EnemyView {
  readonly container: Phaser.GameObjects.Container;

  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly sprite: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y);
    this.shadow = scene.add.ellipse(0, 18, 36, 10, 0x08203a, 0.2);
    this.sprite = scene.add.image(0, -18, "dreamling").setScale(0.62);
    this.container.add([this.shadow, this.sprite]);
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  setFacing(facing: -1 | 1): void {
    this.sprite.setScale(0.62 * facing, 0.62);
  }

  updatePose(timeMs: number): void {
    const bounce = Math.sin(timeMs / 120) * 1.8;
    this.sprite.setY(-18 + bounce);
    this.shadow.scaleX = 0.92 + Math.sin(timeMs / 180) * 0.05;
  }

  squash(): void {
    this.container.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 1.2,
      scaleY: 0.4,
      alpha: 0,
      duration: 160
    });
    this.container.scene.tweens.add({
      targets: this.shadow,
      scaleX: 1.45,
      alpha: 0,
      duration: 180
    });
  }

  flashHit(): void {
    this.container.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 0.35, to: 1 },
      duration: 60,
      repeat: 2,
      yoyo: true
    });
  }

  destroy(): void {
    this.container.destroy(true);
  }
}
