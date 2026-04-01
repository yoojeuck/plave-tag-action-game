import type { MemberProfile, MemberId } from "../simulation/types";

export const MEMBER_ORDER: MemberId[] = ["yejun", "noah", "bamby", "eunho", "hamin"];

export const MEMBER_PROFILES: Record<MemberId, MemberProfile> = {
  yejun: {
    id: "yejun",
    role: "Tempo Leader",
    baseStats: { maxHp: 600, attack: 34, defense: 14, speed: 1.0 },
    normalSkill: { name: "Wave Slice", damage: 42, breakDamage: 16, cooldownMs: 450 },
    tagSkill: { name: "Leader Baton", damage: 58, breakDamage: 24, cooldownMs: 3500 },
    ultimateSkill: { name: "Azure Finale", damage: 170, breakDamage: 80, cooldownMs: 15000 },
    accentColor: 0x4bb8ff
  },
  noah: {
    id: "noah",
    role: "Air Duelist",
    baseStats: { maxHp: 580, attack: 38, defense: 12, speed: 1.15 },
    normalSkill: { name: "Sky Riff", damage: 48, breakDamage: 18, cooldownMs: 400 },
    tagSkill: { name: "Afterimage Step", damage: 66, breakDamage: 26, cooldownMs: 3500 },
    ultimateSkill: { name: "Starlight Aria", damage: 184, breakDamage: 84, cooldownMs: 15000 },
    accentColor: 0x9e8cff
  },
  bamby: {
    id: "bamby",
    role: "Control Caster",
    baseStats: { maxHp: 560, attack: 33, defense: 11, speed: 1.1 },
    normalSkill: { name: "Bloom Spark", damage: 40, breakDamage: 22, cooldownMs: 420 },
    tagSkill: { name: "Petal Prison", damage: 55, breakDamage: 34, cooldownMs: 3500 },
    ultimateSkill: { name: "Rose Domain", damage: 165, breakDamage: 110, cooldownMs: 15000 },
    accentColor: 0xff78ad
  },
  eunho: {
    id: "eunho",
    role: "Breaker Vanguard",
    baseStats: { maxHp: 640, attack: 36, defense: 16, speed: 0.95 },
    normalSkill: { name: "Pulse Knuckle", damage: 44, breakDamage: 28, cooldownMs: 430 },
    tagSkill: { name: "Beat Crash", damage: 61, breakDamage: 42, cooldownMs: 3500 },
    ultimateSkill: { name: "Overdrive Drop", damage: 176, breakDamage: 120, cooldownMs: 15000 },
    accentColor: 0xffb84f
  },
  hamin: {
    id: "hamin",
    role: "Finisher",
    baseStats: { maxHp: 590, attack: 40, defense: 13, speed: 1.08 },
    normalSkill: { name: "Neon Edge", damage: 50, breakDamage: 20, cooldownMs: 390 },
    tagSkill: { name: "Flash Relay", damage: 69, breakDamage: 28, cooldownMs: 3500 },
    ultimateSkill: { name: "Final Chorus", damage: 192, breakDamage: 88, cooldownMs: 15000 },
    accentColor: 0x68ffb3
  }
};
