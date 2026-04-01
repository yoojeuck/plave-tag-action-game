export interface SvgAssetManifestItem {
  key: string;
  path: string;
  width: number;
  height: number;
}

export interface GameAssetManifest {
  svg: SvgAssetManifestItem[];
  notes: {
    referencePolicy: string;
    referenceBoard: string;
  };
}

export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
}

export const ASSET_MANIFEST: GameAssetManifest = {
  svg: [
    { key: "member-yejun", path: assetUrl("assets/characters/yejun-runner.svg"), width: 128, height: 128 },
    { key: "member-noah", path: assetUrl("assets/characters/noah-runner.svg"), width: 128, height: 128 },
    { key: "member-bamby", path: assetUrl("assets/characters/bamby-runner.svg"), width: 128, height: 128 },
    { key: "member-eunho", path: assetUrl("assets/characters/eunho-runner.svg"), width: 128, height: 128 },
    { key: "member-hamin", path: assetUrl("assets/characters/hamin-runner.svg"), width: 128, height: 128 },
    { key: "note-coin", path: assetUrl("assets/items/note-coin.svg"), width: 96, height: 96 },
    { key: "question-block", path: assetUrl("assets/items/question-block.svg"), width: 96, height: 96 },
    { key: "used-block", path: assetUrl("assets/items/used-block.svg"), width: 96, height: 96 },
    { key: "goal-flag", path: assetUrl("assets/items/goal-flag.svg"), width: 96, height: 160 },
    { key: "dreamling", path: assetUrl("assets/items/dreamling.svg"), width: 112, height: 96 }
  ],
  notes: {
    referencePolicy: "공식 이미지는 멤버 식별용 스타일 참고만 사용. 게임 내 캐릭터는 오리지널 SVG 일러스트로 재구성.",
    referenceBoard: assetUrl("references/plave-visual-reference.md")
  }
};
