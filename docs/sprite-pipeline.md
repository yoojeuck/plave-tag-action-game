# Sprite Pipeline (Original SD Assets)

## Goal

멤버당 기본 애니메이션 세트:

- Idle
- Run
- Attack
- Hit
- Skill

## Workflow

1. seed frame 승인
2. strip 단위 생성(프레임 개별 생성 지양)
3. normalize (공통 scale + bottom-center anchor)
4. preview sheet 검토
5. 게임 반영

## Frame Rules

- 기준 프레임: 64x64
- 공통 anchor: `bottom-center`
- 프레임 수 권장:
  - Idle 6
  - Run 8
  - Attack 6
  - Hit 4
  - Skill 8

## File Layout

```text
public/assets/sprites/
  yejun/
  noah/
  bamby/
  eunho/
  hamin/
```
