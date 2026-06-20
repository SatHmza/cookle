import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        background: "#FDF8F3",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Fork and knife crossed */}
      <div style={{ display: "flex", gap: 0, alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ fontSize: 160, lineHeight: 1, transform: "rotate(-30deg)", transformOrigin: "bottom center", display: "flex" }}>🍴</div>
        <div style={{ fontSize: 160, lineHeight: 1, transform: "scaleX(-1) rotate(-30deg)", transformOrigin: "bottom center", display: "flex", marginLeft: -16 }}>🍴</div>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 80,
          fontWeight: 800,
          color: "#f97316",
          marginTop: 28,
          letterSpacing: "-3px",
        }}
      >
        Cookle
      </div>

      {/* Tagline */}
      <div style={{ fontSize: 30, color: "#a8a29e", marginTop: 14, letterSpacing: "0.5px" }}>
        Open the fridge. Get a decision.
      </div>
    </div>,
    { ...size }
  );
}
