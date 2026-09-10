"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "framer-motion";
import type { Effect, Id, ReasonId, Toggle as ToggleData, VisualState } from "@/lib/types";
import { REASONS } from "@/lib/research";
import { TOGGLE_BY_ID } from "@/lib/toggles";
import { Padlock } from "./Padlock";
import { WhyChip, type ChipTone } from "./WhyChip";
import { cn } from "./hooks";

export type OpenCard = { target: Id; reason: ReasonId; by: Id } | null;

export const chipLayoutId = (target: Id, reason: ReasonId) => `why-${target}-${reason}`;

type Props = {
  toggle: ToggleData;
  vs: VisualState;
  effects: Effect[]; // this toggle's effects, highest precedence first
  variant: string | null;
  refusedNonce: number;
  strict: boolean;
  index: number;
  open: OpenCard;
  inlineCard: ReactNode; // rendered under the chips when the card lives in the wall (narrow screens)
  onToggle: () => void;
  onOverride: () => void;
  onOpen: (target: Id, reason: ReasonId, by: Id) => void;
  trackRef: (el: HTMLElement | null) => void;
};

const ON_COLOR: Record<ToggleData["kind"], string> = {
  outcome: "var(--color-hot)",
  style: "var(--color-warm)",
  focus: "var(--color-warm)",
};

export function Toggle({
  toggle,
  vs,
  effects,
  variant,
  refusedNonce,
  strict,
  index,
  open,
  inlineCard,
  onToggle,
  onOverride,
  onOpen,
  trackRef,
}: Props) {
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate();
  const prevBoosts = useRef(0);
  const checked = vs === "on" || vs === "soft" || vs === "warn";

  // Previous state, derived during render: an override flips with a heavier, reluctant spring.
  const [last, setLast] = useState<{ vs: VisualState; fromLocked: boolean }>({ vs, fromLocked: false });
  if (last.vs !== vs) setLast({ vs, fromLocked: last.vs === "locked" && checked });
  const prevVs = useRef<VisualState>(vs);
  const on = ON_COLOR[toggle.kind];
  const trackColor =
    vs === "off" || vs === "locked"
      ? "var(--color-blush)"
      : vs === "soft"
        ? `color-mix(in srgb, ${on} 55%, var(--color-paper))`
        : on;

  // Motion is meaning: animate only on a state change, and say how it changed.
  useEffect(() => {
    const prev = prevVs.current;
    prevVs.current = vs;
    if (prev === vs || reduce || !scope.current) return;
    if (vs === "locked") animate(scope.current, { x: [0, -6, 4, -2, 0] }, { duration: 0.3 });
    else if (vs === "warn") animate(scope.current, { rotate: [0, -1.5, 1.5, 0] }, { duration: 0.3 });
    else if (vs === "soft") animate(scope.current, { scale: [1, 0.96, 1] }, { duration: 0.3 });
  }, [vs, reduce, animate, scope]);

  const boosts = effects.filter((e) => e.type === "boost").length;
  useEffect(() => {
    const grew = boosts > prevBoosts.current;
    prevBoosts.current = boosts;
    if (grew && !reduce && scope.current) animate(scope.current, { scale: [1, 1.02, 1] }, { duration: 0.25 });
  }, [boosts, reduce, animate, scope]);

  const firstRefusal = useRef(true);
  useEffect(() => {
    if (firstRefusal.current) {
      firstRefusal.current = false;
      return;
    }
    if (!refusedNonce || reduce || !scope.current) return;
    animate(scope.current, { x: [0, -6, 4, -2, 0] }, { duration: 0.3 });
  }, [refusedNonce, reduce, animate, scope]);

  // One chip per reason. Active locks show their chip; overridden locks show a shorter one.
  const chips: { reason: ReasonId; by: Id; tone: ChipTone; text: string }[] = [];
  const seen = new Set<ReasonId>();
  for (const e of effects) {
    if (seen.has(e.reason)) continue;
    if (e.type === "lock" && e.overridden) {
      if (!seen.has(e.reason)) {
        seen.add(e.reason);
        chips.push({ reason: e.reason, by: e.by, tone: "note", text: "You overruled me. Fair enough." });
      }
      continue;
    }
    if (e.type === "lock" && vs !== "locked") continue;
    seen.add(e.reason);
    const r = REASONS[e.reason];
    const byT = TOGGLE_BY_ID[e.by];
    const names = {
      target: toggle.label,
      by: byT.label,
      targetPhrase: toggle.phrase,
      byPhrase: byT.phrase,
      variant: e.type === "soften" ? e.variant : undefined,
    };
    const tone: ChipTone = r.tier === "house" ? "house" : r.tier === "note" ? "note" : e.type === "warn" ? "warn" : "blush";
    const suffix = e.type === "lock" ? (strict ? " Strict mode." : " Tap the lock to overrule me.") : "";
    chips.push({ reason: e.reason, by: e.by, tone, text: r.chip(names) + suffix });
  }

  const label = (
    <span
      className={cn(
        "text-[20px] leading-6 min-[900px]:text-[22px] min-[900px]:leading-[26px] transition-[font-weight,opacity] duration-150",
        checked && vs !== "soft" ? "font-semibold" : "font-normal",
        vs === "locked" && "opacity-50 line-through decoration-2",
      )}
    >
      {toggle.label}
    </span>
  );

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="flex items-start gap-6"
    >
      <motion.div ref={scope} className="shrink-0">
        <button
          ref={trackRef}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={
            vs === "locked"
              ? `${toggle.label}, turned off by another toggle.${strict ? "" : " Activate to overrule."}`
              : `${toggle.label}${variant ? `, ${variant}` : ""}`
          }
          onClick={vs === "locked" ? onOverride : onToggle}
          className={cn(
            "group relative flex h-(--track-h) w-(--track-w) cursor-pointer items-center overflow-hidden rounded-full border-[3px] border-ink p-[3px]",
            "hover:shadow-[inset_0_0_0_1px_var(--color-ink)]",
            checked ? "justify-end" : "justify-start",
          )}
          style={{ transition: "background-color 150ms", backgroundColor: trackColor }}
        >
          <motion.span
            aria-hidden
            className="hatch pointer-events-none absolute inset-0"
            initial={false}
            animate={{ opacity: vs === "soft" ? 1 : 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: last.fromLocked ? 18 : 30 }}
            animate={{ scale: vs === "soft" ? 0.92 : 1 }}
            className="relative grid size-(--knob) place-items-center rounded-full bg-ink text-paper"
          >
            <AnimatePresence>
              {vs === "locked" && (
                <motion.span
                  key="lock"
                  initial={{ scale: 0, rotate: 0, opacity: 1 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ rotate: 20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid place-items-center"
                >
                  <Padlock />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.span>
        </button>
      </motion.div>

      <div className="min-w-0 flex-1 pt-[calc((var(--track-h)-26px)/2)]">
        <div className="flex flex-wrap items-baseline gap-x-3">
          {label}
          <AnimatePresence>
            {variant && (
              <motion.span
                key={variant}
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-[14px] leading-[18px] text-graphite"
              >
                ◦ {variant}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-2 flex flex-col items-start gap-2 empty:hidden">
          {chips.map((c) => {
            const isOpen = open?.target === toggle.id && open.reason === c.reason;
            if (isOpen && inlineCard) return <div key={c.reason} className="w-full">{inlineCard}</div>;
            if (isOpen) return null; // the card is showing elsewhere with this layoutId
            return (
              <WhyChip
                key={c.reason}
                layoutId={chipLayoutId(toggle.id, c.reason)}
                tone={c.tone}
                text={c.text}
                onClick={() => onOpen(toggle.id, c.reason, c.by)}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
