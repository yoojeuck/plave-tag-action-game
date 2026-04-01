# PLAVE 5-Tag Side-Scroll Action (Fan Demo)

팬메이드 비상업 데모용 횡스크롤 액션 프로젝트입니다.

## Live Demo

- Target URL: `https://yoojeuck.github.io/plave-tag-action-game/`
- Deploy: GitHub Pages via GitHub Actions
- Current visuals: prototype shapes/placeholders, not final SD sprite art

## Stack

- Phaser
- TypeScript
- Vite
- Vitest

## Core Loop

`전투/이동 -> 태그 스위치 연계 -> 구간 클리어 -> 미니보스 -> 결과`

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
- PC: `J` 공격, `K` 대시, `L` 태그, `I` 궁극기, `Esc` 일시정지
- Mobile: 좌측 이동 패드 + 우측 액션 버튼

## Non-Commercial Note

- 본 프로젝트는 PLAVE 공식 이미지를 게임 내 원본 에셋으로 사용하지 않습니다.
- 캐릭터 스타일/색감 레퍼런스 용도로만 참고하며, 게임 플레이 캐릭터는 오리지널 SD 스프라이트 기준으로 제작합니다.
- 현재 공개 데모는 게임성 검증용 프로토타입이며, 캐릭터 플레이 에셋은 최종 아트가 아닙니다.
