import type { Effect, ReasonId } from "./types";

export type SourceId = "circumplex" | "hsq" | "gelkopf" | "egocentrism" | "expertise";

export type Source = {
  id: SourceId;
  cite: string; // author, year
  title: string;
  venue: string;
  url: string;
};

export const SOURCES: Record<SourceId, Source> = {
  circumplex: {
    id: "circumplex",
    cite: "Leary (1957); Wiggins (1979)",
    title: "The Interpersonal Circumplex",
    venue: "Interpersonal Diagnosis of Personality; Journal of Personality and Social Psychology",
    url: "https://doi.org/10.1037/0022-3514.37.3.395",
  },
  hsq: {
    id: "hsq",
    cite: "Martin, Puhlik-Doris, Larsen, Gray & Weir (2003)",
    title: "Individual differences in uses of humor: the Humor Styles Questionnaire",
    venue: "Journal of Research in Personality",
    url: "https://doi.org/10.1016/S0092-6566(02)00534-2",
  },
  gelkopf: {
    id: "gelkopf",
    cite: "Gelkopf (2011)",
    title: "The use of humor in serious mental illness: a review",
    venue: "Evidence-Based Complementary and Alternative Medicine",
    url: "https://doi.org/10.1093/ecam/nep106",
  },
  egocentrism: {
    id: "egocentrism",
    cite: "Kruger, Epley, Parker & Ng (2005)",
    title: "Egocentrism over e-mail: can we communicate as well as we think?",
    venue: "Journal of Personality and Social Psychology",
    url: "https://doi.org/10.1037/0022-3514.89.6.925",
  },
  expertise: {
    id: "expertise",
    cite: "Kalyuga, Ayres, Chandler & Sweller (2003)",
    title: "The expertise reversal effect",
    venue: "Educational Psychologist",
    url: "https://doi.org/10.1207/S15326985EP3801_4",
  },
};

export type Tier = "research" | "house" | "note";
export type Evidence = "strong" | "thin";

/** Names get substituted into copy. `target` and `by` are toggle labels. */
export type Names = { target: string; by: string; variant?: string };

export type Reason = {
  id: ReasonId;
  tier: Tier;
  /** Short text on the chip under the toggle. System voice: dry, first person, no apologies. */
  chip: (n: Names) => string;
  title: (n: Names) => string;
  why: (n: Names) => string;
  evidence?: Evidence;
  caveat?: string;
  sources?: SourceId[];
};

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export const REASONS: Record<ReasonId, Reason> = {
  "circumplex-lock": {
    id: "circumplex-lock",
    tier: "research",
    chip: (n) => `Switched off. It can't share a room with ${lower(n.by)}.`,
    title: (n) => `Why ${n.target} switched off`,
    why: (n) =>
      `Wanting to ${lower(n.by)} asks for almost the opposite stance from ${lower(n.target)}. On the interpersonal circle, opposite points pull against each other, and these two sit about as far apart as it gets.`,
    evidence: "strong",
    sources: ["circumplex"],
  },
  "circumplex-soften": {
    id: "circumplex-soften",
    tier: "research",
    chip: (n) => `Turned down, not off. It was pulling against ${lower(n.by)}.`,
    title: (n) => `Why ${n.target} got softer`,
    why: (n) =>
      `${n.target} leans one way and wanting to ${lower(n.by)} asks for the other: warm against cool, or pushing against yielding. Not a full clash, so I kept it and took the edge off.`,
    evidence: "strong",
    sources: ["circumplex"],
  },
  "circumplex-warn": {
    id: "circumplex-warn",
    tier: "research",
    chip: () => "These two argue. Your call.",
    title: (n) => `Why ${n.target} and ${lower(n.by)} argue`,
    why: (n) =>
      `On the interpersonal circle, ${lower(n.target)} and ${lower(n.by)} sit about a quarter turn apart. Behaviors at right angles don't cancel out, but they don't back each other up either. Mixed together, they read as inconsistent.`,
    evidence: "strong",
    sources: ["circumplex"],
  },
  "circumplex-boost": {
    id: "circumplex-boost",
    tier: "research",
    chip: () => "These two get along.",
    title: (n) => `Why ${n.target} and ${lower(n.by)} get along`,
    why: (n) =>
      `${n.target} and ${lower(n.by)} are neighbors on the interpersonal circle. Nearby behaviors reinforce each other, so this pair reads as one consistent voice rather than two.`,
    evidence: "strong",
    sources: ["circumplex"],
  },
  "humor-gentle": {
    id: "humor-gentle",
    tier: "research",
    chip: () => "Softer now. Heavy topic, so the jokes stay gentle.",
    title: () => "Why the humor stayed on, just softer",
    why: () =>
      "Humor isn't one thing. The warm, shared kind is affiliative humor, and reviews of humor in serious mental-health settings find it helps more than it hurts. So I kept it, in its gentle form.",
    evidence: "thin",
    caveat:
      "The review says so itself: the evidence is small and methodologically weak. Promising, not proven.",
    sources: ["gelkopf", "hsq"],
  },
  "sarcasm-text": {
    id: "sarcasm-text",
    tier: "research",
    chip: () => "Fair warning: your sarcasm lands worse in text than you think.",
    title: () => "Why sarcasm always comes with a warning",
    why: () =>
      "People badly overestimate how well a sarcastic tone survives in writing. Senders expected readers to catch it about 80% of the time. Readers did about as well as a coin flip.",
    evidence: "strong",
    sources: ["egocentrism"],
  },
  "expertise-reversal": {
    id: "expertise-reversal",
    tier: "research",
    chip: () => "Switched off. Can't be both at once.",
    title: (n) => `Why ${n.target} and ${lower(n.by)} can't both be on`,
    why: () =>
      "The scaffolding that helps a beginner, like worked examples and extra hand-holding, measurably slows an expert down. You can't be taught both ways at once.",
    evidence: "strong",
    sources: ["expertise"],
  },
  "needs-funny": {
    id: "needs-funny",
    tier: "research",
    chip: (n) => `Switched off. Flip ${n.by} first; sarcasm is a kind of funny.`,
    title: () => "Why Sarcasm needs Be funny",
    why: () =>
      "Sarcasm is a humor style, the aggressive one, not a separate tone. With no humor underneath, there's nothing for it to be a variant of.",
    evidence: "strong",
    sources: ["hsq"],
  },
  "house-too-many": {
    id: "house-too-many",
    tier: "house",
    chip: () => "Five's the limit. Something has to give.",
    title: () => "House rule",
    why: () => "Five wants at a time. There's no paper behind this one; it's just how the house runs.",
  },
  "house-pa-coach": {
    id: "house-pa-coach",
    tier: "house",
    chip: () => "You've invented the passive-aggressive pep talk.",
    title: () => "House rule",
    why: () => "Cheering yourself on, sarcastically. There's no paper behind this one; it's just how the house runs.",
  },
  "hold-firm": {
    id: "hold-firm",
    tier: "note",
    chip: () => "Strict mode. No overruling.",
    title: () => "Strict mode",
    why: () => "While strict mode is on, the board's locks stand. Turn it off to get the padlocks back.",
  },
  "trauma-honesty": {
    id: "trauma-honesty",
    tier: "note",
    chip: () => "Honest note: a switch can't do this.",
    title: () => "What flipping this actually does",
    why: () =>
      "No switch resolves trauma. This one records that you want to, then shows what that want asks of the rest of you: softer humor, less bite, no sarcasm. The board can map the tension. The work is yours.",
  },
};

export function reasonFor(effect: Effect): Reason {
  return REASONS[effect.reason];
}

export const EVIDENCE_LABEL: Record<Evidence, string> = {
  strong: "Strong",
  thin: "Promising but thin",
};
