export type Id =
  | "trauma"
  | "toxic"
  | "funny"
  | "sarcasm"
  | "brutal"
  | "cheer"
  | "eli5"
  | "expert";

export type Kind = "outcome" | "style" | "depth";

export type ReasonId =
  | "circumplex-lock"
  | "circumplex-soften"
  | "circumplex-warn"
  | "circumplex-boost"
  | "humor-gentle"
  | "sarcasm-text"
  | "expertise-reversal"
  | "needs-funny"
  | "house-too-many"
  | "house-pa-coach"
  | "hold-firm"
  | "trauma-honesty";

export type Toggle = {
  id: Id;
  label: string;
  /** Short name for the circle diagram. */
  short?: string;
  kind: Kind;
  /** Degrees on the interpersonal circumplex. 0° warm, 90° dominant, 180° cold, 270° submissive. */
  theta?: number;
  /** Depth toggles live on their own one-dimensional axis, not the circle. */
  axis?: "knowledge";
  /** variants[0] is the default; variants[1] is what a soften drops to. */
  variants?: string[];
  /** This toggle only makes sense when these are on. Pairs joined by `requires` skip compat(). */
  requires?: Id[];
  /** Outcome only: a heavy topic. Switches affiliative humor to its gentle variant. */
  heavy?: boolean;
  /** Style only: the variant this drops to when a heavy outcome is on. */
  gentleVariant?: string;
  /** A warn chip that is always attached while this toggle is on. */
  alwaysWarn?: ReasonId;
  /** An info chip that is always attached while this toggle is on. */
  note?: ReasonId;
  /** Shown on cards for effects this toggle triggers: the angle is a guess, not a measured one. */
  caveat?: string;
};

export type Effect =
  | { target: Id; type: "lock"; reason: ReasonId; by: Id; overridden: boolean }
  | { target: Id; type: "soften"; reason: ReasonId; by: Id; variant: string }
  | { target: Id; type: "warn"; reason: ReasonId; by: Id }
  | { target: Id; type: "boost"; reason: ReasonId; by: Id }
  | { target: Id; type: "note"; reason: ReasonId; by: Id };

export type EffectType = Effect["type"];

/** What the engine needs. `on` is insertion-ordered: for a hard exclusion the later one wins. */
export type EngineState = {
  on: Id[];
  /** target → the toggles whose lock on it the user overruled. */
  overrides: Partial<Record<Id, Id[]>>;
  /** Debug-panel angle overrides. */
  thetas?: Partial<Record<Id, number>>;
};

export type VisualState = "off" | "on" | "soft" | "warn" | "locked";
