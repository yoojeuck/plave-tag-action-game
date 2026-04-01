import type { Action } from "../input/actions";

export type MemberId = "yejun" | "noah" | "bamby" | "eunho" | "hamin";

export type MemberAbility = "spread-shot" | "glide" | "double-jump" | "ground-pound" | "rush-dash";

export interface MemberDefinition {
  id: MemberId;
  displayName: string;
  role: string;
  accentColor: number;
  textureKey: string;
  imageUrl: string;
  ability: MemberAbility;
  abilityLabel: string;
  abilitySummary: string;
  silhouetteNote: string;
  referenceUrl: string;
}

export interface PlatformSpec {
  x: number;
  y: number;
  width: number;
  height: number;
  style: "ground" | "lift";
}

export type BlockKind = "question" | "solid";

export interface BlockSpec {
  x: number;
  y: number;
  kind: BlockKind;
  reward: "note" | "none";
}

export interface NoteSpec {
  x: number;
  y: number;
}

export interface EnemySpec {
  x: number;
  y: number;
  patrolLeft: number;
  patrolRight: number;
  speed: number;
}

export interface CheckpointSpec {
  x: number;
  y: number;
  label: string;
}

export interface SectionSpec {
  untilX: number;
  label: string;
  objective: string;
}

export interface LevelData {
  stageTitle: string;
  worldWidth: number;
  worldHeight: number;
  startX: number;
  startY: number;
  goalX: number;
  goalY: number;
  platforms: PlatformSpec[];
  blocks: BlockSpec[];
  notes: NoteSpec[];
  enemies: EnemySpec[];
  checkpoints: CheckpointSpec[];
  sections: SectionSpec[];
}

export interface HudState {
  stageTitle: string;
  member: MemberDefinition;
  notesCollected: number;
  totalNotes: number;
  score: number;
  lives: number;
  objective: string;
  sectionLabel: string;
  abilityStatus: string;
  progressText: string;
  started: boolean;
  paused: boolean;
}

export interface EndState {
  title: string;
  body: string;
  score: number;
  rank: "S" | "A" | "B" | "C";
  notesLine: string;
  timeLine: string;
}

export interface ShellState {
  started: boolean;
  touchMode: boolean;
  pauseRequested: boolean;
  restartRequested: boolean;
}

export interface PlatformerInputSnapshot {
  move: number;
  actions: ReadonlySet<Action>;
}
