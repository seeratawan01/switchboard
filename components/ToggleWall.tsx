"use client";
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Effect, Id, ReasonId, Toggle as ToggleData } from "@/lib/types";
import type { State } from "@/lib/state";
import { effectsFor, potentialPairs, variantOf, visualState } from "@/lib/rules";
import { Toggle, type OpenCard } from "./Toggle";
import { Wires, type Anchor } from "./Wires";
import { useMediaQuery } from "./hooks";

type Props = {
  toggles: ToggleData[];
  state: State;
  effects: Effect[];
  open: OpenCard;
  inlineCard: ReactNode;
  onToggle: (id: Id) => void;
  onOverride: (id: Id) => void;
  onOpen: (target: Id, reason: ReasonId, by: Id) => void;
};

export function ToggleWall({ toggles, state, effects, open, inlineCard, onToggle, onOverride, onOpen }: Props) {
  const wide = useMediaQuery("(min-width: 900px)", true);
  const gutter = wide ? 96 : 60;
  const laneGap = wide ? 6 : 4;

  const wallRef = useRef<HTMLDivElement>(null);
  const tracks = useRef(new Map<Id, HTMLElement>());
  const [anchors, setAnchors] = useState<Partial<Record<Id, Anchor>>>({});

  const measure = useCallback(() => {
    const wall = wallRef.current;
    if (!wall) return;
    const w = wall.getBoundingClientRect();
    const next: Partial<Record<Id, Anchor>> = {};
    tracks.current.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      next[id] = { x: r.left - w.left, y: r.top - w.top + r.height / 2 };
    });
    setAnchors((prev) => {
      const same = toggles.every((t) => {
        const a = prev[t.id];
        const b = next[t.id];
        return a && b && a.x === b.x && a.y === b.y;
      });
      return same ? prev : next;
    });
  }, [toggles]);

  // Re-measure whenever anything in the wall changes size (chips and cards push toggles down).
  useLayoutEffect(() => {
    measure();
    const wall = wallRef.current;
    if (!wall) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(wall);
    wall.querySelectorAll("[data-row]").forEach((el) => ro.observe(el));
    const mo = new MutationObserver(() => {
      ro.disconnect();
      ro.observe(wall);
      wall.querySelectorAll("[data-row]").forEach((el) => ro.observe(el));
      measure();
    });
    mo.observe(wall, { childList: true, subtree: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [measure]);

  const order = useMemo(() => toggles.map((t) => t.id), [toggles]);
  const pairs = useMemo(() => potentialPairs(toggles, state.thetas, true), [toggles, state.thetas]);

  return (
    <div ref={wallRef} className="relative" style={{ paddingLeft: gutter }}>
      <Wires anchors={anchors} pairs={pairs} effects={effects} order={order} gutter={gutter} laneGap={laneGap} />
      <ul className="relative flex flex-col gap-10">
        {toggles.map((t, i) => (
          <li key={t.id} data-row>
            <Toggle
              toggle={t}
              index={i}
              vs={visualState(state, effects, t.id)}
              effects={effectsFor(effects, t.id)}
              variant={variantOf(effects, t.id)}
              refusedNonce={state.refusal?.id === t.id ? state.refusal.nonce : 0}
              strict={state.strict}
              open={open}
              inlineCard={wide ? null : inlineCard}
              onToggle={() => onToggle(t.id)}
              onOverride={() => onOverride(t.id)}
              onOpen={onOpen}
              trackRef={(el) => {
                if (el) tracks.current.set(t.id, el);
                else tracks.current.delete(t.id);
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
