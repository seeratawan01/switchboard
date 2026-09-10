"use client";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Effect, Id, Toggle as ToggleData } from "@/lib/types";
import type { State } from "@/lib/state";
import { activeLocks } from "@/lib/rules";

const CX = 160;
const CY = 150;
const R = 104;

const pos = (theta: number, r = R) => {
  const t = (theta * Math.PI) / 180;
  return { x: CX + r * Math.cos(t), y: CY - r * Math.sin(t) };
};

const key = (a: Id, b: Id) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** The circle shows the fight: dots on the interpersonal circumplex, tension lines between opposed toggles that are both on. */
export function Circumplex({ toggles, state, effects }: { toggles: ToggleData[]; state: State; effects: Effect[] }) {
  const reduce = useReducedMotion();
  const on = new Set(state.on);
  const theta = (t: ToggleData) => state.thetas?.[t.id] ?? t.theta ?? 0;
  const locked = (id: Id) => activeLocks(effects, id).length > 0;

  const circleToggles = toggles.filter((t) => t.theta !== undefined);
  const byId = Object.fromEntries(toggles.map((t) => [t.id, t])) as Record<Id, ToggleData>;

  const tension = useMemo(() => {
    const m = new Map<string, Effect>();
    for (const e of effects) {
      if (e.type !== "warn" && e.type !== "soften" && e.type !== "lock") continue;
      if (e.by === e.target || !on.has(e.by) || !on.has(e.target)) continue;
      if (e.type === "lock" && e.overridden) continue;
      const k = key(e.by, e.target);
      const cur = m.get(k);
      if (!cur || e.type === "lock" || (e.type === "soften" && cur.type === "warn")) m.set(k, e);
    }
    return [...m.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effects, state.on]);

  const hum = reduce ? { opacity: 1 } : { opacity: [0.6, 1, 0.6] };
  const humTransition = {
    pathLength: { duration: 0.25, ease: "linear" as const },
    opacity: { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const },
  };

  const eli5 = byId.eli5;
  const expert = byId.expert;
  const depthTension = on.has("eli5") && on.has("expert");
  const AX0 = 70;
  const AX1 = 250;
  const AY = 306;

  const dotFill = (t: ToggleData) =>
    !on.has(t.id) || locked(t.id)
      ? "var(--color-paper)"
      : t.kind === "outcome"
        ? "var(--color-hot)"
        : "var(--color-warm)";

  return (
    <svg viewBox="0 0 320 330" className="mx-auto block w-full max-w-[360px]" role="img" aria-label="Interpersonal circle showing which toggles are in tension">
      {/* axes */}
      <g stroke="var(--color-ink)" strokeOpacity={0.2} strokeWidth={1}>
        <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} />
        <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} />
      </g>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--color-ink)" strokeWidth={1} />
      {/* axis labels sit inside the ring so the dot labels own the outside */}
      <g fill="var(--color-graphite)" fontSize={10} fontWeight={400}>
        <text x={CX + R - 6} y={CY - 6} textAnchor="end">warm</text>
        <text x={CX + 6} y={CY - R + 14}>dominant</text>
        <text x={CX - R + 6} y={CY - 6}>cold</text>
        <text x={CX + 6} y={CY + R - 8}>submissive</text>
      </g>

      {/* tension lines */}
      {tension.map((e) => {
        const a = pos(theta(byId[e.by]));
        const b = pos(theta(byId[e.target]));
        return (
          <motion.line
            key={key(e.by, e.target)}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="var(--color-ink)"
            strokeWidth={e.type === "lock" ? 3 : 2}
            strokeDasharray={e.type === "warn" ? "5 4" : undefined}
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0, opacity: 0.6 }}
            animate={{ pathLength: 1, ...hum }}
            transition={humTransition}
          />
        );
      })}

      {/* dots */}
      {circleToggles.map((t) => {
        const p = pos(theta(t));
        const lp = pos(theta(t), R + 16);
        const cos = Math.cos((theta(t) * Math.PI) / 180);
        const anchor = Math.abs(cos) < 0.35 ? "middle" : cos > 0 ? "start" : "end";
        const isOn = on.has(t.id) && !locked(t.id);
        return (
          <g key={t.id}>
            <motion.circle
              initial={false}
              animate={{ cx: p.x, cy: p.y, r: t.kind === "outcome" ? 7 : 6 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              fill={dotFill(t)}
              stroke="var(--color-ink)"
              strokeWidth={2}
              strokeDasharray={locked(t.id) ? "2 2" : undefined}
            />
            <motion.text
              initial={false}
              animate={{ attrX: lp.x, attrY: lp.y + 4 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              textAnchor={anchor}
              fontSize={11}
              fontWeight={isOn ? 600 : 400}
              fill={isOn ? "var(--color-ink)" : "var(--color-graphite)"}
            >
              {t.short ?? t.label}
            </motion.text>
          </g>
        );
      })}

      {/* the knowledge axis: one dimension, not a circle */}
      <g>
        <line x1={AX0} y1={AY} x2={AX1} y2={AY} stroke="var(--color-ink)" strokeWidth={1} />
        {depthTension && (
          <motion.line
            x1={AX0}
            y1={AY}
            x2={AX1}
            y2={AY}
            stroke="var(--color-ink)"
            strokeWidth={3}
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1, ...hum }}
            transition={humTransition}
          />
        )}
        {[
          { t: eli5, x: AX0, anchor: "end" as const, lx: AX0 - 12 },
          { t: expert, x: AX1, anchor: "start" as const, lx: AX1 + 12 },
        ].map(({ t, x, anchor, lx }) => {
          const isOn = on.has(t.id) && !locked(t.id);
          return (
            <g key={t.id}>
              <circle
                cx={x}
                cy={AY}
                r={6}
                fill={dotFill(t)}
                stroke="var(--color-ink)"
                strokeWidth={2}
                strokeDasharray={locked(t.id) ? "2 2" : undefined}
              />
              <text
                x={lx}
                y={AY + 4}
                textAnchor={anchor}
                fontSize={11}
                fontWeight={isOn ? 600 : 400}
                fill={isOn ? "var(--color-ink)" : "var(--color-graphite)"}
              >
                {t.id === "eli5" ? "novice" : "expert"}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
