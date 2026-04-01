import { MEMBER_ORDER, MEMBER_PROFILES } from "../content/members";
import type { Action } from "../input/actions";
import type {
  EnemyState,
  FrameInput,
  MemberId,
  MemberProfile,
  RunState,
  SimulationEvent,
  SimulationSnapshot
} from "./types";
import { CombatSystem } from "./combat-system";
import { MemberSystem } from "./member-system";
import { RunSystem } from "./run-system";

const SEGMENT_ENEMY_PRESETS = [
  { hp: 220, breakGauge: 80 },
  { hp: 280, breakGauge: 92 },
  { hp: 350, breakGauge: 105 }
] as const;

const BOSS_PRESET = { hp: 1450, breakGauge: 280 };

export class GameSimulation {
  private readonly memberSystem: MemberSystem;
  private readonly combatSystem = new CombatSystem();
  private readonly runSystem = new RunSystem();
  private readonly events: SimulationEvent[] = [];

  private readonly runState: RunState = {
    segmentIndex: 0,
    hpShared: 620,
    combo: 0,
    tagCooldownMs: 0,
    score: 0,
    clearState: "running"
  };

  private enemy: EnemyState | null = null;
  private enemySerial = 1;
  private timeMs = 0;
  private previousActions = new Set<Action>();

  constructor(params?: { startingMemberId?: MemberId; profiles?: Record<MemberId, MemberProfile> }) {
    const profiles = params?.profiles ?? MEMBER_PROFILES;
    const startingMemberId = params?.startingMemberId ?? "yejun";

    this.memberSystem = new MemberSystem({
      profiles,
      order: MEMBER_ORDER,
      startingMemberId
    });

    this.runSystem.init(this.runState, this.timeMs, this.emit);
    this.spawnEnemyForCurrentPhase();
  }

  update(deltaMs: number, input: FrameInput): SimulationSnapshot {
    this.timeMs += deltaMs;
    this.memberSystem.update(deltaMs);
    this.combatSystem.update(deltaMs);
    this.runState.tagCooldownMs = this.memberSystem.cooldownMs;

    if (this.runState.clearState === "failed" || this.runState.clearState === "cleared") {
      this.previousActions = new Set(input.actions);
      return this.getSnapshot();
    }

    if (this.isActionJustPressed(input.actions, "tag_next")) {
      this.memberSystem.tryTagNext(this.timeMs, this.emit);
      this.runState.tagCooldownMs = this.memberSystem.cooldownMs;
    }

    if (this.isActionJustPressed(input.actions, "attack")) {
      const result = this.combatSystem.tryNormalAttack({
        profile: this.memberSystem.activeMember,
        enemy: this.enemy,
        runState: this.runState,
        atMs: this.timeMs,
        emit: this.emit
      });
      if (result.enemyDefeated) {
        this.resolveEnemyDefeat();
      }
    }

    if (this.isActionJustPressed(input.actions, "ultimate")) {
      const result = this.combatSystem.tryUltimate({
        profile: this.memberSystem.activeMember,
        enemy: this.enemy,
        runState: this.runState,
        atMs: this.timeMs,
        emit: this.emit
      });
      if (result.enemyDefeated) {
        this.resolveEnemyDefeat();
      }
    }

    if (this.enemy) {
      this.combatSystem.tryEnemyPressure({
        profile: this.memberSystem.activeMember,
        runState: this.runState,
        atMs: this.timeMs,
        emit: this.emit
      });
    }

    if (this.combatSystem.isPlayerDown) {
      this.runSystem.onPlayerDown(this.runState, this.timeMs, this.emit);
    }

    if (!this.enemy && (this.runState.clearState === "running" || this.runState.clearState === "boss")) {
      this.spawnEnemyForCurrentPhase();
    }

    this.previousActions = new Set(input.actions);
    return this.getSnapshot();
  }

  /**
   * 테스트 전용 도우미:
   * 현재 적을 즉시 처치하여 구간 진행 이벤트를 강제로 검증할 수 있습니다.
   */
  debugDefeatEnemy(): void {
    if (!this.enemy) {
      return;
    }
    this.enemy.hp = 0;
    this.resolveEnemyDefeat();
  }

  consumeEvents(): SimulationEvent[] {
    return this.events.splice(0, this.events.length);
  }

  getSnapshot(): SimulationSnapshot {
    return {
      runState: { ...this.runState },
      activeMember: this.memberSystem.activeMember,
      activeMemberId: this.memberSystem.activeMemberId,
      enemy: this.enemy ? { ...this.enemy } : null,
      isPlayerDown: this.combatSystem.isPlayerDown,
      canUseUltimate: this.combatSystem.canUseUltimate(this.runState)
    };
  }

  private resolveEnemyDefeat(): void {
    if (!this.enemy) {
      return;
    }

    const wasBoss = this.enemy.isBoss;
    this.enemy = null;
    this.runSystem.onEnemyDefeated(this.runState, this.timeMs, this.emit, wasBoss);

    if (this.runState.clearState === "running" || this.runState.clearState === "boss") {
      this.spawnEnemyForCurrentPhase();
    }
  }

  private spawnEnemyForCurrentPhase(): void {
    if (this.enemy || this.runState.clearState === "cleared" || this.runState.clearState === "failed") {
      return;
    }

    const isBoss = this.runState.clearState === "boss";
    const preset = isBoss ? BOSS_PRESET : SEGMENT_ENEMY_PRESETS[this.runState.segmentIndex];

    this.enemy = {
      id: this.enemySerial++,
      hp: preset.hp,
      maxHp: preset.hp,
      breakGauge: preset.breakGauge,
      maxBreakGauge: preset.breakGauge,
      isBoss
    };

    this.emit({
      type: "enemy_spawned",
      atMs: this.timeMs,
      payload: {
        enemyId: this.enemy.id,
        hp: this.enemy.hp,
        isBoss
      }
    });
  }

  private isActionJustPressed(actions: ReadonlySet<Action>, action: Action): boolean {
    return actions.has(action) && !this.previousActions.has(action);
  }

  private readonly emit = (event: SimulationEvent): void => {
    this.events.push(event);
  };
}
