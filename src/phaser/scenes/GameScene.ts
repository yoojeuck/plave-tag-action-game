import Phaser from "phaser";
import { InputBindings } from "../../game/input/bindings";
import type { SimulationEvent, SimulationSnapshot } from "../../game/simulation/types";
import type { SceneBridge } from "../adapters/sceneBridge";
import { EnemyView } from "../view/EnemyView";
import { PlayerView } from "../view/PlayerView";
import type { HudApi } from "../../ui/hud/createHud";

interface GameSceneDependencies {
  bridge: SceneBridge;
  hud: HudApi;
  inputBindings: InputBindings;
}

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
  private horizon!: Phaser.GameObjects.Rectangle;
  private paused = false;
  private previousActions = new Set<string>();

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

    this.backdrop = this.add.rectangle(480, 270, 960, 540, 0x051b2e, 1).setOrigin(0.5);
    this.horizon = this.add.rectangle(480, 430, 960, 180, 0x0e3251, 1).setOrigin(0.5);
    this.add.rectangle(480, 468, 960, 120, 0x092642, 1).setOrigin(0.5);

    this.ground = this.add.rectangle(480, 518, 960, 44, 0x0f172a, 1).setOrigin(0.5);
    this.physics.add.existing(this.ground, true);

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

    this.applySnapshot(snapshot);
    this.deps.hud.update(snapshot);
    this.deps.hud.applyEvents(this.deps.bridge.consumeEvents());
  }

  update(_time: number, deltaMs: number): void {
    this.syncKeyboardInput();
    const input = this.deps.inputBindings.getSnapshot();
    this.handlePause(input.actions);

    if (!this.paused) {
      this.applyMovement(input);
      const snapshot = this.deps.bridge.update(deltaMs, input);
      const events = this.deps.bridge.consumeEvents();

      this.applySnapshot(snapshot);
      this.applyEvents(events);

      this.deps.hud.update(snapshot);
      this.deps.hud.applyEvents(events);
    }

    this.previousActions = new Set(input.actions);
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
    }

    const dashPressed = input.actions.has("dash") && !this.previousActions.has("dash");
    if (dashPressed) {
      const direction = input.move === 0 ? 1 : Math.sign(input.move);
      body.setVelocityX(direction * 420);
    }

    if (input.move < 0) {
      this.playerView.setFacing(-1);
    } else if (input.move > 0) {
      this.playerView.setFacing(1);
    }

    this.playerView.setPosition(this.playerCollider.x, this.playerCollider.y);
  }

  private handlePause(actions: ReadonlySet<string>): void {
    const pausePressed = actions.has("pause") && !this.previousActions.has("pause");
    if (!pausePressed) {
      return;
    }
    this.paused = !this.paused;
    this.physics.world.isPaused = this.paused;
    this.deps.hud.setPaused(this.paused);
  }

  private applySnapshot(snapshot: SimulationSnapshot): void {
    this.playerView.setAccentColor(snapshot.activeMember.accentColor);
    this.playerView.setLabel(snapshot.activeMember.id);

    const segment = snapshot.runState.segmentIndex;
    if (snapshot.runState.clearState === "boss") {
      this.backdrop.setFillStyle(0x2d0b25, 1);
      this.horizon.setFillStyle(0x4a102e, 1);
    } else if (segment === 0) {
      this.backdrop.setFillStyle(0x051b2e, 1);
      this.horizon.setFillStyle(0x0e3251, 1);
    } else if (segment === 1) {
      this.backdrop.setFillStyle(0x132418, 1);
      this.horizon.setFillStyle(0x1d3f2a, 1);
    } else {
      this.backdrop.setFillStyle(0x241b13, 1);
      this.horizon.setFillStyle(0x3f2c1d, 1);
    }

    if (snapshot.enemy) {
      if (!this.enemyView || this.enemyView.label.text !== (snapshot.enemy.isBoss ? "MINI BOSS" : "ENEMY")) {
        this.enemyView?.destroy();
        this.enemyView = new EnemyView(this, 760, snapshot.enemy.isBoss ? 388 : 410, snapshot.enemy.isBoss);
      }
      this.enemyView.setHealth(snapshot.enemy.hp / snapshot.enemy.maxHp);
    } else if (this.enemyView) {
      this.enemyView.destroy();
      this.enemyView = null;
    }
  }

  private applyEvents(events: SimulationEvent[]): void {
    for (const event of events) {
      if (event.type === "attack_landed" || event.type === "ultimate_landed") {
        this.playerView.triggerAttackPulse();
        this.enemyView?.flashHit();
      }
      if (event.type === "run_failed") {
        this.physics.world.isPaused = true;
      }
    }
  }

  private getPlayerBody(): Phaser.Physics.Arcade.Body {
    const body = this.playerCollider.body;
    if (!body || !(body instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error("Player body was not initialized.");
    }
    return body;
  }
}
