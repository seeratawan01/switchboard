"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Effect, Id } from "@/lib/types";
import type { PairKind } from "@/lib/rules";

export type Anchor = { x: number; y: number }; // left edge of the track, vertical centre, relative to the wall

type Pair = { a: Id; b: Id; kind: PairKind };

const key = (a: Id, b: Id) => (a < b ? `${a}|${b}` : `${b}|${a}`);

const DASH: Partial<Record<PairKind, string>> = { warn: "6 4", requires: "2 4" };

/**
 * Thin ink wires in the left gutter, one lane per pair, like a patch bay.
 * Idle at 20%. When a rule fires, a solid overlay draws from trigger to target,
 * then fades, leaving the wire lit for as long as the effect holds.
 */
export function Wires({
  anchors,
  pairs,
  effects,
  order,
  gutter,
  laneGap,
}: {
  anchors: Partial<Record<Id, Anchor>>;
  pairs: Pair[];
  effects: Effect[];
  order: Id[];
  gutter: number;
  laneGap: number;
}) {
  const reduce = useReducedMotion();

  // Shorter spans hug the toggles; long spans take the outer lanes.
  const lanes = useMemo(() => {
    const idx = (id: Id) => order.indexOf(id);
    const sorted = [...pairs].sort((p, q) => Math.abs(idx(p.a) - idx(p.b)) - Math.abs(idx(q.a) - idx(q.b)));
    const m = new Map<string, { lane: number; pair: Pair }>();
    sorted.forEach((p, i) => m.set(key(p.a, p.b), { lane: i, pair: p }));
    return m;
  }, [pairs, order]);

  // Active pairs: the first effect between two different toggles, keyed by pair.
  const active = useMemo(() => {
    const m = new Map<string, Effect & { by: Id; target: Id }>();
    for (const e of effects) {
      if (e.type === "note" || e.by === e.target) continue;
      if (e.type === "lock" && e.overridden) continue;
      const k = key(e.by, e.target);
      if (!m.has(k) || (e.type === "lock" && m.get(k)!.type !== "lock")) m.set(k, e);
    }
    return m;
  }, [effects]);

  // A nonce per pair that increments each time it goes inactive → active, so the draw replays.
  const activeKey = [...active.keys()].sort().join(",");
  // Seeded with the mount-time key so nothing draws on page load.
  const [nonceState, setNonceState] = useState<{ key: string; nonces: Record<string, number> }>(() => ({ key: activeKey, nonces: {} }));
  let nonces = nonceState.nonces;
  if (nonceState.key !== activeKey) {
    const before = new Set(nonceState.key.split(",").filter(Boolean));
    nonces = { ...nonceState.nonces };
    for (const k of active.keys()) if (!before.has(k)) nonces[k] = (nonces[k] ?? 0) + 1;
    setNonceState({ key: activeKey, nonces });
  }

  const path = (from: Anchor, to: Anchor, lane: number) => {
    const x0 = from.x - 6;
    const lx = gutter - 12 - lane * laneGap;
    const r = Math.min(6, Math.abs(to.y - from.y) / 2);
    const d = to.y > from.y ? 1 : -1;
    return `M ${x0} ${from.y} H ${lx + r} Q ${lx} ${from.y} ${lx} ${from.y + r * d} V ${to.y - r * d} Q ${lx} ${to.y} ${lx + r} ${to.y} H ${x0}`;
  };

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
      {[...lanes.entries()].map(([k, { lane, pair }]) => {
        const A = anchors[pair.a];
        const B = anchors[pair.b];
        if (!A || !B) return null;
        const fx = active.get(k);
        const kind: PairKind = fx ? (fx.type as PairKind) : pair.kind;
        // Boost wires only exist while they fire.
        if (!fx && pair.kind === "boost") return null;
        const from = fx ? anchors[fx.by]! : A;
        const to = fx ? anchors[fx.target]! : B;
        const d = path(from, to, lane);
        const endX = to.x - 6;
        return (
          <g key={k} stroke="var(--color-ink)" fill="none" strokeWidth={2} strokeLinecap="round">
            <motion.path
              d={d}
              strokeDasharray={DASH[kind]}
              initial={false}
              animate={{ opacity: fx ? 1 : 0.2 }}
              transition={{ duration: reduce ? 0 : 0.25 }}
            />
            <AnimatePresence>
              {fx && !reduce && nonces[k] !== undefined && (
                <motion.path
                  key={`draw-${nonces[k]}`}
                  d={d}
                  initial={{ pathLength: 0, opacity: 1 }}
                  animate={{ pathLength: 1, opacity: 0 }}
                  transition={{ pathLength: { duration: 0.25, ease: "linear" }, opacity: { delay: 0.25, duration: 0.2 } }}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {fx && kind === "lock" && (
                <motion.circle
                  key="lock-dot"
                  cx={endX}
                  cy={to.y}
                  r={4}
                  fill="var(--color-ink)"
                  initial={{ scale: reduce ? 1 : 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ delay: reduce ? 0 : 0.25, duration: 0.15 }}
                  style={{ transformOrigin: `${endX}px ${to.y}px` }}
                />
              )}
              {fx && kind === "soften" && (
                <motion.circle
                  key="soft-dot"
                  cx={endX}
                  cy={to.y}
                  r={4}
                  fill="var(--color-paper)"
                  initial={{ scale: reduce ? 1 : 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ delay: reduce ? 0 : 0.25, duration: 0.15 }}
                  style={{ transformOrigin: `${endX}px ${to.y}px` }}
                />
              )}
            </AnimatePresence>
          </g>
        );
      })}
    </svg>
  );
}
