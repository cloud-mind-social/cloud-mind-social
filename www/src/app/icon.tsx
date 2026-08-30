import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#121309",
          borderRadius: 7,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="3.4" fill="#dd9440" />
          <circle cx="3" cy="3" r="1.6" fill="#93a67c" />
          <circle cx="17" cy="3" r="1.6" fill="#93a67c" />
          <circle cx="3" cy="17" r="1.6" fill="#93a67c" />
          <circle cx="17" cy="17" r="1.6" fill="#93a67c" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
