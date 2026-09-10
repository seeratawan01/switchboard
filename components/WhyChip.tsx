"use client";
import { motion } from "framer-motion";
import { cn } from "./hooks";

export type ChipTone = "warn" | "blush" | "note" | "house";

const TONES: Record<ChipTone, string> = {
  warn: "bg-amber",
  blush: "bg-blush",
  note: "bg-paper ring-1 ring-inset ring-ink",
  house: "bg-blush",
};

export function WhyChip({
  layoutId,
  tone,
  text,
  onClick,
}: {
  layoutId: string;
  tone: ChipTone;
  text: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      key={layoutId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex max-w-full items-baseline gap-2 rounded-[4px] px-2 py-1 text-left text-[14px] leading-[18px] font-semibold text-ink",
        "cursor-pointer hover:ring-2 hover:ring-inset hover:ring-ink",
        TONES[tone],
      )}
    >
      {tone === "house" && <span className="font-normal text-graphite">House rule:</span>}
      <span>{text}</span>
      <span className="font-normal text-graphite underline decoration-dotted underline-offset-2">why</span>
    </motion.button>
  );
}
