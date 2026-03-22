import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          borderRadius: 40,
        }}
      >
        <span
          style={{
            fontSize: 60,
            fontWeight: 900,
            color: "white",
            fontFamily: "Arial, sans-serif",
            lineHeight: 1,
          }}
        >
          Skol
        </span>
        <span
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "rgba(255,255,255,0.85)",
            fontFamily: "Arial, sans-serif",
            lineHeight: 1,
            marginTop: 4,
          }}
        >
          Ranking
        </span>
      </div>
    ),
    { ...size }
  );
}
