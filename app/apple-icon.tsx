import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            width: 140,
            height: 76,
            borderRadius: 999,
            border: "7px solid #000000",
            background: "#f0603a",
            padding: 6,
          }}
        >
          <div style={{ width: 50, height: 50, borderRadius: 999, background: "#000000" }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
