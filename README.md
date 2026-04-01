# PLAVE Dream Run

PLAVE 멤버 5인을 오리지널 팬메이드 캐릭터 아트로 재해석한 비상업 횡스크롤 플랫폼 액션 데모입니다.

## Live Demo

- Target URL: `https://yoojeuck.github.io/plave-tag-action-game/`
- Deploy: GitHub Pages via GitHub Actions
- Current direction: Mario-style platforming with PLAVE-inspired character swapping

## Stack

- Phaser
- TypeScript
- Vite
- Vitest

## Core Loop

`달리기 -> 점프/블록 히트 -> 노트 수집 -> 적 밟기/프로젝트일 -> 멤버 태그 능력 활용 -> 골 플래그 도달`

## Characters

- Yejun: `Wave Burst` 3연발 노트 샷
- Noah: `Aerial Glide` 공중 활강
- Bamby: `Rose Hop` 더블 점프
- Eunho: `Impact Drop` 그라운드 파운드
- Hamin: `Neon Rush` 장거리 돌진

## Run

```bash
npm install
npm run dev
```

## Preview Production Build

```bash
npm run build
npm run preview
```

## Test

```bash
npm run test
```

## Controls

- PC: `A/D` 또는 `←/→` 이동, `W`/`↑`/`Space` 점프
- PC: `J` 파워 샷, `K` 스프린트, `L` 태그, `I` 멤버 스킬, `Esc` 일시정지
- Mobile: 좌측 이동 패드 + 우측 `JUMP/POWER/DASH/TAG/SKILL`

## Non-Commercial Note

- 본 프로젝트는 PLAVE 공식 이미지를 게임 내 원본 에셋으로 사용하지 않습니다.
- 캐릭터 스타일/색감 레퍼런스 용도로만 참고하며, 게임 플레이 캐릭터는 오리지널 SVG 캐릭터 아트로 제작합니다.
- 공식 비주얼 레퍼런스 링크는 `references/plave-visual-reference.md`에 정리되어 있습니다.
