import type { EngineState, Id, ReasonId } from "./types";
import { MAX_ON } from "./toggles";
import { activeLocks, effectiveOn, resolve } from "./rules";

export type Refusal = { id: Id; reason: ReasonId; nonce: number };

export type State = EngineState & {
  refusal: Refusal | null;
  hydrated: boolean;
  debug: boolean;
  /** "Hold me to it": locks cannot be overruled. */
  strict: boolean;
};

export type Action =
  | { type: "toggle"; id: Id }
  | { type: "override"; id: Id }
  | { type: "hydrate"; on: Id[]; overrides: EngineState["overrides"]; debug?: boolean; strict?: boolean }
  | { type: "strict"; on: boolean }
  | { type: "clear" }
  | { type: "theta"; id: Id; theta: number | null }
  | { type: "dismissRefusal" };

export const initialState: State = { on: [], overrides: {}, refusal: null, hydrated: false, debug: false, strict: false };

/** Overrides survive until the toggle that caused them changes; then they clear. */
function clearOverridesTouching(overrides: State["overrides"], id: Id): State["overrides"] {
  const next: State["overrides"] = {};
  for (const [target, bys] of Object.entries(overrides) as [Id, Id[]][]) {
    if (target === id) continue;
    const kept = bys.filter((b) => b !== id);
    if (kept.length) next[target] = kept;
  }
  return next;
}

function refuse(state: State, id: Id, reason: ReasonId = "house-too-many"): State {
  return { ...state, refusal: { id, reason, nonce: Date.now() } };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "toggle": {
      const { id } = action;
      if (state.on.includes(id)) {
        return {
          ...state,
          on: state.on.filter((x) => x !== id),
          overrides: clearOverridesTouching(state.overrides, id),
          refusal: null,
        };
      }
      const effects = resolve(state);
      if (effectiveOn(state, effects).length >= MAX_ON) return refuse(state, id);
      return {
        ...state,
        on: [...state.on, id],
        overrides: clearOverridesTouching(state.overrides, id),
        refusal: null,
      };
    }
    case "override": {
      const { id } = action;
      const effects = resolve(state);
      const locks = activeLocks(effects, id);
      if (!locks.length) return state;
      if (state.strict) return refuse(state, id, "hold-firm");
      if (effectiveOn(state, effects).length >= MAX_ON) return refuse(state, id);
      const bys = Array.from(new Set([...(state.overrides[id] ?? []), ...locks.map((l) => l.by)]));
      return {
        ...state,
        on: state.on.includes(id) ? state.on : [...state.on, id],
        overrides: { ...state.overrides, [id]: bys },
        refusal: null,
      };
    }
    case "hydrate": {
      // Trust the URL, but hold the house rule: the effective set is capped.
      let s: State = {
        ...state,
        on: [],
        overrides: {},
        hydrated: true,
        debug: action.debug ?? state.debug,
        strict: action.strict ?? state.strict,
      };
      for (const id of action.on) {
        const n = reducer(s, { type: "toggle", id });
        if (n.refusal) break;
        s = n;
      }
      for (const [target, bys] of Object.entries(action.overrides) as [Id, Id[]][]) {
        if (!bys.length || s.strict) continue;
        const locks = activeLocks(resolve(s), target);
        const valid = bys.filter((b) => locks.some((l) => l.by === b));
        if (!valid.length) continue;
        if (!s.on.includes(target)) s = { ...s, on: [...s.on, target] };
        s = { ...s, overrides: { ...s.overrides, [target]: valid } };
      }
      return { ...s, refusal: null };
    }
    case "clear":
      return { ...state, on: [], overrides: {}, refusal: null };
    case "strict":
      // Turning it on retracts every override; the locks it protected come back.
      return { ...state, strict: action.on, overrides: action.on ? {} : state.overrides, refusal: null };
    case "theta": {
      const thetas = { ...(state.thetas ?? {}) };
      if (action.theta === null) delete thetas[action.id];
      else thetas[action.id] = action.theta;
      return { ...state, thetas };
    }
    case "dismissRefusal":
      return state.refusal ? { ...state, refusal: null } : state;
  }
}
