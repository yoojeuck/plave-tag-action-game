import type { Action } from "../input/actions";

export type MemberId = "yejun" | "noah" | "bamby" | "eunho" | "hamin";

export interface SkillSpec {
  name: string;
  damage: number;
  breakDamage: number;
  cooldownMs: number;
}

export interface MemberProfile {
  id: MemberId;
  role: string;
  baseStats: {
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  normalSkill: SkillSpec;
  tagSkill: SkillSpec;
  ultimateSkill: SkillSpec;
  accentColor: number;
}

export type ClearState = "running" | "boss" | "cleared" | "failed";

export interface RunState {
  segmentIndex: number;
  hpShared: number;
  combo: number;
  tagCooldownMs: number;
  score: number;
  clearState: ClearState;
}

export interface SaveData {
  unlockedSkills: Record<MemberId, string[]>;
  bestScoreByStage: Record<string, number>;
  controlPreset: "mobile" | "pc" | "hybrid";
  audioSettings: {
    bgm: number;
    sfx: number;
    muted: boolean;
  };
}

export interface EnemyState {
  id: number;
  hp: number;
  maxHp: number;
  breakGauge: number;
  maxBreakGauge: number;
  isBoss: boolean;
}

export interface SimulationSnapshot {
  runState: RunState;
  activeMember: MemberProfile;
  activeMemberId: MemberId;
  enemy: EnemyState | null;
  isPlayerDown: boolean;
  canUseUltimate: boolean;
}

export type SimulationEventType =
  | "segment_started"
  | "segment_cleared"
  | "boss_started"
  | "boss_defeated"
  | "run_cleared"
  | "run_failed"
  | "tag_switched"
  | "attack_landed"
  | "ultimate_landed"
  | "player_hit"
  | "player_down"
  | "enemy_spawned";

export interface SimulationEvent {
  type: SimulationEventType;
  atMs: number;
  payload?: Record<string, number | string | boolean>;
}

export interface FrameInput {
  move: number;
  actions: ReadonlySet<Action>;
}
