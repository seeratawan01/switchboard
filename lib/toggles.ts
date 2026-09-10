import type { Id, Toggle } from "./types";

/**
 * Angles are tunable data, not code. Two differ from the plan's first draft
 * (brutal 120→95, sarcasm 150→135) so that all six interactions in plan §2a
 * fall out of compat() with the plan's thresholds unmodified. See rules.test.ts.
 */
export const TOGGLES: Toggle[] = [
  {
    id: "trauma",
    label: "Resolve my childhood trauma",
    short: "trauma",
    kind: "outcome",
    theta: 320, // needs warmth, low dominance
    heavy: true,
    note: "trauma-honesty",
  },
  {
    id: "toxic",
    label: "Cut all toxic relationships",
    short: "cut toxic",
    kind: "outcome",
    theta: 45, // needs warmth and assertiveness
    caveat:
      "The stance for this goal is our placement, not a measured one. No dedicated source yet.",
  },
  {
    id: "cheer",
    label: "Cheer me on",
    short: "cheer",
    kind: "style",
    theta: 10, // pure warmth
  },
  {
    id: "funny",
    label: "Be funny",
    short: "funny",
    kind: "style",
    theta: 340, // affiliative humor: warm, a little deferential
    variants: ["playful", "gentle"],
    gentleVariant: "gentle",
  },
  {
    id: "brutal",
    label: "Brutal honesty",
    short: "brutal",
    kind: "style",
    theta: 95, // dominant, a touch cool
    variants: ["direct", "kind"],
  },
  {
    id: "sarcasm",
    label: "Sarcasm",
    short: "sarcasm",
    kind: "style",
    theta: 135, // hostile-dominant diagonal
    requires: ["funny"],
    alwaysWarn: "sarcasm-text",
  },
  {
    id: "eli5",
    label: "Explain things to me simply",
    kind: "depth",
    axis: "knowledge",
  },
  {
    id: "expert",
    label: "Treat me like an expert",
    kind: "depth",
    axis: "knowledge",
  },
];

export const TOGGLE_BY_ID = Object.fromEntries(TOGGLES.map((t) => [t.id, t])) as Record<
  Id,
  Toggle
>;

export const ALL_IDS = TOGGLES.map((t) => t.id);

export const isId = (s: string): s is Id => (ALL_IDS as string[]).includes(s);

/** House rule: how many wants the board will hold at once. */
export const MAX_ON = 5;
