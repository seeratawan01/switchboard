"use client";
import type { Id, Toggle as ToggleData } from "@/lib/types";
import type { State } from "@/lib/state";
import { band, compat } from "@/lib/rules";

/** `?debug=1`: sliders for the angles. Data, not code, so tune by feel. */
export function DebugPanel({
  toggles,
  state,
  onTheta,
}: {
  toggles: ToggleData[];
  state: State;
  onTheta: (id: Id, theta: number | null) => void;
}) {
  const angled = toggles.filter((t) => t.theta !== undefined);
  const theta = (t: ToggleData) => state.thetas?.[t.id] ?? t.theta ?? 0;
  const on = angled.filter((t) => state.on.includes(t.id));
  return (
    <aside className="fixed right-4 bottom-4 z-30 w-[300px] max-w-[calc(100vw-2rem)] rounded-[8px] border-[3px] border-ink bg-paper p-3 text-[13px] leading-[18px]">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-semibold">Angles</span>
        <button
          type="button"
          className="cursor-pointer underline underline-offset-2"
          onClick={() => angled.forEach((t) => onTheta(t.id, null))}
        >
          Reset
        </button>
      </div>
      <ul className="flex flex-col gap-1.5">
        {angled.map((t) => (
          <li key={t.id} className="grid grid-cols-[72px_1fr_36px] items-center gap-2">
            <label htmlFor={`theta-${t.id}`} className="truncate">
              {t.short ?? t.label}
            </label>
            <input
              id={`theta-${t.id}`}
              type="range"
              min={0}
              max={359}
              value={theta(t)}
              onChange={(e) => onTheta(t.id, Number(e.target.value))}
              className="accent-ink"
            />
            <span className="text-right tabular-nums text-graphite">{theta(t)}°</span>
          </li>
        ))}
      </ul>
      {on.length > 1 && (
        <ul className="mt-3 flex flex-col gap-0.5 border-t border-ink/20 pt-2 text-graphite">
          {on.flatMap((a, i) =>
            on.slice(i + 1).map((b) => {
              const c = compat(theta(a), theta(b));
              return (
                <li key={`${a.id}-${b.id}`} className="flex justify-between gap-2 tabular-nums">
                  <span>
                    {a.short} · {b.short}
                  </span>
                  <span>
                    {c.toFixed(2)} {band(c)}
                  </span>
                </li>
              );
            }),
          )}
        </ul>
      )}
    </aside>
  );
}
