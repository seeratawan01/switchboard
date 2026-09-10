import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "Switchboard. What do you want for yourself?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#000000";
const PAPER = "#ffffff";
const HOT = "#f0603a";
const WARM = "#ee7a55";
const BLUSH = "#f9e4db";
const GRAPHITE = "#6b6b6b";

function Pill({ on, color, hatch = false }: { on: boolean; color: string; hatch?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: on ? "flex-end" : "flex-start",
        width: 150,
        height: 72,
        borderRadius: 999,
        border: `5px solid ${INK}`,
        background: hatch
          ? `repeating-linear-gradient(45deg, ${INK} 0 3px, ${color} 3px 11px)`
          : on
            ? color
            : BLUSH,
        padding: 5,
      }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 999, background: INK }} />
    </div>
  );
}

export default function Image() {
  const rows: { label: string; on: boolean; color: string; hatch?: boolean; note?: string }[] = [
    { label: "Heal from my childhood", on: true, color: HOT },
    { label: "Be funnier", on: true, color: WARM, hatch: true, note: "gentle" },
    { label: "Say exactly what I think", on: true, color: WARM, hatch: true, note: "kind" },
    { label: "Be sarcastic", on: false, color: WARM, note: "locked" },
  ];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: PAPER,
          color: INK,
          padding: 64,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 470 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, fontWeight: 600 }}>Switchboard</div>
            <div style={{ fontSize: 58, fontWeight: 600, lineHeight: 1.05, marginTop: 20, letterSpacing: -1.5 }}>
              What do you want for yourself?
            </div>
            <div style={{ fontSize: 23, color: GRAPHITE, marginTop: 22, lineHeight: 1.3 }}>
              Flip on everything. Some of it can&apos;t be true at the same time, and the board shows you why.
            </div>
          </div>
          <div style={{ fontSize: 20, color: GRAPHITE }}>Every fight has a paper behind it.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 30, marginLeft: 56 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <Pill on={r.on} color={r.color} hatch={r.hatch} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: r.on && !r.hatch ? 600 : 400,
                    color: r.note === "locked" ? GRAPHITE : INK,
                    textDecoration: r.note === "locked" ? "line-through" : "none",
                  }}
                >
                  {r.label}
                </div>
                {r.note && r.note !== "locked" && (
                  <div style={{ fontSize: 18, color: GRAPHITE }}>{`turned down to ${r.note}`}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
