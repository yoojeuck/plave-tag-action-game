import Phaser from "phaser";
import { InputBindings } from "../../game/input/bindings";
import type { SimulationEvent, SimulationSnapshot } from "../../game/simulation/types";
import type { SceneBridge } from "../adapters/sceneBridge";
import { EnemyView } from "../view/EnemyView";
import { PlayerView } from "../view/PlayerView";
import type { HudApi } from "../../ui/hud/createHud";

interface GameKeys {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  w: Phaser.Input.Keyboard.Key;
  a: Phaser.Input.Keyboard.Key;
  d: Phaser.Input.Keyboard.Key;
  space: Phaser.Input.Keyboard.Key;
  attack: Phaser.Input.Keyboard.Key;
  dash: Phaser.Input.Keyboard.Key;
  tag: Phaser.Input.Keyboard.Key;
  ultimate: Phaser.Input.Keyboard.Key;
  pause: Phaser.Input.Keyboard.Key;
}

interface BackgroundStar {
  node: Phaser.GameObjects.Ellipse;
  baseY: number;
  drift: number;
  phase: number;
}

interface LightBeam {
  node: Phaser.GameObjects.Rectangle;
  baseX: number;
  phase: number;
}

export interface ShellState {
  started: boolean;
  touchMode: boolean;
  pauseRequested: boolean;
}

interface GameSceneDependencies {
  bridge: SceneBridge;
  hud: HudApi;
  inputBindings: InputBindings;
  shellState: ShellState;
}

export class GameScene extends Phaser.Scene {
  private static deps: GameSceneDependencies | null = null;

  static configure(deps: GameSceneDependencies): void {
    GameScene.deps = deps;
  }

  private deps!: GameSceneDependencies;
  private keys!: GameKeys;
  private playerCollider!: Phaser.GameObjects.Rectangle;
  private playerView!: PlayerView;
  private enemyView: EnemyView | null = null;
  private ground!: Phaser.GameObjects.Rectangle;
  private backdrop!: Phaser.GameObjects.Rectangle;
  private backdropGlowA!: Phaser.GameObjects.Ellipse;
  private backdropGlowB!: Phaser.GameObjects.Ellipse;
  private horizon!: Phaser.GameObjects.Rectangle;
  private stageDeck!: Phaser.GameObjects.Rectangle;
  private stageStrip!: Phaser.GameObjects.Rectangle;
  private crowdBand!: Phaser.GameObjects.Rectangle;
  private paused = false;
  private previousActions = new Set<string>();
  private stars: BackgroundStar[] = [];
  private beams: LightBeam[] = [];
  private sceneTimeMs = 0;

  constructor() {
    super({ key: "game-scene" });
  }

  create(): void {
    if (!GameScene.deps) {
      throw new Error("GameScene dependencies are not configured.");
    }
    this.deps = GameScene.deps;

    this.physics.world.gravity.y = 980;
    this.physics.world.setBounds(0, 0, 960, 540);
    this.cameras.main.setBounds(0, 0, 960, 540);
    this.cameras.main.setRoundPixels(true);

    this.backdrop = this.add.rectangle(480, 270, 960, 540, 0x051423, 1).setOrigin(0.5);
    this.backdropGlowA = this.add.ellipse(300, 122, 360, 210, 0x1b5e9d, 0.18).setAngle(-10);
    this.backdropGlowB = this.add.ellipse(720, 160, 280, 180, 0x6d2f8e, 0.16).setAngle(12);

    this.horizon = this.add.rectangle(480, 404, 960, 164, 0x0a243a, 1).setOrigin(0.5);
    this.stageDeck = this.add.rectangle(480, 470, 960, 118, 0x091a2d, 1).setOrigin(0.5);
    this.crowdBand = this.add.rectangle(480, 500, 960, 78, 0x071221, 1).setOrigin(0.5);
    this.stageStrip = this.add.rectangle(480, 452, 960, 6, 0x91f2ff, 0.26).setOrigin(0.5);

    this.ground = this.add.rectangle(480, 518, 960, 44, 0x050d19, 1).setOrigin(0.5);
    this.physics.add.existing(this.ground, true);

    for (let i = 0; i < 28; i += 1) {
      const star = this.add.ellipse(
        Phaser.Math.Between(50, 910),
        Phaser.Math.Between(36, 250),
        Phaser.Math.Between(2, 4),
        Phaser.Math.Between(2, 4),
        0xe9fbff,
        Phaser.Math.FloatBetween(0.15, 0.55)
      );
      this.stars.push({
        node: star,
        baseY: star.y,
        drift: Phaser.Math.FloatBetween(0.4, 1.6),
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2)
      });
    }

    for (let i = 0; i < 4; i += 1) {
      const beam = this.add
        .rectangle(180 + i * 190, 236, 120, 420, 0xb1efff, 0.06)
        .setAngle(i % 2 === 0 ? -8 : 8)
        .setOrigin(0.5);
      this.beams.push({
        node: beam,
        baseX: beam.x,
        phase: i * 1.35
      });
    }

    for (let i = 0; i < 22; i += 1) {
      const width = Phaser.Math.Between(16, 30);
      const height = Phaser.Math.Between(28, 54);
      this.add.rectangle(26 + i * 46, 494, width, height, 0x0e1d2d, 0.9).setOrigin(0.5, 1);
    }

    this.playerCollider = this.add.rectangle(170, 420, 32, 56, 0xffffff, 0);
    this.physics.add.existing(this.playerCollider);
    const playerBody = this.getPlayerBody();
    playerBody.setSize(28, 56);
    playerBody.setOffset(2, 0);
    playerBody.setCollideWorldBounds(true);
    playerBody.setDragX(1600);
    playerBody.setMaxVelocity(360, 820);

    this.physics.add.collider(this.playerCollider, this.ground);

    const snapshot = this.deps.bridge.getSnapshot();
    this.playerView = new PlayerView(
      this,
      this.playerCollider.x,
      this.playerCollider.y,
      snapshot.activeMember.accentColor,
      snapshot.activeMember.id
    );

    this.cameras.main.startFollow(this.playerCollider, true, 0.08, 0.08, 150, 42);

    const keys = this.input.keyboard?.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      attack: Phaser.Input.Keyboard.KeyCodes.J,
      dash: Phaser.Input.Keyboard.KeyCodes.K,
      tag: Phaser.Input.Keyboard.KeyCodes.L,
      ultimate: Phaser.Input.Keyboard.KeyCodes.I,
      pause: Phaser.Input.Keyboard.KeyCodes.ESC
    }) as GameKeys | undefined;

    if (!keys) {
      throw new Error("Keyboard input is unavailable.");
    }
    this.keys = keys;

    this.input.on("pointerdown", () => {
      if (!this.deps.shellState.started) {
        this.startShowcase();
      }
    });

    this.applySnapshot(snapshot);
    this.deps.hud.update(snapshot);
    this.deps.hud.applyEvents(this.deps.bridge.consumeEvents());
    this.deps.hud.setStarted(this.deps.shellState.started);
  }

  update(_time: number, deltaMs: number): void {
    this.sceneTimeMs += deltaMs;
    this.syncKeyboardInput();
    const input = this.deps.inputBindings.getSnapshot();
    this.updateAmbient(deltaMs, input.move);

    if (!this.deps.shellState.started) {
      const requestedStart =
        input.move !== 0 || [...input.actions].some((action) => action !== "pause");
      if (requestedStart) {
        this.startShowcase();
      }
      this.playerView.updatePose({ speed: 0, airborne: false, timeMs: this.sceneTimeMs });
      this.enemyView?.updatePose(this.sceneTimeMs);
      this.previousActions = new Set(input.actions);
      return;
    }

    if (this.deps.shellState.pauseRequested) {
      this.deps.shellState.pauseRequested = false;
      this.togglePause();
    }

    this.handlePause(input.actions);

    if (!this.paused) {
      this.applyMovement(input);
      const snapshot = this.deps.bridge.update(deltaMs, input);
      const events = this.deps.bridge.consumeEvents();

      this.applySnapshot(snapshot);
      this.applyEvents(events);

      this.deps.hud.update(snapshot);
      this.deps.hud.applyEvents(events);
    } else {
      this.playerView.updatePose({ speed: 0, airborne: false, timeMs: this.sceneTimeMs });
      this.enemyView?.updatePose(this.sceneTimeMs);
    }

    this.previousActions = new Set(input.actions);
  }

  private startShowcase(): void {
    this.deps.shellState.started = true;
    this.deps.hud.setStarted(true);
    this.cameras.main.flash(180, 190, 245, 255, false);
  }

  private syncKeyboardInput(): void {
    const moveAxis =
      (this.keys.right.isDown || this.keys.d.isDown ? 1 : 0) -
      (this.keys.left.isDown || this.keys.a.isDown ? 1 : 0);
    this.deps.inputBindings.setPcMove(moveAxis);

    this.deps.inputBindings.setPcAction("jump", this.keys.up.isDown || this.keys.w.isDown || this.keys.space.isDown);
    this.deps.inputBindings.setPcAction("attack", this.keys.attack.isDown);
    this.deps.inputBindings.setPcAction("dash", this.keys.dash.isDown);
    this.deps.inputBindings.setPcAction("tag_next", this.keys.tag.isDown);
    this.deps.inputBindings.setPcAction("ultimate", this.keys.ultimate.isDown);
    this.deps.inputBindings.setPcAction("pause", this.keys.pause.isDown);
  }

  private applyMovement(input: { move: number; actions: ReadonlySet<string> }): void {
    const body = this.getPlayerBody();
    const baseSpeed = 210;
    body.setVelocityX(input.move * baseSpeed);

    const jumpPressed = input.actions.has("jump") && !this.previousActions.has("jump");
    if (jumpPressed && body.blocked.down) {
      body.setVelocityY(-445);
      this.cameras.main.shake(70, 0.0016, true);
    }

    const dashPressed = input.actions.has("dash") && !this.previousActions.has("dash");
    if (dashPressed) {
      const direction = input.move === 0 ? 1 : Math.sign(input.move);
      body.setVelocityX(direction * 420);
      this.spawnPulse(this.playerCollider.x + direction * 26, this.playerCollider.y + 4, 0x8eefff);
    }

    if (input.move < 0) {
      this.playerView.setFacing(-1);
    } else if (input.move > 0) {
      this.playerView.setFacing(1);
    }

    this.playerView.setPosition(this.playerCollider.x, this.playerCollider.y);
    this.playerView.updatePose({
      speed: body.velocity.x,
      airborne: !body.blocked.down,
      timeMs: this.sceneTimeMs
    });
    this.enemyView?.updatePose(this.sceneTimeMs);
  }

  private handlePause(actions: ReadonlySet<string>): void {
    const pausePressed = actions.has("pause") && !this.previousActions.has("pause");
    if (pausePressed) {
      this.togglePause();
    }
  }

  private togglePause(): void {
    this.paused = !this.paused;
    this.physics.world.isPaused = this.paused;
    this.deps.hud.setPaused(this.paused);
  }

  private updateAmbient(deltaMs: number, moveAxis: number): void {
    const drift = moveAxis * 0.12;
    for (const star of this.stars) {
      star.node.x -= drift * star.drift;
      if (star.node.x < 18) {
        star.node.x = 940;
      }
      if (star.node.x > 942) {
        star.node.x = 20;
      }
      star.node.y = star.baseY + Math.sin(this.sceneTimeMs / 900 + star.phase) * 4;
      star.node.alpha = 0.2 + (Math.sin(this.sceneTimeMs / 700 + star.phase) + 1) * 0.18;
    }

    for (const beam of this.beams) {
      beam.node.x = beam.baseX + Math.sin(this.sceneTimeMs / 1400 + beam.phase) * 18;
      beam.node.alpha = 0.03 + (Math.sin(this.sceneTimeMs / 1100 + beam.phase) + 1) * 0.04;
    }

    this.stageStrip.alpha = 0.18 + Math.sin(this.sceneTimeMs / 520) * 0.08;
    this.backdropGlowA.alpha = 0.14 + Math.sin(this.sceneTimeMs / 1700) * 0.04;
    this.backdropGlowB.alpha = 0.12 + Math.sin(this.sceneTimeMs / 1900 + 1.3) * 0.05;
  }

  private applySnapshot(snapshot: SimulationSnapshot): void {
    this.playerView.setAccentColor(snapshot.activeMember.accentColor);
    this.playerView.setLabel(snapshot.activeMember.id);

    const segment = snapshot.runState.segmentIndex;
    if (snapshot.runState.clearState === "boss") {
      this.setTheme(0x180918, 0x5d1430, 0x411229, 0xff6b8e, 0x7d2e47);
    } else if (segment === 0) {
      this.setTheme(0x051423, 0x114574, 0x0c314f, 0x90f2ff, 0x0a243a);
    } else if (segment === 1) {
      this.setTheme(0x07191b, 0x1b6756, 0x123f3a, 0x8ff3c1, 0x0d2b32);
    } else {
      this.setTheme(0x1b1208, 0x8a4f1a, 0x5b3313, 0xffd47f, 0x2b1d12);
    }

    if (snapshot.enemy) {
      if (!this.enemyView || this.enemyView.isBoss !== snapshot.enemy.isBoss) {
        this.enemyView?.destroy();
        this.enemyView = new EnemyView(this, 780, snapshot.enemy.isBoss ? 385 : 405, snapshot.enemy.isBoss);
      }
      this.enemyView.setPosition(780, snapshot.enemy.isBoss ? 385 : 405);
      this.enemyView.setHealth(snapshot.enemy.hp / snapshot.enemy.maxHp);
    } else if (this.enemyView) {
      this.enemyView.destroy();
      this.enemyView = null;
    }
  }

  private applyEvents(events: SimulationEvent[]): void {
    for (const event of events) {
      if (event.type === "attack_landed") {
        this.playerView.triggerAttackPulse();
        this.enemyView?.flashHit();
        this.cameras.main.shake(80, 0.0022, true);
        this.spawnSlash(this.playerCollider.x + 120, this.playerCollider.y - 18, 0x9fedff);
      }

      if (event.type === "ultimate_landed") {
        this.playerView.triggerAttackPulse();
        this.enemyView?.flashHit();
        this.cameras.main.flash(100, 255, 245, 250, false);
        this.cameras.main.shake(140, 0.0038, true);
        this.spawnPulse(this.playerCollider.x + 170, this.playerCollider.y - 34, 0xfff2b3, 74);
      }

      if (event.type === "tag_switched") {
        this.playerView.triggerTagPulse();
        this.spawnPulse(this.playerCollider.x, this.playerCollider.y - 10, 0xe2f8ff, 56);
      }

      if (event.type === "enemy_spawned") {
        this.enemyView?.pulseThreat();
      }

      if (event.type === "boss_started") {
        this.cameras.main.flash(180, 255, 110, 143, false);
      }

      if (event.type === "player_hit") {
        this.cameras.main.shake(130, 0.0026, true);
      }

      if (event.type === "run_failed") {
        this.paused = true;
        this.physics.world.isPaused = true;
        this.deps.hud.setPaused(true);
      }
    }
  }

  private spawnSlash(x: number, y: number, color: number): void {
    const slash = this.add.rectangle(x, y, 88, 10, color, 0.9).setAngle(-20);
    this.tweens.add({
      targets: slash,
      scaleX: 0.2,
      scaleY: 1.8,
      alpha: 0,
      duration: 120,
      onComplete: () => slash.destroy()
    });
  }

  private spawnPulse(x: number, y: number, color: number, size = 46): void {
    const ring = this.add.ellipse(x, y, size, size, color, 0.18).setStrokeStyle(2, color, 0.85);
    this.tweens.add({
      targets: ring,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 220,
      onComplete: () => ring.destroy()
    });
  }

  private setTheme(backdrop: number, glowA: number, glowB: number, strip: number, horizon: number): void {
    this.backdrop.setFillStyle(backdrop, 1);
    this.backdropGlowA.setFillStyle(glowA, 0.18);
    this.backdropGlowB.setFillStyle(glowB, 0.16);
    this.horizon.setFillStyle(horizon, 1);
    this.stageStrip.setFillStyle(strip, 0.28);
  }

  private getPlayerBody(): Phaser.Physics.Arcade.Body {
    const body = this.playerCollider.body;
    if (!body || !(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error("Player body was not initialized.");
    }
    return body;
  }
}
