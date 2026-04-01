import type { MemberId, MemberProfile, SimulationEvent } from "./types";

type EmitEvent = (event: SimulationEvent) => void;

export class MemberSystem {
  private readonly tagCooldownMs: number;
  private readonly order: MemberId[];
  private readonly profiles: Record<MemberId, MemberProfile>;
  private activeIndex: number;
  private cooldownRemainingMs = 0;

  constructor(params: {
    profiles: Record<MemberId, MemberProfile>;
    order: MemberId[];
    startingMemberId: MemberId;
    tagCooldownMs?: number;
  }) {
    this.profiles = params.profiles;
    this.order = [...params.order];
    this.activeIndex = this.order.indexOf(params.startingMemberId);
    this.tagCooldownMs = params.tagCooldownMs ?? 3500;

    if (this.activeIndex < 0) {
      this.activeIndex = 0;
    }
  }

  get activeMemberId(): MemberId {
    return this.order[this.activeIndex];
  }

  get activeMember(): MemberProfile {
    return this.profiles[this.activeMemberId];
  }

  get cooldownMs(): number {
    return this.cooldownRemainingMs;
  }

  update(deltaMs: number): void {
    this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - deltaMs);
  }

  tryTagNext(atMs: number, emit: EmitEvent): boolean {
    if (this.cooldownRemainingMs > 0) {
      return false;
    }

    const previous = this.activeMemberId;
    this.activeIndex = (this.activeIndex + 1) % this.order.length;
    const next = this.activeMemberId;
    this.cooldownRemainingMs = this.tagCooldownMs;

    emit({
      type: "tag_switched",
      atMs,
      payload: {
        from: previous,
        to: next,
        cooldownMs: this.cooldownRemainingMs
      }
    });

    return true;
  }
}
