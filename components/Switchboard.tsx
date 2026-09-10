"use client";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { TOGGLES, TOGGLE_BY_ID } from "@/lib/toggles";
import { effectiveOn, resolve } from "@/lib/rules";
import { REASONS, type Evidence } from "@/lib/research";
import { initialState, reducer, type Action } from "@/lib/state";
import { decodeState, encodeState } from "@/lib/url-state";
import type { Id, ReasonId } from "@/lib/types";
import { ToggleWall } from "./ToggleWall";
import { ResearchCard } from "./ResearchCard";
import { Circumplex } from "./Circumplex";
import { HouseRuleToast } from "./HouseRuleToast";
import { DebugPanel } from "./DebugPanel";
import { chipLayoutId, type OpenCard } from "./Toggle";
import Link from "next/link";
import { cn, useMediaQuery } from "./hooks";

const buttonBase =
  "inline-flex h-10 cursor-pointer items-center rounded-full border-[3px] border-ink px-4 text-[14px] font-semibold hover:shadow-[inset_0_0_0_1px_var(--color-ink)]";
const button = cn(buttonBase, "bg-paper");

export function Switchboard() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [openCard, setOpen] = useState<OpenCard>(null);
  const debug = state.debug;
  const [sheet, setSheet] = useState(false);
  const [copied, setCopied] = useState(false);
  const reduce = useReducedMotion();
  // The card must exist in exactly one place: two mounted elements with one layoutId crossfade into nothing.
  const wide = useMediaQuery("(min-width: 900px)", true);

  const effects = useMemo(() => resolve(state, TOGGLES), [state]);
  const inForce = useMemo(() => effectiveOn(state, effects), [state, effects]);

  // Hydrate from the URL once, then mirror state back into it. No backend.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const { on, overrides, strict } = decodeState(window.location.search);
    dispatch({ type: "hydrate", on, overrides, strict, debug: p.get("debug") === "1" });
  }, []);
  useEffect(() => {
    if (!state.hydrated) return;
    const q = encodeState(state);
    const url = `${window.location.pathname}${q}${debug ? (q ? "&" : "?") + "debug=1" : ""}`;
    window.history.replaceState(null, "", url);
  }, [state, debug]);

  // A card is only shown while the effect it explains still exists; actions that remove it close it.
  const open =
    openCard && effects.some((e) => e.target === openCard.target && e.reason === openCard.reason) ? openCard : null;
  const send = (a: Action) => {
    dispatch(a);
    if (openCard) {
      const fx = resolve(reducer(state, a), TOGGLES);
      if (!fx.some((e) => e.target === openCard.target && e.reason === openCard.reason)) setOpen(null);
    }
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setSheet(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const onOpen = useCallback((target: Id, reason: ReasonId, by: Id) => {
    setOpen((cur) => (cur && cur.target === target && cur.reason === reason ? null : { target, reason, by }));
  }, []);
  const dismiss = useCallback(() => dispatch({ type: "dismissRefusal" }), []);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable: the URL bar already holds the state */
    }
  };

  const card = open
    ? (() => {
        const reason = REASONS[open.reason];
        const byToggle = TOGGLE_BY_ID[open.by];
        const softened = effects.find((e) => e.target === open.target && e.reason === open.reason);
        const targetToggle = TOGGLE_BY_ID[open.target];
        const names = {
          target: targetToggle.label,
          by: byToggle.label,
          targetPhrase: targetToggle.phrase,
          byPhrase: byToggle.phrase,
          variant: softened?.type === "soften" ? softened.variant : undefined,
        };
        const evidence: Evidence | undefined = byToggle.caveat && reason.tier === "research" ? "thin" : reason.evidence;
        const caveat = reason.caveat ?? (open.by !== open.target ? byToggle.caveat : undefined);
        return (
          <ResearchCard
            layoutId={chipLayoutId(open.target, open.reason)}
            reason={reason}
            names={names}
            evidence={evidence}
            caveat={caveat}
            onClose={() => setOpen(null)}
          />
        );
      })()
    : null;

  const reactions = effects.filter((e) => e.type !== "note" && e.type !== "boost" && !(e.type === "lock" && e.overridden)).length;
  const reading =
    inForce.length === 0
      ? "Flip something."
      : `${inForce.length} on. ${reactions === 0 ? "Nobody's arguing." : reactions === 1 ? "One reaction." : `${reactions} reactions.`}`;

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-8 md:py-12">
          <header className="mb-10 flex flex-wrap items-start justify-between gap-x-6 gap-y-4 md:mb-14">
            <div className="max-w-[560px]">
              <p className="mb-3 flex items-baseline gap-4 text-[14px] leading-[18px]">
                <span className="font-semibold">Switchboard</span>
                <Link href="/about" className="text-graphite underline underline-offset-2 hover:text-ink">
                  About
                </Link>
              </p>
              <h1 className="text-[32px] leading-9 font-semibold">What do you want for yourself?</h1>
              <p className="mt-2 text-[16px] leading-6 text-graphite">
                Flip on everything. Some of it can&apos;t be true at the same time, and the board shows you why.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={cn(button, "min-[900px]:hidden")} onClick={() => setSheet(true)}>
                Circle
              </button>
              <button
                type="button"
                aria-pressed={state.strict}
                title="While strict mode is on, the board's locks can't be overruled."
                className={cn(buttonBase, state.strict ? "bg-ink text-paper" : "bg-paper")}
                onClick={() => send({ type: "strict", on: !state.strict })}
              >
                Strict
              </button>
              {state.on.length > 0 && (
                <button type="button" className={button} onClick={() => send({ type: "clear" })}>
                  Clear
                </button>
              )}
              <button type="button" className={button} onClick={share} aria-live="polite">
                {copied ? "Copied" : "Share"}
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-x-16 gap-y-12 min-[900px]:grid-cols-[minmax(0,1fr)_380px]">
            <section aria-label="Toggles">
              <ToggleWall
                toggles={TOGGLES}
                state={state}
                effects={effects}
                open={open}
                inlineCard={wide ? null : card}
                onToggle={(id) => send({ type: "toggle", id })}
                onOverride={(id) => send({ type: "override", id })}
                onOpen={onOpen}
              />
            </section>

            <aside className="hidden min-[900px]:block">
              <div className="sticky top-8 flex flex-col gap-6">
                <p className="text-[16px] leading-6 text-graphite" aria-live="polite">
                  {reading}
                </p>
                <Circumplex toggles={TOGGLES} state={state} effects={effects} />
                <div className="min-h-[120px]">
                  <AnimatePresence mode="popLayout">
                    {wide && card && <div key={`${open!.target}-${open!.reason}`}>{card}</div>}
                  </AnimatePresence>
                </div>
              </div>
            </aside>
          </div>

          <footer className="mt-16 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 text-[13px] leading-[18px] text-graphite md:mt-24">
            <p className="max-w-[560px]">
              The subject is you. Every fight on this board traces back to a paper about people, except the ones marked as
              house rules. The angles are a starting point, not a diagnosis.{" "}
              <Link href="/about" className="text-ink underline underline-offset-2">
                Read about the research.
              </Link>
            </p>
            <p className="ml-auto shrink-0 text-right">
              Created by{" "}
              <a href="https://x.com/seeratawan01" target="_blank" rel="noreferrer" className="text-ink underline underline-offset-2">
                @seeratawan01
              </a>
            </p>
          </footer>
        </div>

        {/* Narrow screens: the circle lives in a pull-up sheet. */}
        <AnimatePresence>
          {sheet && (
            <>
              <motion.button
                key="backdrop"
                type="button"
                aria-label="Close the circle"
                className="fixed inset-0 z-40 bg-ink/20 min-[900px]:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSheet(false)}
              />
              <motion.div
                key="sheet"
                role="dialog"
                aria-label="Interpersonal circle"
                className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[8px] border-t-[3px] border-ink bg-paper px-4 pt-3 pb-6 min-[900px]:hidden"
                initial={reduce ? { opacity: 0 } : { y: "100%" }}
                animate={reduce ? { opacity: 1 } : { y: 0 }}
                exit={reduce ? { opacity: 0 } : { y: "100%" }}
                transition={{ type: "spring", stiffness: 400, damping: 36 }}
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <p className="text-[16px] leading-6 text-graphite">{reading}</p>
                  <button type="button" className="cursor-pointer text-[14px] font-semibold underline underline-offset-2" onClick={() => setSheet(false)}>
                    Close
                  </button>
                </div>
                <Circumplex toggles={TOGGLES} state={state} effects={effects} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <HouseRuleToast refusal={state.refusal} onDone={dismiss} />
        {debug && <DebugPanel toggles={TOGGLES} state={state} onTheta={(id, theta) => dispatch({ type: "theta", id, theta })} />}
      </LayoutGroup>
    </MotionConfig>
  );
}
