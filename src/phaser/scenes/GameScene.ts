import Phaser from "phaser";
import { MEMBER_DEFINITIONS, cycleMemberId } from "../../game/content/members";
import { InputBindings } from "../../game/input/bindings";
import { DREAM_STAGE_LEVEL } from "../../game/platformer/level-data";
import { calculateClearScore, determineRank, formatRunTime } from "../../game/platformer/score";
import type {
  BlockKind,
  EndState,
  HudState,
  MemberDefinition,
  MemberId,
  NoteSpec,
  ShellState as SharedShellState
} from "../../game/platformer/types";
import type { HudApi } from "../../ui/hud/createHud";
import { EnemyView } from "../view/EnemyView";
import { PlayerView } from "../view/PlayerView";

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

interface CloudDecoration {
  node: Phaser.GameObjects.Container;
  phase: number;
  drift: number;
  baseY: number;
}

interface NoteEntity {
  node: Phaser.GameObjects.Image;
  baseY: number;
  phase: number;
  collected: boolean;
}

interface BlockEntity {
  node: Phaser.GameObjects.Image;
  kind: BlockKind;
  reward: "note" | "none";
  used: boolean;
}

interface EnemyEntity {
  collider: Phaser.GameObjects.Rectangle;
  view: EnemyView;
  direction: -1 | 1;
  patrolLeft: number;
  patrolRight: number;
  speed: number;
  alive: boolean;
}

interface ProjectileEntity {
  node: Phaser.GameObjects.Arc;
  velocityX: number;
  velocityY: number;
  lifeMs: number;
}

interface CheckpointEntity {
  marker: Phaser.GameObjects.Container;
  label: string;
  x: number;
  activated: boolean;
}

export type ShellState = SharedShellState;

interface GameSceneDependencies {
  hud: HudApi;
  inputBindings: InputBindings;
  shellState: SharedShellState;
}

function bodyRect(body: Phaser.Physics.Arcade.Body): Phaser.Geom.Rectangle {
  return new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
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
  private goalFlag!: Phaser.GameObjects.Image;
  private goalGlow!: Phaser.GameObjects.Ellipse;
  private solids: Phaser.GameObjects.GameObject[] = [];
  private clouds: CloudDecoration[] = [];
  private blocks: BlockEntity[] = [];
  private notes: NoteEntity[] = [];
  private enemies: EnemyEntity[] = [];
  private projectiles: ProjectileEntity[] = [];
  private checkpoints: CheckpointEntity[] = [];
  private activeMemberId: MemberId = "yejun";
  private facing: -1 | 1 = 1;
  private previousActions = new Set<string>();
  private sceneTimeMs = 0;
  private score = 0;
  private notesCollected = 0;
  private lives = 3;
  private enemiesDefeated = 0;
  private hitsTaken = 0;
  private tagSwitches = 0;
  private paused = false;
  private finished = false;
  private gameOver = false;
  private runStartMs = 0;
  private finishTimeMs = 0;
  private respawnX = DREAM_STAGE_LEVEL.startX;
  private respawnY = DREAM_STAGE_LEVEL.startY;
  private wasGrounded = false;
  private attackCooldownMs = 0;
  private specialCooldownMs = 0;
  private invulnerableMs = 0;
  private dashBurstMs = 0;
  private glideMs = 0;
  private groundPoundActive = false;
  private extraJumpUsed = false;

  constructor() {
    super({ key: "game-scene" });
  }

  create(): void {
    if (!GameScene.deps) {
      throw new Error("GameScene dependencies are not configured.");
    }

    this.deps = GameScene.deps;
    this.resetState();

    this.physics.world.gravity.y = 1100;
    this.physics.world.setBounds(0, 0, DREAM_STAGE_LEVEL.worldWidth, DREAM_STAGE_LEVEL.worldHeight);
    this.cameras.main.setBounds(0, 0, DREAM_STAGE_LEVEL.worldWidth, DREAM_STAGE_LEVEL.worldHeight);
    this.cameras.main.setRoundPixels(true);

    this.createBackdrop();

    this.playerCollider = this.add.rectangle(DREAM_STAGE_LEVEL.startX, DREAM_STAGE_LEVEL.startY, 38, 58, 0xffffff, 0);
    this.physics.add.existing(this.playerCollider);
    const playerBody = this.getPlayerBody();
    playerBody.setSize(38, 58);
    playerBody.setCollideWorldBounds(true);
    playerBody.setDragX(1800);
    playerBody.setMaxVelocity(600, 1100);

    this.createPlatforms();
    this.createBlocks();
    this.createNotes();
    this.createEnemies();
    this.createCheckpoints();
    this.createGoal();

    this.playerView = new PlayerView(this, this.playerCollider.x, this.playerCollider.y, this.currentMember());
    this.cameras.main.startFollow(this.playerCollider, true, 0.08, 0.08, -250, 0);

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
        this.startRun();
      }
    });

    if (this.deps.shellState.started) {
      this.startRun(false);
    }

    this.deps.hud.showEnd(null);
    this.deps.hud.setPaused(false);
    this.deps.hud.setStarted(this.deps.shellState.started);
    this.deps.hud.update(this.buildHudState());
  }

  update(_time: number, deltaMs: number): void {
    this.sceneTimeMs += deltaMs;
    this.syncKeyboardInput();
    const input = this.deps.inputBindings.getSnapshot();

    this.updateClouds();
    this.handleShellRequests();

    if (!this.deps.shellState.started) {
      const requestedStart = input.move !== 0 || [...input.actions].some((action) => action !== "pause");
      if (requestedStart) {
        this.startRun();
      }
      this.playerView.updatePose({
        velocityX: 0,
        airborne: false,
        dashing: false,
        timeMs: this.sceneTimeMs
      });
      this.updateNotesFloat();
      this.previousActions = new Set(input.actions);
      return;
    }

    this.handlePause(input.actions);

    if (!this.paused && !this.finished) {
      this.tickCooldowns(deltaMs);
      this.applyMovement(input, deltaMs);
      this.updateProjectiles(deltaMs);
      this.updateNotesFloat();
      this.checkNoteCollection();
      this.updateEnemies();
      this.checkEnemyCollisions();
      this.checkCheckpointUnlocks();
      this.checkGoalReached();
      this.checkOutOfBounds();
      this.deps.hud.update(this.buildHudState());
    } else {
      this.updateNotesFloat();
      this.playerView.updatePose({
        velocityX: 0,
        airborne: false,
        dashing: false,
        timeMs: this.sceneTimeMs
      });
      for (const enemy of this.enemies) {
        if (enemy.alive) {
          enemy.view.updatePose(this.sceneTimeMs);
        }
      }
    }

    this.previousActions = new Set(input.actions);
  }

  private resetState(): void {
    this.solids = [];
    this.clouds = [];
    this.blocks = [];
    this.notes = [];
    this.enemies = [];
    this.projectiles = [];
    this.checkpoints = [];
    this.activeMemberId = "yejun";
    this.facing = 1;
    this.previousActions = new Set();
    this.sceneTimeMs = 0;
    this.score = 0;
    this.notesCollected = 0;
    this.lives = 3;
    this.enemiesDefeated = 0;
    this.hitsTaken = 0;
    this.tagSwitches = 0;
    this.paused = false;
    this.finished = false;
    this.gameOver = false;
    this.runStartMs = 0;
    this.finishTimeMs = 0;
    this.respawnX = DREAM_STAGE_LEVEL.startX;
    this.respawnY = DREAM_STAGE_LEVEL.startY;
    this.wasGrounded = false;
    this.attackCooldownMs = 0;
    this.specialCooldownMs = 0;
    this.invulnerableMs = 0;
    this.dashBurstMs = 0;
    this.glideMs = 0;
    this.groundPoundActive = false;
    this.extraJumpUsed = false;
  }

  private createBackdrop(): void {
    const worldCenter = DREAM_STAGE_LEVEL.worldWidth / 2;
    this.add.rectangle(worldCenter, 210, DREAM_STAGE_LEVEL.worldWidth, 500, 0x8fe7ff).setScrollFactor(0.1);
    this.add.rectangle(worldCenter, 550, DREAM_STAGE_LEVEL.worldWidth, 340, 0xc9f2ff).setScrollFactor(0.18);
    this.add.ellipse(760, 120, 220, 140, 0xfff2a8, 0.42).setScrollFactor(0.1);
    this.add.ellipse(820, 112, 280, 180, 0xffffff, 0.18).setScrollFactor(0.1);

    for (let i = 0; i < 16; i += 1) {
      const x = 180 + i * 360;
      const y = 100 + (i % 3) * 46;
      const cloud = this.add.container(x, y);
      const pieces = [
        this.add.ellipse(-40, 8, 72, 36, 0xffffff, 0.92),
        this.add.ellipse(0, -4, 92, 46, 0xffffff, 0.94),
        this.add.ellipse(44, 8, 64, 34, 0xffffff, 0.9)
      ];
      cloud.add(pieces);
      cloud.setScrollFactor(0.18 + (i % 3) * 0.04);
      this.clouds.push({
        node: cloud,
        phase: i * 0.7,
        drift: 0.2 + (i % 4) * 0.05,
        baseY: y
      });
    }

    for (let i = 0; i < 12; i += 1) {
      const x = 200 + i * 470;
      this.add.ellipse(x, 550, 360, 180, 0x5fb373, 1).setScrollFactor(0.34);
      this.add.ellipse(x + 180, 560, 280, 140, 0x7cc96d, 1).setScrollFactor(0.34);
    }

    for (let i = 0; i < 12; i += 1) {
      const x = 120 + i * 520;
      this.add.ellipse(x, 610, 420, 160, 0x4fa555, 1).setScrollFactor(0.52);
      this.add.ellipse(x + 220, 622, 280, 120, 0x6abd62, 1).setScrollFactor(0.52);
    }
  }

  private createPlatforms(): void {
    for (const platform of DREAM_STAGE_LEVEL.platforms) {
      const body = this.add.rectangle(platform.x, platform.y, platform.width, platform.height, 0x8d6137, 1);
      const top = this.add.rectangle(platform.x, platform.y - platform.height / 2 + 10, platform.width, 20, 0x8ee26c, 1);
      const lip = this.add.rectangle(platform.x, platform.y - platform.height / 2 + 20, platform.width, 8, 0xd8ffc6, 0.55);
      const shade = this.add.rectangle(platform.x, platform.y + platform.height / 2 - 12, platform.width, 24, 0x6c4727, 0.55);
      top.setDepth(1);
      lip.setDepth(1);
      shade.setDepth(-1);

      if (platform.style === "lift") {
        body.fillColor = 0x947055;
        top.fillColor = 0x74d6ff;
        lip.fillColor = 0xe6fbff;
      }

      this.physics.add.existing(body, true);
      const staticBody = body.body as Phaser.Physics.Arcade.StaticBody;
      staticBody.setSize(platform.width, platform.height);
      staticBody.updateFromGameObject();

      this.solids.push(body);
      this.physics.add.collider(this.playerCollider, body);
    }
  }

  private createBlocks(): void {
    for (const block of DREAM_STAGE_LEVEL.blocks) {
      const texture = block.kind === "question" ? "question-block" : "used-block";
      const node = this.add.image(block.x, block.y, texture).setDisplaySize(54, 54);
      this.physics.add.existing(node, true);
      const staticBody = node.body as Phaser.Physics.Arcade.StaticBody;
      staticBody.setSize(54, 54);
      staticBody.updateFromGameObject();

      const entity: BlockEntity = {
        node,
        kind: block.kind,
        reward: block.reward,
        used: block.kind !== "question"
      };

      this.blocks.push(entity);
      this.solids.push(node);
      this.physics.add.collider(this.playerCollider, node, () => this.handleBlockCollision(entity));
    }
  }

  private createNotes(): void {
    for (const note of DREAM_STAGE_LEVEL.notes) {
      this.spawnNote(note, false);
    }
  }

  private createEnemies(): void {
    for (const enemy of DREAM_STAGE_LEVEL.enemies) {
      const collider = this.add.rectangle(enemy.x, enemy.y, 32, 28, 0xffffff, 0);
      this.physics.add.existing(collider);
      const body = collider.body as Phaser.Physics.Arcade.Body;
      body.setSize(32, 28);
      body.setCollideWorldBounds(false);
      body.setBounce(0);
      body.setVelocityX(enemy.speed);

      for (const solid of this.solids) {
        this.physics.add.collider(collider, solid);
      }

      const view = new EnemyView(this, enemy.x, enemy.y);
      this.enemies.push({
        collider,
        view,
        direction: 1,
        patrolLeft: enemy.patrolLeft,
        patrolRight: enemy.patrolRight,
        speed: enemy.speed,
        alive: true
      });
    }
  }

  private createCheckpoints(): void {
    for (const checkpoint of DREAM_STAGE_LEVEL.checkpoints) {
      const marker = this.add.container(checkpoint.x, checkpoint.y);
      const pole = this.add.rectangle(0, -22, 8, 82, 0xe5fbff, 1);
      const sign = this.add.rectangle(18, -42, 72, 26, 0x234e7a, 0.95);
      const glow = this.add.ellipse(18, -42, 84, 34, 0x77e6ff, 0.18);
      const text = this.add
        .text(18, -42, "CP", {
          fontFamily: "Trebuchet MS, Verdana, sans-serif",
          fontSize: "16px",
          color: "#f4fbff",
          fontStyle: "bold"
        })
        .setOrigin(0.5);
      marker.add([glow, pole, sign, text]);
      marker.setAlpha(0.5);
      this.checkpoints.push({
        marker,
        label: checkpoint.label,
        x: checkpoint.x,
        activated: false
      });
    }
  }

  private createGoal(): void {
    this.goalGlow = this.add.ellipse(DREAM_STAGE_LEVEL.goalX - 12, DREAM_STAGE_LEVEL.goalY - 26, 150, 210, 0xffef9a, 0.2);
    this.goalFlag = this.add.image(DREAM_STAGE_LEVEL.goalX, DREAM_STAGE_LEVEL.goalY, "goal-flag").setDisplaySize(72, 120);
  }

  private startRun(flash = true): void {
    if (!this.deps.shellState.started) {
      this.deps.shellState.started = true;
    }
    this.deps.hud.setStarted(true);
    this.runStartMs = this.sceneTimeMs;
    if (flash) {
      this.cameras.main.flash(160, 255, 255, 255, false);
    }
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

  private handleShellRequests(): void {
    if (this.deps.shellState.restartRequested) {
      this.deps.shellState.restartRequested = false;
      this.scene.restart();
      return;
    }

    if (this.deps.shellState.pauseRequested) {
      this.deps.shellState.pauseRequested = false;
      if (!this.finished) {
        this.paused = !this.paused;
        this.physics.world.isPaused = this.paused;
        this.deps.hud.setPaused(this.paused);
      }
    }
  }

  private handlePause(actions: ReadonlySet<string>): void {
    if (this.finished) {
      return;
    }

    const pausePressed = actions.has("pause") && !this.previousActions.has("pause");
    if (pausePressed) {
      this.paused = !this.paused;
      this.physics.world.isPaused = this.paused;
      this.deps.hud.setPaused(this.paused);
    }
  }

  private tickCooldowns(deltaMs: number): void {
    this.attackCooldownMs = Math.max(0, this.attackCooldownMs - deltaMs);
    this.specialCooldownMs = Math.max(0, this.specialCooldownMs - deltaMs);
    this.invulnerableMs = Math.max(0, this.invulnerableMs - deltaMs);
    this.dashBurstMs = Math.max(0, this.dashBurstMs - deltaMs);
    this.glideMs = Math.max(0, this.glideMs - deltaMs);
  }

  private applyMovement(input: { move: number; actions: ReadonlySet<string> }, _deltaMs: number): void {
    const body = this.getPlayerBody();
    const currentMember = this.currentMember();
    const grounded = body.blocked.down || body.touching.down;
    const sprinting = input.actions.has("dash");
    const moveSpeed = sprinting ? 315 : 230;

    if (grounded) {
      this.extraJumpUsed = false;
      if (this.groundPoundActive && !this.wasGrounded) {
        this.groundPoundActive = false;
        this.spawnSparkBurst(this.playerCollider.x, this.playerCollider.y + 10, currentMember.accentColor, 10);
        this.cameras.main.shake(120, 0.0024, true);
        this.defeatEnemiesNear(this.playerCollider.x, this.playerCollider.y, 120);
      }
    }

    const jumpPressed = input.actions.has("jump") && !this.previousActions.has("jump");
    if (jumpPressed) {
      if (grounded) {
        body.setVelocityY(-510);
        this.playerView.triggerJump();
      } else if (currentMember.ability === "double-jump" && !this.extraJumpUsed) {
        body.setVelocityY(-470);
        this.extraJumpUsed = true;
        this.playerView.triggerSpecial();
        this.spawnSparkBurst(this.playerCollider.x, this.playerCollider.y, currentMember.accentColor, 6);
      }
    }

    const targetVelocityX = input.move * moveSpeed;
    if (this.dashBurstMs > 0 && currentMember.ability === "rush-dash") {
      body.setVelocityX((input.move === 0 ? this.signFromFacing() : Math.sign(input.move)) * 560);
    } else {
      body.setVelocityX(targetVelocityX);
    }

    if (input.move < 0) {
      this.facing = -1;
      this.playerView.setFacing(-1);
    } else if (input.move > 0) {
      this.facing = 1;
      this.playerView.setFacing(1);
    }

    const attackPressed = input.actions.has("attack") && !this.previousActions.has("attack");
    if (attackPressed && this.attackCooldownMs <= 0) {
      this.fireProjectiles(1, 0, currentMember.accentColor);
      this.playerView.triggerAttack();
      this.attackCooldownMs = 260;
    }

    const tagPressed = input.actions.has("tag_next") && !this.previousActions.has("tag_next");
    if (tagPressed) {
      this.activeMemberId = cycleMemberId(this.activeMemberId);
      this.playerView.setMember(this.currentMember());
      this.tagSwitches += 1;
      this.spawnSparkBurst(this.playerCollider.x, this.playerCollider.y - 18, this.currentMember().accentColor, 8);
    }

    const specialPressed = input.actions.has("ultimate") && !this.previousActions.has("ultimate");
    if (specialPressed && this.specialCooldownMs <= 0) {
      this.useMemberSpecial(currentMember, grounded);
    }

    if (currentMember.ability === "glide" && this.glideMs > 0 && !grounded && body.velocity.y > 80) {
      body.setVelocityY(Math.max(body.velocity.y - 18, 110));
    }

    this.playerView.setPosition(this.playerCollider.x, this.playerCollider.y);
    this.playerView.updatePose({
      velocityX: body.velocity.x,
      airborne: !grounded,
      dashing: this.dashBurstMs > 0 || sprinting,
      timeMs: this.sceneTimeMs
    });

    this.wasGrounded = grounded;

    for (const enemy of this.enemies) {
      if (enemy.alive) {
        enemy.view.updatePose(this.sceneTimeMs);
      }
    }

    this.goalGlow.alpha = 0.16 + Math.sin(this.sceneTimeMs / 220) * 0.05;
    this.goalGlow.scaleX = 0.96 + Math.sin(this.sceneTimeMs / 300) * 0.03;
    this.goalGlow.scaleY = 0.96 + Math.cos(this.sceneTimeMs / 300) * 0.03;
  }

  private useMemberSpecial(member: MemberDefinition, grounded: boolean): void {
    const body = this.getPlayerBody();
    this.playerView.triggerSpecial();

    switch (member.ability) {
      case "spread-shot":
        this.fireProjectiles(3, 56, member.accentColor);
        this.specialCooldownMs = 2400;
        break;
      case "glide":
        if (!grounded) {
          this.glideMs = 1800;
          this.specialCooldownMs = 2000;
        }
        break;
      case "double-jump":
        if (!grounded && !this.extraJumpUsed) {
          body.setVelocityY(-500);
          this.extraJumpUsed = true;
        } else if (grounded) {
          body.setVelocityY(-460);
        }
        this.spawnSparkBurst(this.playerCollider.x, this.playerCollider.y - 12, member.accentColor, 8);
        this.specialCooldownMs = 2200;
        break;
      case "ground-pound":
        if (!grounded) {
          body.setVelocityY(720);
          this.groundPoundActive = true;
        } else {
          this.spawnSparkBurst(this.playerCollider.x, this.playerCollider.y + 12, member.accentColor, 10);
          this.defeatEnemiesNear(this.playerCollider.x, this.playerCollider.y, 100);
        }
        this.specialCooldownMs = 2500;
        break;
      case "rush-dash":
        this.dashBurstMs = 240;
        body.setVelocityX(this.signFromFacing() * 560);
        this.specialCooldownMs = 2000;
        break;
    }
  }

  private signFromFacing(): -1 | 1 {
    return this.facing;
  }

  private fireProjectiles(count: number, arcSpread: number, color: number): void {
    const direction = this.getPlayerBody().velocity.x < 0 ? -1 : 1;
    const startX = this.playerCollider.x + direction * 18;
    const startY = this.playerCollider.y - 24;
    const offsets = count === 1 ? [0] : [-arcSpread, 0, arcSpread];

    for (const offset of offsets.slice(0, count)) {
      const node = this.add.circle(startX, startY, 7, color, 0.95).setStrokeStyle(2, 0xffffff, 0.75);
      this.projectiles.push({
        node,
        velocityX: direction * 460,
        velocityY: offset,
        lifeMs: 1200
      });
    }
  }

  private updateProjectiles(deltaMs: number): void {
    const deltaSeconds = deltaMs / 1000;
    for (const projectile of this.projectiles) {
      projectile.lifeMs -= deltaMs;
      projectile.node.x += projectile.velocityX * deltaSeconds;
      projectile.node.y += projectile.velocityY * deltaSeconds;
      projectile.node.alpha = Math.max(0.2, projectile.lifeMs / 1200);
    }

    for (const projectile of [...this.projectiles]) {
      if (projectile.lifeMs <= 0 || projectile.node.x < -20 || projectile.node.x > DREAM_STAGE_LEVEL.worldWidth + 20) {
        projectile.node.destroy();
        this.projectiles.splice(this.projectiles.indexOf(projectile), 1);
        continue;
      }

      for (const enemy of this.enemies) {
        if (!enemy.alive) {
          continue;
        }

        const enemyBody = enemy.collider.body as Phaser.Physics.Arcade.Body;
        if (Phaser.Geom.Intersects.RectangleToRectangle(bodyRect(enemyBody), projectile.node.getBounds())) {
          this.defeatEnemy(enemy, projectile.node.x, projectile.node.y);
          projectile.node.destroy();
          this.projectiles.splice(this.projectiles.indexOf(projectile), 1);
          break;
        }
      }
    }
  }

  private updateNotesFloat(): void {
    for (const note of this.notes) {
      if (note.collected) {
        continue;
      }
      note.node.y = note.baseY + Math.sin(this.sceneTimeMs / 170 + note.phase) * 4;
      note.node.angle = Math.sin(this.sceneTimeMs / 110 + note.phase) * 10;
    }
  }

  private checkNoteCollection(): void {
    for (const note of this.notes) {
      if (note.collected) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(this.playerCollider.x, this.playerCollider.y - 18, note.node.x, note.node.y);
      if (distance <= 36) {
        note.collected = true;
        const burstX = note.node.x;
        const burstY = note.node.y;
        note.node.destroy();
        this.notesCollected += 1;
        this.score += 120;
        this.spawnSparkBurst(burstX, burstY, 0xffd85e, 5);
      }
    }
  }

  private updateEnemies(): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        continue;
      }

      const body = enemy.collider.body as Phaser.Physics.Arcade.Body;
      if (enemy.collider.x <= enemy.patrolLeft) {
        enemy.direction = 1;
      } else if (enemy.collider.x >= enemy.patrolRight) {
        enemy.direction = -1;
      }
      body.setVelocityX(enemy.direction * enemy.speed);
      enemy.view.setFacing(enemy.direction);
      enemy.view.setPosition(enemy.collider.x, enemy.collider.y);

      if (enemy.collider.y > DREAM_STAGE_LEVEL.worldHeight + 80) {
        this.defeatEnemy(enemy, enemy.collider.x, enemy.collider.y);
      }
    }
  }

  private checkEnemyCollisions(): void {
    const playerBody = this.getPlayerBody();
    const playerBounds = bodyRect(playerBody);

    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        continue;
      }

      const enemyBody = enemy.collider.body as Phaser.Physics.Arcade.Body;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, bodyRect(enemyBody))) {
        continue;
      }

      const stomped = playerBody.velocity.y > 110 && playerBody.bottom <= enemyBody.top + 24;
      if (stomped) {
        playerBody.setVelocityY(-320);
        this.defeatEnemy(enemy, enemy.collider.x, enemy.collider.y);
      } else if (this.invulnerableMs <= 0) {
        this.damagePlayer();
      }
    }
  }

  private defeatEnemiesNear(x: number, y: number, radius: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        continue;
      }
      const distance = Phaser.Math.Distance.Between(x, y, enemy.collider.x, enemy.collider.y);
      if (distance <= radius) {
        this.defeatEnemy(enemy, enemy.collider.x, enemy.collider.y);
      }
    }
  }

  private defeatEnemy(enemy: EnemyEntity, x: number, y: number): void {
    if (!enemy.alive) {
      return;
    }
    enemy.alive = false;
    enemy.view.squash();
    enemy.collider.destroy();
    this.enemiesDefeated += 1;
    this.score += 180;
    this.spawnSparkBurst(x, y - 10, 0x7fd8ff, 6);
    this.time.delayedCall(180, () => enemy.view.destroy());
  }

  private checkCheckpointUnlocks(): void {
    for (const checkpoint of this.checkpoints) {
      if (checkpoint.activated || this.playerCollider.x < checkpoint.x) {
        continue;
      }
      checkpoint.activated = true;
      this.respawnX = checkpoint.x;
      this.respawnY = DREAM_STAGE_LEVEL.startY;
      checkpoint.marker.setAlpha(1);
      this.spawnSparkBurst(checkpoint.x + 18, 520, 0x78e4ff, 9);
      this.score += 250;
    }
  }

  private checkGoalReached(): void {
    if (this.finished || this.playerCollider.x < DREAM_STAGE_LEVEL.goalX - 36) {
      return;
    }
    this.finishTimeMs = Math.max(0, this.sceneTimeMs - this.runStartMs);
    const clearBonus = calculateClearScore({
      notesCollected: this.notesCollected,
      totalNotes: this.totalNotes(),
      enemiesDefeated: this.enemiesDefeated,
      hitsTaken: this.hitsTaken,
      tagSwitches: this.tagSwitches,
      timeMs: this.finishTimeMs
    });
    this.score += clearBonus;
    this.finishRun(true);
  }

  private checkOutOfBounds(): void {
    if (this.playerCollider.y > DREAM_STAGE_LEVEL.worldHeight + 120) {
      this.damagePlayer();
    }
  }

  private damagePlayer(): void {
    if (this.invulnerableMs > 0 || this.finished) {
      return;
    }

    this.lives -= 1;
    this.hitsTaken += 1;
    this.invulnerableMs = 1400;
    this.cameras.main.shake(140, 0.003, true);
    this.playerView.triggerHit();

    if (this.lives <= 0) {
      this.finishTimeMs = Math.max(0, this.sceneTimeMs - this.runStartMs);
      this.finishRun(false);
      return;
    }

    const body = this.getPlayerBody();
    body.reset(this.respawnX, this.respawnY);
    body.setVelocity(0, 0);
    this.playerCollider.setPosition(this.respawnX, this.respawnY);
    this.playerView.setPosition(this.respawnX, this.respawnY);
    this.groundPoundActive = false;
    this.glideMs = 0;
    this.dashBurstMs = 0;
  }

  private finishRun(success: boolean): void {
    this.finished = true;
    this.gameOver = !success;
    this.paused = false;
    this.physics.world.isPaused = true;
    this.deps.hud.setPaused(false);

    const endState: EndState = success
      ? {
          title: "Encore Clear",
          body: "You crossed the final flag and finished the rebuilt PLAVE stage.",
          score: this.score,
          rank: determineRank(this.score),
          notesLine: `Notes ${this.notesCollected}/${this.totalNotes()}`,
          timeLine: `Time ${formatRunTime(this.finishTimeMs)}`
        }
      : {
          title: "Stage Miss",
          body: "The team ran out of hearts before the encore gate. Try swapping members earlier for cleaner movement routes.",
          score: this.score,
          rank: determineRank(this.score),
          notesLine: `Notes ${this.notesCollected}/${this.totalNotes()}`,
          timeLine: `Time ${formatRunTime(this.finishTimeMs)}`
        };

    this.deps.hud.update(this.buildHudState());
    this.deps.hud.showEnd(endState);
  }

  private handleBlockCollision(block: BlockEntity): void {
    const body = this.getPlayerBody();
    const headHit = body.velocity.y < -120 && this.playerCollider.y > block.node.y + 10;
    if (!headHit) {
      return;
    }

    this.tweens.add({
      targets: block.node,
      y: block.node.y - 10,
      duration: 70,
      yoyo: true
    });

    if (block.kind === "question" && !block.used && block.reward === "note") {
      block.used = true;
      block.node.setTexture("used-block");
      this.spawnNote({ x: block.node.x, y: block.node.y - 54 }, true);
      this.score += 40;
    }
  }

  private spawnNote(spec: NoteSpec, bounceIn: boolean): void {
    const node = this.add.image(spec.x, spec.y, "note-coin").setDisplaySize(28, 28);
    const entity: NoteEntity = {
      node,
      baseY: spec.y,
      phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      collected: false
    };
    this.notes.push(entity);

    if (bounceIn) {
      node.setAlpha(0);
      node.setY(spec.y + 18);
      this.tweens.add({
        targets: node,
        y: spec.y,
        alpha: 1,
        duration: 180,
        ease: "Back.Out"
      });
    }
  }

  private spawnSparkBurst(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i += 1) {
      const spark = this.add.circle(x, y, Phaser.Math.Between(3, 5), color, 0.9);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(16, 44);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: Phaser.Math.Between(180, 300),
        onComplete: () => spark.destroy()
      });
    }
  }

  private updateClouds(): void {
    for (const cloud of this.clouds) {
      cloud.node.y = cloud.baseY + Math.sin(this.sceneTimeMs / 900 + cloud.phase) * 6;
      cloud.node.x += Math.sin(this.sceneTimeMs / 1600 + cloud.phase) * cloud.drift * 0.02;
    }
  }

  private currentMember(): MemberDefinition {
    return MEMBER_DEFINITIONS[this.activeMemberId];
  }

  private totalNotes(): number {
    return DREAM_STAGE_LEVEL.notes.length + DREAM_STAGE_LEVEL.blocks.filter((block) => block.reward === "note").length;
  }

  private currentSection(): { label: string; objective: string } {
    const section =
      DREAM_STAGE_LEVEL.sections.find((entry) => this.playerCollider.x <= entry.untilX) ??
      DREAM_STAGE_LEVEL.sections[DREAM_STAGE_LEVEL.sections.length - 1];
    return {
      label: section.label,
      objective: section.objective
    };
  }

  private buildHudState(): HudState {
    const section = this.currentSection();
    return {
      stageTitle: DREAM_STAGE_LEVEL.stageTitle,
      member: this.currentMember(),
      notesCollected: this.notesCollected,
      totalNotes: this.totalNotes(),
      score: this.score,
      lives: this.lives,
      objective: this.finished ? (this.gameOver ? "Retry the rebuilt stage." : "Flag touched. Encore clear.") : section.objective,
      sectionLabel: section.label,
      abilityStatus:
        this.specialCooldownMs > 0
          ? `${this.currentMember().abilityLabel} ${Math.ceil(this.specialCooldownMs / 1000)}s`
          : `${this.currentMember().abilityLabel} ready`,
      progressText: this.finished
        ? "Run complete"
        : `${Math.max(0, Math.min(100, Math.round((this.playerCollider.x / DREAM_STAGE_LEVEL.goalX) * 100)))}% to goal`,
      started: this.deps.shellState.started,
      paused: this.paused
    };
  }

  private getPlayerBody(): Phaser.Physics.Arcade.Body {
    return this.playerCollider.body as Phaser.Physics.Arcade.Body;
  }
}
