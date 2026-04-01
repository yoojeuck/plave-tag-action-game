import Phaser from "phaser";
import type { MemberDefinition } from "../../game/platformer/types";

export class PlayerView {
  readonly container: Phaser.GameObjects.Container;

  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly glow: Phaser.GameObjects.Ellipse;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly spark: Phaser.GameObjects.Arc;
  private facing: -1 | 1 = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, member: MemberDefinition) {
    this.container = scene.add.container(x, y);

    this.shadow = scene.add.ellipse(0, 18, 42, 12, 0x07203b, 0.22);
    this.glow = scene.add.ellipse(0, -4, 60, 72, member.accentColor, 0.16);
    this.sprite = scene.add.image(0, -20, member.textureKey).setScale(0.74);
    this.spark = scene.add.arc(0, -32, 10, 0, 360, false, member.accentColor, 0.22).setVisible(false);

    this.container.add([this.glow, this.shadow, this.sprite, this.spark]);
  }

  setMember(member: MemberDefinition): void {
    this.sprite.setTexture(member.textureKey);
    this.glow.setFillStyle(member.accentColor, 0.16);
    this.spark.setFillStyle(member.accentColor, 0.22);
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  setFacing(facing: -1 | 1): void {
    this.facing = facing;
    this.sprite.setScale(0.74 * facing, 0.74);
  }

  updatePose(params: { velocityX: number; airborne: boolean; dashing: boolean; timeMs: number }): void {
    const motion = Math.abs(params.velocityX);
    const bob = params.airborne ? -4 : Math.sin(params.timeMs / 95) * Math.min(3, motion * 0.02);
    const lean = Phaser.Math.Clamp(params.velocityX * 0.04, -8, 8);
    const squashY = params.airborne ? 0.95 : params.dashing ? 0.92 : 1;
    const stretchX = params.airborne ? 1.05 : params.dashing ? 1.12 : 1;

    this.sprite.setY(-20 + bob);
    this.sprite.setAngle(lean * 0.5);
    this.sprite.setScale(0.74 * this.facing * stretchX, 0.74 * squashY);
    this.glow.alpha = params.dashing ? 0.28 : 0.16;
    this.glow.setScale(params.dashing ? 1.18 : 1, params.airborne ? 1.05 : 1);
    this.shadow.scaleX = params.airborne ? 0.82 : 1;
  }

  triggerJump(): void {
    this.container.scene.tweens.add({
      targets: this.glow,
      scaleX: 1.28,
      scaleY: 1.14,
      alpha: { from: 0.35, to: 0.08 },
      duration: 180
    });
  }

  triggerAttack(): void {
    this.container.scene.tweens.add({
      targets: this.sprite,
      angle: { from: -4 * this.facing, to: 7 * this.facing },
      duration: 90,
      yoyo: true
    });
  }

  triggerSpecial(): void {
    this.spark.setVisible(true);
    this.spark.setScale(0.4);
    this.spark.alpha = 0.7;
    this.container.scene.tweens.add({
      targets: this.spark,
      scaleX: 2.1,
      scaleY: 2.1,
      alpha: 0,
      duration: 260,
      onComplete: () => {
        this.spark.setVisible(false);
        this.spark.alpha = 0.22;
        this.spark.setScale(1);
      }
    });
  }

  triggerHit(): void {
    this.container.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 0.35, to: 1 },
      duration: 70,
      repeat: 4,
      yoyo: true
    });
  }

  destroy(): void {
    this.container.destroy(true);
  }
}
