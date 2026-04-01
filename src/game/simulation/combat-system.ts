import type { EnemyState, MemberProfile, RunState, SimulationEvent } from "./types";

type EmitEvent = (event: SimulationEvent) => void;

export class CombatSystem {
  private normalCooldownRemainingMs = 0;
  private ultimateCooldownRemainingMs = 0;
  private invulnerableRemainingMs = 0;
  private enemyPressureRemainingMs = 1400;
  private playerDown = false;

  update(deltaMs: number): void {
    this.normalCooldownRemainingMs = Math.max(0, this.normalCooldownRemainingMs - deltaMs);
    this.ultimateCooldownRemainingMs = Math.max(0, this.ultimateCooldownRemainingMs - deltaMs);
    this.invulnerableRemainingMs = Math.max(0, this.invulnerableRemainingMs - deltaMs);
    this.enemyPressureRemainingMs = Math.max(0, this.enemyPressureRemainingMs - deltaMs);
  }

  get isPlayerDown(): boolean {
    return this.playerDown;
  }

  get isInvulnerable(): boolean {
    return this.invulnerableRemainingMs > 0;
  }

  get canAttack(): boolean {
    return !this.playerDown && this.normalCooldownRemainingMs <= 0;
  }

  canUseUltimate(runState: RunState): boolean {
    return !this.playerDown && this.ultimateCooldownRemainingMs <= 0 && runState.combo >= 6;
  }

  tryNormalAttack(params: {
    profile: MemberProfile;
    enemy: EnemyState | null;
    runState: RunState;
    atMs: number;
    emit: EmitEvent;
  }): { enemyDefeated: boolean } {
    const { profile, enemy, runState, atMs, emit } = params;
    if (!enemy || !this.canAttack) {
      return { enemyDefeated: false };
    }

    this.normalCooldownRemainingMs = profile.normalSkill.cooldownMs;
    const enemyDefeated = this.applyDamage({
      enemy,
      damage: profile.normalSkill.damage + profile.baseStats.attack,
      breakDamage: profile.normalSkill.breakDamage,
      runState,
      atMs,
      emit,
      eventType: "attack_landed"
    });

    return { enemyDefeated };
  }

  tryUltimate(params: {
    profile: MemberProfile;
    enemy: EnemyState | null;
    runState: RunState;
    atMs: number;
    emit: EmitEvent;
  }): { enemyDefeated: boolean } {
    const { profile, enemy, runState, atMs, emit } = params;
    if (!enemy || !this.canUseUltimate(runState)) {
      return { enemyDefeated: false };
    }

    this.ultimateCooldownRemainingMs = profile.ultimateSkill.cooldownMs;
    const enemyDefeated = this.applyDamage({
      enemy,
      damage: profile.ultimateSkill.damage + profile.baseStats.attack * 1.4,
      breakDamage: profile.ultimateSkill.breakDamage,
      runState,
      atMs,
      emit,
      eventType: "ultimate_landed"
    });

    return { enemyDefeated };
  }

  tryEnemyPressure(params: {
    profile: MemberProfile;
    runState: RunState;
    atMs: number;
    emit: EmitEvent;
  }): boolean {
    const { profile, runState, atMs, emit } = params;
    if (this.playerDown || this.enemyPressureRemainingMs > 0 || this.isInvulnerable) {
      return false;
    }

    this.enemyPressureRemainingMs = 1400;
    const incoming = 68;
    const mitigated = Math.max(14, incoming - profile.baseStats.defense);
    runState.hpShared = Math.max(0, runState.hpShared - mitigated);
    runState.combo = 0;
    this.invulnerableRemainingMs = 900;

    emit({
      type: "player_hit",
      atMs,
      payload: {
        damage: mitigated,
        hp: runState.hpShared
      }
    });

    if (runState.hpShared <= 0) {
      this.playerDown = true;
      emit({
        type: "player_down",
        atMs
      });
    }

    return true;
  }

  private applyDamage(params: {
    enemy: EnemyState;
    damage: number;
    breakDamage: number;
    runState: RunState;
    atMs: number;
    emit: EmitEvent;
    eventType: "attack_landed" | "ultimate_landed";
  }): boolean {
    const roundedDamage = Math.round(params.damage);
    params.enemy.hp = Math.max(0, params.enemy.hp - roundedDamage);
    params.enemy.breakGauge = Math.max(0, params.enemy.breakGauge - params.breakDamage);

    params.runState.combo += 1;
    params.runState.score += 18 + params.runState.combo * 4;

    if (params.enemy.breakGauge <= 0 && params.enemy.hp > 0) {
      params.enemy.hp = Math.max(0, params.enemy.hp - 22);
      params.enemy.breakGauge = params.enemy.maxBreakGauge;
    }

    params.emit({
      type: params.eventType,
      atMs: params.atMs,
      payload: {
        damage: roundedDamage,
        enemyHp: params.enemy.hp,
        combo: params.runState.combo,
        score: params.runState.score
      }
    });

    return params.enemy.hp <= 0;
  }
}
