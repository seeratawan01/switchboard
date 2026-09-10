import type { Id, Toggle } from "./types";

/**
 * Every label is something a person wants to be or do. One grammar, one question.
 * Angles are tunable data, not code. brutal 95° and sarcasm 135° (not the plan's first
 * draft) so that all six interactions in plan §2a fall out of compat() with the plan's
 * thresholds unmodified. See rules.test.ts.
 */
export const TOGGLES: Toggle[] = [
  {
    id: "trauma",
    label: "Heal from my childhood",
    short: "heal",
    phrase: "healing from your childhood",
    kind: "outcome",
    theta: 320, // needs warmth, low dominance
    heavy: true,
    note: "trauma-honesty",
  },
  {
    id: "toxic",
    label: "Cut off everyone toxic",
    short: "cut toxic",
    phrase: "cutting off everyone toxic",
    kind: "outcome",
    theta: 45, // needs warmth and assertiveness
    caveat: "The stance for this one is our placement, not a measured one. No dedicated source yet.",
  },
  {
    id: "cheer",
    label: "Go easy on myself",
    short: "easy on me",
    phrase: "going easy on yourself",
    kind: "style",
    theta: 10, // pure warmth, turned inward
  },
  {
    id: "funny",
    label: "Be funnier",
    short: "funnier",
    phrase: "being funnier",
    kind: "style",
    theta: 340, // affiliative humor: warm, a little deferential
    variants: ["playful", "gentle"],
    gentleVariant: "gentle",
  },
  {
    id: "brutal",
    label: "Say exactly what I think",
    short: "say it",
    phrase: "saying exactly what you think",
    kind: "style",
    theta: 95, // dominant, a touch cool
    variants: ["direct", "kind"],
  },
  {
    id: "sarcasm",
    label: "Be sarcastic",
    short: "sarcastic",
    phrase: "being sarcastic",
    kind: "style",
    theta: 135, // hostile-dominant diagonal
    requires: ["funny"],
    alwaysWarn: "sarcasm-text",
  },
  {
    id: "reflect",
    label: "Understand myself deeply",
    short: "understand",
    phrase: "understanding yourself deeply",
    kind: "focus",
    axis: "self-focus",
    axisReason: "self-focus",
  },
  {
    id: "ruminate",
    label: "Stop overanalyzing myself",
    short: "stop overanalyzing",
    phrase: "not overanalyzing yourself",
    kind: "focus",
    axis: "self-focus",
    axisReason: "self-focus",
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
