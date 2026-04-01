export const ACTIONS = [
  "move",
  "jump",
  "attack",
  "dash",
  "tag_next",
  "ultimate",
  "pause"
] as const;

export type Action = (typeof ACTIONS)[number];
