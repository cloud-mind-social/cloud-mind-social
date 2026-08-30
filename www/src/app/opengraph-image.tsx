import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          background: "#121309",
          color: "#f4efe0",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#93a67c",
          }}
        >
          Cloud Mind Social
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 76,
            lineHeight: 1.08,
            maxWidth: 920,
          }}
        >
          Diagnosis before prescription.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            width: 120,
            height: 3,
            background: "#dd9440",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
