import { assetUrl } from "../assets/manifest";
import type { MemberDefinition, MemberId } from "../platformer/types";

export const MEMBER_ORDER: MemberId[] = ["yejun", "noah", "bamby", "eunho", "hamin"];

export const MEMBER_DEFINITIONS: Record<MemberId, MemberDefinition> = {
  yejun: {
    id: "yejun",
    displayName: "Yejun",
    role: "Balanced Captain",
    accentColor: 0x59c9ff,
    textureKey: "member-yejun",
    imageUrl: assetUrl("assets/characters/yejun-runner.svg"),
    ability: "spread-shot",
    abilityLabel: "Wave Burst",
    abilitySummary: "Fires a fast 3-note spread to clear the lane.",
    silhouetteNote: "Blue trapper beanie, navy hair, white knit layers.",
    referenceUrl: "https://image.weversejapan.com/official/live/plave/contents/profile/4/1b8b039fa14a4b59a26e3ad8550f0710.jpg"
  },
  noah: {
    id: "noah",
    displayName: "Noah",
    role: "Sky Glider",
    accentColor: 0xb08dff,
    textureKey: "member-noah",
    imageUrl: assetUrl("assets/characters/noah-runner.svg"),
    ability: "glide",
    abilityLabel: "Aerial Glide",
    abilitySummary: "Hold the air longer to drift safely over long gaps.",
    silhouetteNote: "Cream beanie, blonde bob, striped scarf, lavender accents.",
    referenceUrl: "https://image.weversejapan.com/official/live/plave/contents/profile/4/c71033b1b86c497299ed5aa13974a2f7.jpg"
  },
  bamby: {
    id: "bamby",
    displayName: "Bamby",
    role: "Double Hopper",
    accentColor: 0xff8fbd,
    textureKey: "member-bamby",
    imageUrl: assetUrl("assets/characters/bamby-runner.svg"),
    ability: "double-jump",
    abilityLabel: "Rose Hop",
    abilitySummary: "Resets one extra jump in the air for trickier routes.",
    silhouetteNote: "Pink hair, blue star cap, warm brown vest, pastel beads.",
    referenceUrl: "https://image.weversejapan.com/official/live/plave/contents/profile/4/6b21f583dfff430c806ad77b1677c97d.jpg"
  },
  eunho: {
    id: "eunho",
    displayName: "Eunho",
    role: "Impact Breaker",
    accentColor: 0xffa87a,
    textureKey: "member-eunho",
    imageUrl: assetUrl("assets/characters/eunho-runner.svg"),
    ability: "ground-pound",
    abilityLabel: "Impact Drop",
    abilitySummary: "Crashes down to wipe nearby enemies with a shockwave.",
    silhouetteNote: "Split black-white hair, white beanie, glossy pink jacket.",
    referenceUrl: "https://image.weversejapan.com/official/live/plave/contents/profile/4/238834ae2f784d99b1f601147da5830a.jpg"
  },
  hamin: {
    id: "hamin",
    displayName: "Hamin",
    role: "Rush Finisher",
    accentColor: 0x6fe0ff,
    textureKey: "member-hamin",
    imageUrl: assetUrl("assets/characters/hamin-runner.svg"),
    ability: "rush-dash",
    abilityLabel: "Neon Rush",
    abilitySummary: "Blasts forward in a long dash to break momentum checks.",
    silhouetteNote: "Dark hair, bunny beanie, cool blue sweater, clean straps.",
    referenceUrl: "https://image.weversejapan.com/official/live/plave/contents/profile/4/835d86a283554513a463ed42f1bed118.jpg"
  }
};

export function cycleMemberId(currentId: MemberId): MemberId {
  const currentIndex = MEMBER_ORDER.indexOf(currentId);
  const nextIndex = (currentIndex + 1) % MEMBER_ORDER.length;
  return MEMBER_ORDER[nextIndex];
}
