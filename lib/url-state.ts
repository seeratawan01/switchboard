import type { EngineState, Id } from "./types";
import { isId } from "./toggles";

export type Shareable = Pick<EngineState, "on" | "overrides"> & { strict?: boolean };

/** `?on=trauma,funny&over=sarcasm:trauma,expert:eli5` */
export function encodeState(s: Shareable): string {
  const p = new URLSearchParams();
  if (s.on.length) p.set("on", s.on.join(","));
  const over = Object.entries(s.overrides)
    .filter(([, bys]) => bys && bys.length)
    .map(([t, bys]) => `${t}:${(bys as Id[]).join("+")}`);
  if (over.length) p.set("over", over.join(","));
  if (s.strict) p.set("strict", "1");
  const q = p.toString();
  return q ? `?${q}` : "";
}

export function decodeState(search: string): Shareable {
  const p = new URLSearchParams(search);
  const on = (p.get("on") ?? "")
    .split(",")
    .filter(isId)
    .filter((id, i, arr) => arr.indexOf(id) === i);
  const overrides: Shareable["overrides"] = {};
  for (const part of (p.get("over") ?? "").split(",")) {
    if (!part) continue;
    const [t, bys = ""] = part.split(":");
    if (!isId(t)) continue;
    const list = bys.split("+").filter(isId);
    overrides[t] = list;
  }
  const strict = p.get("strict") === "1";
  return strict ? { on, overrides, strict } : { on, overrides };
}
