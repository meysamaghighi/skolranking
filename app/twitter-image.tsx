import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Skolranking - Sveriges grundskolor rankade";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Swedish flag accent - top left corner */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            width: 120,
            height: 80,
            display: "flex",
            background: "#006AA7",
            border: "3px solid #FECC00",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 35,
              top: 0,
              width: 20,
              height: 80,
              background: "#FECC00",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 30,
              width: 120,
              height: 20,
              background: "#FECC00",
            }}
          />
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 60px",
          }}
        >
          {/* Site name */}
          <div
            style={{
              fontSize: 120,
              fontWeight: 900,
              color: "white",
              letterSpacing: "-0.02em",
              marginBottom: 20,
            }}
          >
            Skolranking
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 42,
              fontWeight: 400,
              color: "rgba(255, 255, 255, 0.95)",
              marginBottom: 10,
            }}
          >
            Sveriges 1 545 grundskolor rankade
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 300,
              color: "rgba(255, 255, 255, 0.8)",
            }}
          >
            Baserat på meritvärde från Skolverket
          </div>
        </div>

        {/* URL at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 28,
            color: "rgba(255, 255, 255, 0.9)",
            fontWeight: 500,
          }}
        >
          skolranking.com
        </div>

        {/* Yellow accent bar - bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: 8,
            background: "#FECC00",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
