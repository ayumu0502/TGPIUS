import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
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
          background: "linear-gradient(135deg, #ffffff 0%, #f7f8fa 100%)",
          borderRadius: 96,
          border: "8px solid #c5a059",
        }}
      >
        <div
          style={{
            fontSize: 280,
            fontWeight: 700,
            color: "#c5a059",
            lineHeight: 1,
            marginTop: -16,
          }}
        >
          T
        </div>
      </div>
    ),
    { ...size }
  );
}
