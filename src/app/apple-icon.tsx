import { ImageResponse } from "next/og";

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
          background: "linear-gradient(135deg, #ffffff 0%, #f7f8fa 100%)",
          borderRadius: 36,
          border: "4px solid #c5a059",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 700, color: "#c5a059", lineHeight: 1 }}>T</div>
      </div>
    ),
    { ...size }
  );
}
