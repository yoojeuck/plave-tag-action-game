export interface SpriteManifestItem {
  key: string;
  path: string;
  frameSize: { width: number; height: number };
  frames: number;
}

export interface GameAssetManifest {
  sprites: SpriteManifestItem[];
  notes: {
    referencePolicy: string;
    referenceBoard: string;
  };
}

function withBaseUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
}

export const ASSET_MANIFEST: GameAssetManifest = {
  sprites: [
    { key: "yejun-idle", path: withBaseUrl("assets/sprites/yejun/idle.png"), frameSize: { width: 64, height: 64 }, frames: 6 },
    { key: "noah-idle", path: withBaseUrl("assets/sprites/noah/idle.png"), frameSize: { width: 64, height: 64 }, frames: 6 },
    { key: "bamby-idle", path: withBaseUrl("assets/sprites/bamby/idle.png"), frameSize: { width: 64, height: 64 }, frames: 6 },
    { key: "eunho-idle", path: withBaseUrl("assets/sprites/eunho/idle.png"), frameSize: { width: 64, height: 64 }, frames: 6 },
    { key: "hamin-idle", path: withBaseUrl("assets/sprites/hamin/idle.png"), frameSize: { width: 64, height: 64 }, frames: 6 }
  ],
  notes: {
    referencePolicy: "공식 이미지는 스타일/색감 레퍼런스로만 활용. 원본 이미지 직접 사용 금지.",
    referenceBoard: withBaseUrl("references/plave-visual-reference.md")
  }
};
