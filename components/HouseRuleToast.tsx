"use client";
import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Refusal } from "@/lib/state";
import { REASONS } from "@/lib/research";
import { TOGGLE_BY_ID } from "@/lib/toggles";

export function HouseRuleToast({ refusal, onDone }: { refusal: Refusal | null; onDone: () => void }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!refusal) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [refusal, onDone]);

  const r = refusal ? REASONS[refusal.reason] : null;
  const t = refusal ? TOGGLE_BY_ID[refusal.id] : null;
  const names = { target: t?.label ?? "", by: t?.label ?? "", targetPhrase: t?.phrase ?? "", byPhrase: t?.phrase ?? "" };

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-6 z-40 flex justify-center">
      <AnimatePresence>
        {refusal && r && (
          <motion.div
            key="toast" // stable: a second refusal updates the text in place instead of cross-fading two toasts
            role="status"
            aria-live="polite"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-auto max-w-[420px] rounded-[4px] border-[3px] border-ink bg-paper px-3 py-2 text-[14px] leading-[18px] font-semibold"
          >
            {r.tier === "house" && <span className="font-normal text-graphite">House rule: </span>}
            {r.chip(names)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
