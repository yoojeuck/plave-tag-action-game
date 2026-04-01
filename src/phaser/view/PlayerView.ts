import Phaser from "phaser";

export class PlayerView {
  readonly container: Phaser.GameObjects.Container;
  readonly label: Phaser.GameObjects.Text;

  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly aura: Phaser.GameObjects.Ellipse;
  private readonly trail: Phaser.GameObjects.Ellipse;
  private readonly torso: Phaser.GameObjects.Rectangle;
  private readonly coat: Phaser.GameObjects.Triangle;
  private readonly sash: Phaser.GameObjects.Rectangle;
  private readonly head: Phaser.GameObjects.Ellipse;
  private readonly hairBack: Phaser.GameObjects.Ellipse;
  private readonly hairFront: Phaser.GameObjects.Triangle;
  private readonly visor: Phaser.GameObjects.Rectangle;
  private readonly leftLeg: Phaser.GameObjects.Rectangle;
  private readonly rightLeg: Phaser.GameObjects.Rectangle;
  private readonly leftArm: Phaser.GameObjects.Rectangle;
  private readonly rightArm: Phaser.GameObjects.Rectangle;
  private facing: -1 | 1 = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number, labelText: string) {
    this.container = scene.add.container(x, y);

    this.shadow = scene.add.ellipse(0, 19, 58, 18, 0x0b1623, 0.42);
    this.aura = scene.add.ellipse(0, 6, 42, 62, color, 0.13);
    this.trail = scene.add.ellipse(-8, 2, 20, 54, color, 0.18);
    this.leftLeg = scene.add.rectangle(-8, 18, 9, 24, 0x081524, 0.95);
    this.rightLeg = scene.add.rectangle(8, 18, 9, 24, 0x081524, 0.95);
    this.leftArm = scene.add.rectangle(-18, -4, 8, 26, 0x0d2037, 0.95);
    this.rightArm = scene.add.rectangle(18, -4, 8, 26, 0x0d2037, 0.95);
    this.torso = scene.add.rectangle(0, -2, 30, 38, 0x16324a, 1);
    this.coat = scene.add.triangle(0, 8, -18, -8, 18, -8, 0, 28, color, 0.78);
    this.sash = scene.add.rectangle(0, 3, 26, 4, 0xe5f6ff, 0.82);
    this.head = scene.add.ellipse(0, -28, 24, 27, 0xf7d9d4, 1);
    this.hairBack = scene.add.ellipse(0, -33, 28, 26, color, 0.88);
    this.hairFront = scene.add.triangle(0, -40, -15, -2, 15, -2, 0, 12, color, 0.92);
    this.visor = scene.add.rectangle(0, -29, 18, 4, 0xf7ffff, 0.9);

    this.container.add([
      this.aura,
      this.trail,
      this.shadow,
      this.leftLeg,
      this.rightLeg,
      this.leftArm,
      this.rightArm,
      this.torso,
      this.coat,
      this.sash,
      this.hairBack,
      this.head,
      this.hairFront,
      this.visor
    ]);

    this.label = scene.add
      .text(x, y - 64, labelText.toUpperCase(), {
        fontFamily: "Trebuchet MS, Verdana, sans-serif",
        fontSize: "15px",
        color: "#f2fbff",
        fontStyle: "bold"
      })
      .setOrigin(0.5);
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
    this.label.setPosition(x, y - 64);
  }

  setFacing(facing: -1 | 1): void {
    this.facing = facing;
    this.container.setScale(facing, 1);
  }

  setAccentColor(color: number): void {
    this.aura.setFillStyle(color, 0.13);
    this.trail.setFillStyle(color, 0.18);
    this.coat.setFillStyle(color, 0.78);
    this.hairBack.setFillStyle(color, 0.88);
    this.hairFront.setFillStyle(color, 0.92);
  }

  setLabel(text: string): void {
    this.label.setText(text.toUpperCase());
  }

  updatePose(params: { speed: number; airborne: boolean; timeMs: number }): void {
    const motion = Math.abs(params.speed);
    const bob = params.airborne ? -4 : Math.sin(params.timeMs / 145) * Math.min(4, motion * 0.018);
    const armSwing = params.airborne ? -8 : Math.sin(params.timeMs / 95) * Math.min(8, motion * 0.04);
    const legSwing = params.airborne ? 3 : Math.sin(params.timeMs / 90) * Math.min(6, motion * 0.03);

    this.container.y += 0;
    this.torso.setAngle(armSwing * 0.12);
    this.leftArm.setAngle(-armSwing);
    this.rightArm.setAngle(armSwing);
    this.leftLeg.setAngle(legSwing);
    this.rightLeg.setAngle(-legSwing);
    this.aura.y = 6 + bob * 0.4;
    this.trail.alpha = motion > 30 ? 0.3 : 0.14;
    this.shadow.scaleX = motion > 30 ? 0.92 : 1;
    this.container.setY(this.container.y + 0);
    this.label.setY(this.container.y - 64 + bob * 0.25);
  }

  triggerAttackPulse(): void {
    this.container.scene.tweens.add({
      targets: [this.container, this.aura],
      scaleX: this.facing * 1.08,
      scaleY: 0.95,
      alpha: { from: 1, to: 0.92 },
      duration: 80,
      yoyo: true
    });
  }

  triggerTagPulse(): void {
    this.container.scene.tweens.add({
      targets: this.aura,
      scaleX: 1.45,
      scaleY: 1.3,
      alpha: { from: 0.55, to: 0.1 },
      duration: 220,
      yoyo: false
    });
  }

  destroy(): void {
    this.container.destroy(true);
    this.label.destroy();
  }
}
