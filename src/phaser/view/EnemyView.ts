import Phaser from "phaser";

export class EnemyView {
  readonly label: Phaser.GameObjects.Text;
  readonly isBoss: boolean;

  private readonly container: Phaser.GameObjects.Container;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly body: Phaser.GameObjects.Rectangle;
  private readonly armor: Phaser.GameObjects.Rectangle;
  private readonly core: Phaser.GameObjects.Ellipse;
  private readonly hornLeft: Phaser.GameObjects.Triangle;
  private readonly hornRight: Phaser.GameObjects.Triangle;
  private readonly hpBarBg: Phaser.GameObjects.Rectangle;
  private readonly hpBar: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, isBoss: boolean) {
    this.isBoss = isBoss;

    const width = isBoss ? 74 : 48;
    const height = isBoss ? 108 : 72;
    const shellColor = isBoss ? 0x782e4a : 0x764d2f;
    const armorColor = isBoss ? 0xf15a7f : 0xf1a85e;

    this.container = scene.add.container(x, y);
    this.shadow = scene.add.ellipse(0, 24, width + 26, 20, 0x120e18, 0.4);
    this.body = scene.add.rectangle(0, 4, width, height, shellColor, 1);
    this.armor = scene.add.rectangle(0, -4, width - 14, height - 24, armorColor, 0.82);
    this.core = scene.add.ellipse(0, -8, isBoss ? 20 : 16, isBoss ? 30 : 24, 0xfff3da, 0.9);
    this.hornLeft = scene.add.triangle(-width / 2 + 6, -height / 2 + 4, 0, 18, 10, 0, 18, 18, armorColor, 0.9);
    this.hornRight = scene.add.triangle(width / 2 - 6, -height / 2 + 4, 0, 18, 8, 0, 18, 18, armorColor, 0.9);

    this.container.add([this.shadow, this.body, this.armor, this.core, this.hornLeft, this.hornRight]);

    this.hpBarBg = scene.add.rectangle(x, y - height / 2 - 28, width + 18, 10, 0x130f1d, 0.9);
    this.hpBar = scene.add.rectangle(x, y - height / 2 - 28, width + 14, 6, armorColor, 1).setOrigin(0.5);
    this.label = scene.add
      .text(x, y - height / 2 - 47, isBoss ? "MINI BOSS" : "ENEMY", {
        fontFamily: "Trebuchet MS, Verdana, sans-serif",
        fontSize: isBoss ? "14px" : "12px",
        color: "#ffe8e8",
        fontStyle: "bold"
      })
      .setOrigin(0.5);
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
    const topY = y - (this.isBoss ? 108 : 72) / 2 - 28;
    this.hpBarBg.setPosition(x, topY);
    this.hpBar.setPosition(x, topY);
    this.label.setPosition(x, topY - 19);
  }

  setHealth(ratio: number): void {
    const clamped = Phaser.Math.Clamp(ratio, 0, 1);
    this.hpBar.scaleX = clamped;
    this.hpBar.setFillStyle(clamped < 0.35 ? 0xff5672 : this.isBoss ? 0xf15a7f : 0xf1a85e, 1);
  }

  updatePose(timeMs: number): void {
    const hover = Math.sin(timeMs / 260) * (this.isBoss ? 6 : 4);
    this.core.y = -8 + hover * 0.35;
    this.shadow.scaleX = 1 - hover * 0.01;
    this.armor.setAngle(Math.sin(timeMs / 420) * 1.4);
  }

  flashHit(): void {
    this.body.scene.tweens.add({
      targets: [this.body, this.armor, this.core],
      alpha: 0.22,
      duration: 65,
      yoyo: true
    });
  }

  pulseThreat(): void {
    this.body.scene.tweens.add({
      targets: this.core,
      scaleX: 1.25,
      scaleY: 1.25,
      alpha: { from: 1, to: 0.7 },
      duration: 140,
      yoyo: true
    });
  }

  destroy(): void {
    this.container.destroy(true);
    this.hpBarBg.destroy();
    this.hpBar.destroy();
    this.label.destroy();
  }
}
