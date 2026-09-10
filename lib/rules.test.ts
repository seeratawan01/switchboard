import { describe, expect, it } from "vitest";
import { band, compat, effectsFor, potentialPairs, resolve, visualState } from "./rules";
import { reducer, initialState } from "./state";
import { decodeState, encodeState } from "./url-state";
import { TOGGLE_BY_ID } from "./toggles";
import type { EngineState, Id } from "./types";

const st = (on: Id[], overrides: EngineState["overrides"] = {}): EngineState => ({ on, overrides });

/** A compact picture of one toggle's situation: "lock:trauma", "soft:humor-gentle", "warn:toxic"… */
function summary(state: EngineState, id: Id) {
  const fx = effectsFor(resolve(state), id);
  return fx.map((e) => `${e.type}:${e.reason}:${e.by}${e.type === "soften" ? ":" + e.variant : ""}`);
}

const θ = (id: Id) => TOGGLE_BY_ID[id].theta!;

describe("compat()", () => {
  it("is cos of the angle difference", () => {
    expect(compat(0, 0)).toBeCloseTo(1);
    expect(compat(0, 90)).toBeCloseTo(0);
    expect(compat(0, 180)).toBeCloseTo(-1);
    expect(compat(350, 10)).toBeCloseTo(compat(0, 20));
  });
  it("bands per plan §2a", () => {
    expect(band(0.5)).toBe("boost");
    expect(band(0.3)).toBe("warn");
    expect(band(-0.3)).toBe("warn");
    expect(band(-0.31)).toBe("soften");
    expect(band(-0.8)).toBe("soften");
    expect(band(-0.81)).toBe("lock");
  });
});

describe("the six interactions from plan §2a fall out of the angles unmodified", () => {
  it("Trauma ON → Sarcasm locks", () => {
    expect(band(compat(θ("trauma"), θ("sarcasm")))).toBe("lock");
    expect(summary(st(["trauma", "funny", "sarcasm"]), "sarcasm")).toContain("lock:circumplex-lock:trauma");
    // and it locks even when Sarcasm is off: the padlock says "you can't turn this on"
    expect(visualState(st(["trauma"]), resolve(st(["trauma"])), "sarcasm")).toBe("locked");
  });
  it("Heal ON → Say exactly what I think softens to its kind variant", () => {
    expect(band(compat(θ("trauma"), θ("brutal")))).toBe("soften");
    expect(summary(st(["trauma", "brutal"]), "brutal")).toEqual(["soften:circumplex-soften:trauma:kind"]);
  });
  it("Heal ON → Be funnier stays on, gentle variant, via the humor sub-model", () => {
    expect(band(compat(θ("trauma"), θ("funny")))).toBe("boost");
    const s = st(["trauma", "funny"]);
    const fx = resolve(s);
    expect(visualState(s, fx, "funny")).toBe("soft");
    expect(summary(s, "funny")).toEqual(["soften:humor-gentle:trauma:gentle", "boost:circumplex-boost:trauma"]);
  });
  it("Cut off everyone toxic ON → Say exactly what I think is fine", () => {
    expect(band(compat(θ("toxic"), θ("brutal")))).toBe("boost");
    expect(visualState(st(["toxic", "brutal"]), resolve(st(["toxic", "brutal"])), "brutal")).toBe("on");
  });
  it("Cut toxic relationships ON → Sarcasm gets a warning", () => {
    expect(band(compat(θ("toxic"), θ("sarcasm")))).toBe("warn");
    expect(summary(st(["toxic", "funny", "sarcasm"]), "sarcasm")).toContain("warn:circumplex-warn:toxic");
  });
  it("Cut off everyone toxic ON → Be funnier is fine", () => {
    expect(band(compat(θ("toxic"), θ("funny")))).toBe("boost");
    expect(visualState(st(["toxic", "funny"]), resolve(st(["toxic", "funny"])), "funny")).toBe("on");
  });
  it("Go easy on myself + Say exactly what I think → warning on both", () => {
    expect(band(compat(θ("cheer"), θ("brutal")))).toBe("warn");
    expect(summary(st(["cheer", "brutal"]), "brutal")).toEqual(["warn:circumplex-warn:cheer"]);
    expect(summary(st(["cheer", "brutal"]), "cheer")).toEqual(["warn:circumplex-warn:brutal"]);
  });
});

describe("humor sub-model", () => {
  it("Be sarcastic requires Be funnier: locked when funny is off, even with nothing else on", () => {
    expect(summary(st([]), "sarcasm")).toEqual(["lock:needs-funny:funny"]);
    expect(summary(st(["sarcasm"]), "sarcasm")).toEqual(["lock:needs-funny:funny"]);
  });
  it("Sarcasm always carries the text-tone warning when on", () => {
    expect(summary(st(["funny", "sarcasm"]), "sarcasm")).toEqual(["warn:sarcasm-text:sarcasm"]);
  });
  it("Be funnier and Be sarcastic never argue with each other (requires pairs skip compat)", () => {
    const fx = resolve(st(["funny", "sarcasm"]));
    expect(fx.filter((e) => e.by === "funny" && e.target === "sarcasm")).toEqual([]);
    expect(fx.filter((e) => e.by === "sarcasm" && e.target === "funny")).toEqual([]);
  });
});

describe("self-focus axis", () => {
  it("both on → both flagged, nothing locked (the paper separates them, it doesn't forbid them)", () => {
    const s = st(["reflect", "ruminate"]);
    expect(summary(s, "reflect")).toEqual(["warn:self-focus:ruminate"]);
    expect(summary(s, "ruminate")).toEqual(["warn:self-focus:reflect"]);
    expect(visualState(s, resolve(s), "reflect")).toBe("warn");
  });
  it("one on → nothing", () => {
    expect(summary(st(["reflect"]), "reflect")).toEqual([]);
    expect(summary(st(["reflect"]), "ruminate")).toEqual([]);
  });
});

describe("overrides", () => {
  it("an overridden lock is reported but no longer removes the toggle", () => {
    const s = st(["trauma", "funny", "sarcasm"], { sarcasm: ["trauma"] });
    const fx = resolve(s);
    expect(visualState(s, fx, "sarcasm")).toBe("warn"); // on, with the permanent warning
    expect(fx.find((e) => e.type === "lock" && e.target === "sarcasm")).toMatchObject({ overridden: true });
    // the overridden pair gets no further compat effects
    expect(fx.filter((e) => e.target === "sarcasm" && e.by === "trauma")).toHaveLength(1);
  });
  it("locked toggles are removed from every later computation", () => {
    // sarcasm is locked by trauma → no toxic→sarcasm warn, no house rule with cheer
    const fx = resolve(st(["trauma", "toxic", "cheer", "funny", "sarcasm"]));
    expect(fx.filter((e) => e.target === "sarcasm").map((e) => e.type)).toEqual(["lock"]);
  });
});

describe("house rules", () => {
  it("Be sarcastic + Go easy on myself → house-rule chip, no state change", () => {
    const s = st(["cheer", "funny", "sarcasm"]);
    expect(summary(s, "sarcasm")).toContain("note:house-pa-coach:cheer");
    expect(visualState(s, resolve(s), "sarcasm")).toBe("warn");
  });
  it("five on → the sixth refuses (reducer)", () => {
    let s = { ...initialState };
    for (const id of ["cheer", "funny", "brutal", "toxic", "reflect"] as Id[]) s = reducer(s, { type: "toggle", id });
    expect(s.on).toHaveLength(5);
    const r = reducer(s, { type: "toggle", id: "trauma" });
    expect(r.on).toHaveLength(5);
    expect(r.refusal).toMatchObject({ id: "trauma", reason: "house-too-many" });
  });
  it("a locked toggle does not count toward the five", () => {
    let s = { ...initialState };
    // sarcasm is locked by trauma, so only four are in force
    for (const id of ["trauma", "funny", "sarcasm", "cheer", "reflect"] as Id[]) s = reducer(s, { type: "toggle", id });
    expect(s.on).toHaveLength(5);
    const r = reducer(s, { type: "toggle", id: "toxic" });
    expect(r.refusal).toBeNull();
    expect(r.on).toHaveLength(6);
  });
});

describe("reducer: overrides clear when their trigger changes", () => {
  it("override survives unrelated flips and dies with its trigger", () => {
    let s = reducer({ ...initialState }, { type: "toggle", id: "trauma" });
    s = reducer(s, { type: "toggle", id: "funny" });
    s = reducer(s, { type: "override", id: "sarcasm" });
    expect(s.on).toContain("sarcasm");
    expect(s.overrides.sarcasm).toEqual(["trauma"]);
    s = reducer(s, { type: "toggle", id: "cheer" });
    expect(s.overrides.sarcasm).toEqual(["trauma"]);
    s = reducer(s, { type: "toggle", id: "trauma" }); // trigger off
    expect(s.overrides.sarcasm).toBeUndefined();
    expect(s.on).toContain("sarcasm"); // still on, now simply because funny is on
    s = reducer(s, { type: "toggle", id: "trauma" }); // trigger back on
    expect(visualState(s, resolve(s), "sarcasm")).toBe("locked"); // override did not outlive its reason
  });
  it("override on a toggle without an active lock is a no-op", () => {
    const s = reducer({ ...initialState }, { type: "override", id: "cheer" });
    expect(s).toEqual(initialState);
  });
});

describe("strict mode", () => {
  it("refuses overrides and retracts existing ones when switched on", () => {
    let s = reducer({ ...initialState }, { type: "toggle", id: "trauma" });
    s = reducer(s, { type: "toggle", id: "funny" });
    s = reducer(s, { type: "override", id: "sarcasm" });
    expect(s.overrides.sarcasm).toEqual(["trauma"]);
    s = reducer(s, { type: "strict", on: true });
    expect(s.overrides).toEqual({});
    expect(visualState(s, resolve(s), "sarcasm")).toBe("locked");
    const r = reducer(s, { type: "override", id: "sarcasm" });
    expect(r.overrides).toEqual({});
    expect(r.refusal).toMatchObject({ id: "sarcasm", reason: "hold-firm" });
    // switching it off does not resurrect old overrides
    const off = reducer(r, { type: "strict", on: false });
    expect(off.overrides).toEqual({});
  });
  it("ignores overrides from the URL while strict", () => {
    const h = reducer(initialState, { type: "hydrate", on: ["trauma", "funny"], overrides: { sarcasm: ["trauma"] }, strict: true });
    expect(h.on).toEqual(["trauma", "funny"]);
    expect(h.overrides).toEqual({});
  });
  it("round-trips through the URL", () => {
    const q = encodeState({ on: ["trauma"], overrides: {}, strict: true });
    expect(q).toBe("?on=trauma&strict=1");
    expect(decodeState(q)).toEqual({ on: ["trauma"], overrides: {}, strict: true });
  });
});

describe("url state", () => {
  it("round-trips", () => {
    const s = { on: ["trauma", "funny", "sarcasm"] as Id[], overrides: { sarcasm: ["trauma"] as Id[] } };
    const q = encodeState(s);
    expect(q).toBe("?on=trauma%2Cfunny%2Csarcasm&over=sarcasm%3Atrauma");
    expect(decodeState(q)).toEqual(s);
    expect(encodeState({ on: [], overrides: {} })).toBe("");
  });
  it("drops junk and caps on hydrate", () => {
    expect(decodeState("?on=trauma,nope,trauma&over=sarcasm:zzz")).toEqual({ on: ["trauma"], overrides: { sarcasm: [] } });
    const h = reducer(initialState, {
      type: "hydrate",
      on: ["cheer", "funny", "brutal", "toxic", "trauma", "reflect"],
      overrides: { sarcasm: ["trauma"] }, // sarcasm isn't on and trauma's lock on it is real → allowed, turns it on
    });
    expect(h.on).toEqual(["cheer", "funny", "brutal", "toxic", "trauma", "sarcasm"]);
    expect(h.refusal).toBeNull();
  });
});

describe("wires", () => {
  it("lists the tension pairs, not the boosts", () => {
    const pairs = potentialPairs().map((p) => `${p.a}-${p.b}:${p.kind}`);
    expect(pairs).toEqual(
      expect.arrayContaining([
        "trauma-brutal:soften",
        "trauma-sarcasm:lock",
        "toxic-sarcasm:warn",
        "cheer-brutal:warn",
        "cheer-sarcasm:warn",
        "funny-brutal:warn",
        "funny-sarcasm:requires",
        "reflect-ruminate:warn",
      ]),
    );
    expect(pairs.some((p) => p.includes("boost"))).toBe(false);
    expect(pairs.some((p) => p.startsWith("trauma-toxic"))).toBe(false);
  });
});
