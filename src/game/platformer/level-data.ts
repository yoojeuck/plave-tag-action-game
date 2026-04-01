import type { LevelData } from "./types";

export const DREAM_STAGE_LEVEL: LevelData = {
  stageTitle: "Dream Run 1-1",
  worldWidth: 5600,
  worldHeight: 720,
  startX: 140,
  startY: 540,
  goalX: 5360,
  goalY: 500,
  platforms: [
    { x: 360, y: 640, width: 720, height: 160, style: "ground" },
    { x: 1240, y: 640, width: 620, height: 160, style: "ground" },
    { x: 2020, y: 640, width: 520, height: 160, style: "ground" },
    { x: 2840, y: 640, width: 760, height: 160, style: "ground" },
    { x: 3800, y: 640, width: 860, height: 160, style: "ground" },
    { x: 4980, y: 640, width: 1240, height: 160, style: "ground" },
    { x: 790, y: 488, width: 160, height: 28, style: "lift" },
    { x: 1010, y: 440, width: 160, height: 28, style: "lift" },
    { x: 1505, y: 500, width: 160, height: 28, style: "lift" },
    { x: 1725, y: 430, width: 160, height: 28, style: "lift" },
    { x: 2260, y: 466, width: 180, height: 28, style: "lift" },
    { x: 2600, y: 392, width: 180, height: 28, style: "lift" },
    { x: 3240, y: 510, width: 190, height: 28, style: "lift" },
    { x: 3540, y: 438, width: 190, height: 28, style: "lift" },
    { x: 3870, y: 364, width: 180, height: 28, style: "lift" },
    { x: 4440, y: 500, width: 200, height: 28, style: "lift" },
    { x: 4740, y: 420, width: 200, height: 28, style: "lift" }
  ],
  blocks: [
    { x: 628, y: 470, kind: "question", reward: "note" },
    { x: 682, y: 470, kind: "question", reward: "note" },
    { x: 736, y: 470, kind: "solid", reward: "none" },
    { x: 1460, y: 418, kind: "question", reward: "note" },
    { x: 1514, y: 418, kind: "question", reward: "note" },
    { x: 2310, y: 376, kind: "question", reward: "note" },
    { x: 2364, y: 376, kind: "solid", reward: "none" },
    { x: 2418, y: 376, kind: "question", reward: "note" },
    { x: 3210, y: 448, kind: "question", reward: "note" },
    { x: 3264, y: 448, kind: "solid", reward: "none" },
    { x: 3318, y: 448, kind: "question", reward: "note" },
    { x: 4550, y: 360, kind: "question", reward: "note" },
    { x: 4604, y: 360, kind: "question", reward: "note" }
  ],
  notes: [
    { x: 410, y: 544 },
    { x: 472, y: 510 },
    { x: 534, y: 476 },
    { x: 936, y: 392 },
    { x: 998, y: 358 },
    { x: 1060, y: 392 },
    { x: 1310, y: 544 },
    { x: 1580, y: 370 },
    { x: 1780, y: 366 },
    { x: 1890, y: 544 },
    { x: 2190, y: 420 },
    { x: 2480, y: 334 },
    { x: 2900, y: 546 },
    { x: 3430, y: 390 },
    { x: 3680, y: 318 },
    { x: 3930, y: 546 },
    { x: 4300, y: 546 },
    { x: 4620, y: 318 },
    { x: 4850, y: 366 },
    { x: 5100, y: 520 }
  ],
  enemies: [
    { x: 760, y: 568, patrolLeft: 600, patrolRight: 900, speed: 52 },
    { x: 1360, y: 568, patrolLeft: 1110, patrolRight: 1460, speed: 54 },
    { x: 2050, y: 568, patrolLeft: 1870, patrolRight: 2160, speed: 58 },
    { x: 2485, y: 320, patrolLeft: 2520, patrolRight: 2680, speed: 38 },
    { x: 3120, y: 568, patrolLeft: 2840, patrolRight: 3380, speed: 56 },
    { x: 3540, y: 366, patrolLeft: 3460, patrolRight: 3620, speed: 40 },
    { x: 4300, y: 568, patrolLeft: 4040, patrolRight: 4540, speed: 62 },
    { x: 5020, y: 568, patrolLeft: 4740, patrolRight: 5280, speed: 64 }
  ],
  checkpoints: [
    { x: 2750, y: 560, label: "Checkpoint: Sky Bridge" },
    { x: 4540, y: 560, label: "Checkpoint: Encore Lane" }
  ],
  sections: [
    { untilX: 1800, label: "Act 1", objective: "Learn the flow, bump the note blocks, and clear the first gap." },
    { untilX: 3900, label: "Act 2", objective: "Swap members to cross layered platforms and patrol routes." },
    { untilX: 5600, label: "Act 3", objective: "Finish the encore stretch and touch the PLAVE flag." }
  ]
};
