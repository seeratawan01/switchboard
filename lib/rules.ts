import type { Effect, EffectType, EngineState, Id, Toggle, VisualState } from "./types";
import { TOGGLES } from "./toggles";

/** Plan §2a. compat = cos(θa − θb). */
export const THRESHOLDS = {
  boost: 0.3, //  compat >  0.3   → fine, adjacent toggles glow together
  warn: -0.3, // −0.3 … 0.3       → warn chip
  soften: -0.8, // −0.8 … −0.3    → drop to the gentle variant
  //             compat < −0.8    → lock off (always overridable)
} as const;

const rad = (deg: number) => (deg * Math.PI) / 180;

export function compat(thetaA: number, thetaB: number): number {
  return Math.cos(rad(thetaA - thetaB));
}

export type Band = "boost" | "warn" | "soften" | "lock";

export function band(c: number): Band {
  if (c > THRESHOLDS.boost) return "boost";
  if (c >= THRESHOLDS.warn) return "warn";
  if (c >= THRESHOLDS.soften) return "soften";
  return "lock";
}

const PRECEDENCE: Record<EffectType, number> = {
  lock: 4,
  soften: 3,
  warn: 2,
  boost: 1,
  note: 0,
};

type Ctx = {
  state: EngineState;
  toggles: Toggle[];
  byId: Record<string, Toggle>;
  theta: (t: Toggle) => number;
};

function related(a: Toggle, b: Toggle) {
  return a.requires?.includes(b.id) || b.requires?.includes(a.id);
}

function pairBand(ctx: Ctx, a: Toggle, b: Toggle): Band | null {
  if (a.theta === undefined || b.theta === undefined) return null;
  if (related(a, b)) return null;
  return band(compat(ctx.theta(a), ctx.theta(b)));
}

function isOverridden(ctx: Ctx, target: Id, by: Id) {
  return ctx.state.overrides[target]?.includes(by) ?? false;
}

/**
 * Pure. Given the ordered set of ON toggles and the user's overrides, return every effect.
 * Order of operations (plan §5):
 *   1. locks from outcome→style compat, the depth axis, and `requires`
 *   2. the effective set = on minus unoverridden locks
 *   3. soften / warn / boost among the effective set (style↔style is capped at warn)
 *   4. house rules and notes last; they never change state
 */
export function resolve(state: EngineState, toggles: Toggle[] = TOGGLES): Effect[] {
  const byId = Object.fromEntries(toggles.map((t) => [t.id, t])) as Record<string, Toggle>;
  const ctx: Ctx = {
    state,
    toggles,
    byId,
    theta: (t) => state.thetas?.[t.id] ?? t.theta ?? 0,
  };
  const on = state.on.filter((id) => byId[id]);
  const onSet = new Set(on);
  const outcomes = toggles.filter((t) => t.kind === "outcome");
  const styles = toggles.filter((t) => t.kind === "style");
  const depths = toggles.filter((t) => t.kind === "depth");

  const effects: Effect[] = [];
  const lock = (target: Id, by: Id, reason: Effect["reason"]) =>
    effects.push({ target, type: "lock", reason, by, overridden: isOverridden(ctx, target, by) });

  // 1a. An ON outcome locks any style that sits opposite it, whether or not the style is on.
  for (const o of outcomes) {
    if (!onSet.has(o.id)) continue;
    for (const s of styles) {
      if (pairBand(ctx, o, s) === "lock") lock(s.id, o.id, "circumplex-lock");
    }
  }

  // 1b. Depth axis: hard mutual exclusion. If both are on, the later one wins.
  const depthOn = on.filter((id) => byId[id].kind === "depth");
  for (const d of depths) {
    for (const other of depths) {
      if (d.id === other.id || !onSet.has(other.id)) continue;
      if (onSet.has(d.id) && depthOn.indexOf(d.id) > depthOn.indexOf(other.id)) continue; // d is later; d wins
      lock(d.id, other.id, "expertise-reversal");
    }
  }

  const effectiveAfter = (fx: Effect[]) =>
    new Set(
      on.filter(
        (id) => !fx.some((e) => e.type === "lock" && e.target === id && !e.overridden),
      ),
    );

  // 1c. `requires`: a toggle whose prerequisite is not effectively on is locked.
  const prelim = effectiveAfter(effects);
  for (const t of toggles) {
    for (const r of t.requires ?? []) {
      if (!prelim.has(r)) lock(t.id, r, "needs-funny");
    }
  }

  // 2. Effective set.
  const effective = effectiveAfter(effects);
  const lockedPair = (target: Id, by: Id) =>
    effects.some((e) => e.type === "lock" && e.target === target && e.by === by);

  // 3a. Outcome → style.
  for (const o of outcomes) {
    if (!effective.has(o.id)) continue;
    for (const s of styles) {
      if (!effective.has(s.id) || lockedPair(s.id, o.id)) continue;
      const b = pairBand(ctx, o, s);
      if (b === "boost") effects.push({ target: s.id, type: "boost", reason: "circumplex-boost", by: o.id });
      else if (b === "warn") effects.push({ target: s.id, type: "warn", reason: "circumplex-warn", by: o.id });
      else if (b === "soften")
        effects.push({
          target: s.id,
          type: "soften",
          reason: "circumplex-soften",
          by: o.id,
          variant: s.variants?.[1] ?? "gentle",
        });
      // 3b. Humor sub-model: a heavy outcome turns affiliative humor gentle, but keeps it on.
      if (o.heavy && s.gentleVariant)
        effects.push({ target: s.id, type: "soften", reason: "humor-gentle", by: o.id, variant: s.gentleVariant });
    }
  }

  // 3c. Style ↔ style. Peers can't lock or soften each other; the cap is warn. Emitted both ways.
  for (let i = 0; i < styles.length; i++) {
    for (let j = i + 1; j < styles.length; j++) {
      const a = styles[i];
      const b = styles[j];
      if (!effective.has(a.id) || !effective.has(b.id)) continue;
      const bd = pairBand(ctx, a, b);
      if (bd === null) continue;
      const type: EffectType = bd === "boost" ? "boost" : "warn";
      const reason = bd === "boost" ? "circumplex-boost" : "circumplex-warn";
      effects.push({ target: a.id, type, reason, by: b.id } as Effect);
      effects.push({ target: b.id, type, reason, by: a.id } as Effect);
    }
  }

  // 3d. Permanent warnings and notes.
  for (const t of toggles) {
    if (!effective.has(t.id)) continue;
    if (t.alwaysWarn) effects.push({ target: t.id, type: "warn", reason: t.alwaysWarn, by: t.id });
    if (t.note) effects.push({ target: t.id, type: "note", reason: t.note, by: t.id });
  }

  // 4. House rules. Chips only.
  if (effective.has("sarcasm") && effective.has("cheer")) {
    effects.push({ target: "sarcasm", type: "note", reason: "house-pa-coach", by: "cheer" });
  }

  return effects.sort((x, y) => {
    const ti = on.indexOf(x.target) - on.indexOf(y.target);
    return ti !== 0 ? ti : PRECEDENCE[y.type] - PRECEDENCE[x.type];
  });
}

/** Effects on one toggle, highest precedence first. */
export function effectsFor(effects: Effect[], id: Id): Effect[] {
  return effects
    .filter((e) => e.target === id)
    .sort((a, b) => PRECEDENCE[b.type] - PRECEDENCE[a.type]);
}

export function activeLocks(effects: Effect[], id: Id) {
  return effects.filter(
    (e): e is Extract<Effect, { type: "lock" }> => e.type === "lock" && e.target === id && !e.overridden,
  );
}

export function visualState(state: EngineState, effects: Effect[], id: Id): VisualState {
  if (activeLocks(effects, id).length) return "locked";
  if (!state.on.includes(id)) return "off";
  const mine = effectsFor(effects, id);
  if (mine.some((e) => e.type === "soften")) return "soft";
  if (mine.some((e) => e.type === "warn")) return "warn";
  return "on";
}

/** The toggles that are actually in force right now. */
export function effectiveOn(state: EngineState, effects: Effect[]): Id[] {
  return state.on.filter((id) => !activeLocks(effects, id).length);
}

/** Current variant tag for a toggle, or null when it is at its default. */
export function variantOf(effects: Effect[], id: Id): string | null {
  const s = effectsFor(effects, id).find((e) => e.type === "soften");
  return s && s.type === "soften" ? s.variant : null;
}

/**
 * Pairs that have a rule between them regardless of state; used to draw the idle wires.
 * Boost pairs are omitted: they only appear when they fire.
 */
export type PairKind = Band | "requires";

export function potentialPairs(
  toggles: Toggle[] = TOGGLES,
  thetas?: EngineState["thetas"],
  includeBoost = false,
): { a: Id; b: Id; kind: PairKind }[] {
  const ctx: Ctx = {
    state: { on: [], overrides: {}, thetas },
    toggles,
    byId: {},
    theta: (t) => thetas?.[t.id] ?? t.theta ?? 0,
  };
  const out: { a: Id; b: Id; kind: PairKind }[] = [];
  for (let i = 0; i < toggles.length; i++) {
    for (let j = i + 1; j < toggles.length; j++) {
      const a = toggles[i];
      const b = toggles[j];
      if (a.requires?.includes(b.id) || b.requires?.includes(a.id)) {
        out.push({ a: a.id, b: b.id, kind: "requires" });
        continue;
      }
      if (a.kind === "depth" && b.kind === "depth") {
        out.push({ a: a.id, b: b.id, kind: "lock" });
        continue;
      }
      if (a.kind === "outcome" && b.kind === "outcome") continue;
      const bd = pairBand(ctx, a, b);
      if (bd === null) continue;
      if (bd === "boost" && !includeBoost) continue;
      const peers = a.kind === "style" && b.kind === "style";
      out.push({ a: a.id, b: b.id, kind: peers && bd !== "boost" ? "warn" : bd });
    }
  }
  return out;
}
