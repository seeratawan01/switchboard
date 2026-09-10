"use client";
import { motion, useReducedMotion } from "framer-motion";
import { EVIDENCE_LABEL, SOURCES, type Evidence, type Reason, type Names } from "@/lib/research";
import { cn } from "./hooks";

export type CardProps = {
  layoutId: string;
  reason: Reason;
  names: Names;
  evidence?: Evidence;
  caveat?: string;
  onClose: () => void;
};

export function ResearchCard({ layoutId, reason, names, evidence, caveat, onClose }: CardProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={layoutId}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      role="dialog"
      aria-label={reason.title(names)}
      className="w-full max-w-[420px] rounded-[8px] bg-blush p-4 ring-1 ring-inset ring-ink"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-[16px] leading-6 font-semibold">{reason.title(names)}</h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 cursor-pointer text-[14px] leading-6 font-semibold underline underline-offset-2"
          >
            Close
          </button>
        </div>
        <p className="text-[16px] leading-6">{reason.why(names)}</p>
        {caveat && (
          <p className="text-[16px] leading-6">
            <span className="font-semibold">Caveat.</span> {caveat}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {reason.tier === "research" && evidence && (
            <span
              className={cn(
                "rounded-[4px] px-2 py-0.5 text-[14px] leading-[18px] font-semibold ring-1 ring-inset ring-ink",
                evidence === "strong" ? "bg-blush" : "bg-amber",
              )}
            >
              {EVIDENCE_LABEL[evidence]}
            </span>
          )}
          {reason.tier === "house" && (
            <span className="rounded-[4px] bg-paper px-2 py-0.5 text-[14px] leading-[18px] font-semibold ring-1 ring-inset ring-ink">
              House rule. No paper, just taste.
            </span>
          )}
        </div>
        {reason.sources?.length ? (
          <ul className="flex flex-col gap-2">
            {reason.sources.map((sid) => {
              const s = SOURCES[sid];
              return (
                <li key={sid} className="text-[13px] leading-[18px] text-graphite">
                  <span>{s.cite}. </span>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink underline underline-offset-2 hover:decoration-2"
                  >
                    {s.title}
                  </a>
                  <span>. {s.venue}.</span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </motion.div>
  );
}
