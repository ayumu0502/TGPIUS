import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #ffffff 0%, #f7f8fa 55%, rgba(197,160,89,0.12) 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              border: "4px solid #c5a059",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              fontWeight: 700,
              color: "#c5a059",
              background: "#ffffff",
            }}
          >
            T
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, color: "#111827" }}>{SITE_NAME}</div>
        </div>
        <div style={{ fontSize: 40, fontWeight: 500, color: "#4b5563", lineHeight: 1.5 }}>
          {SITE_TAGLINE}
        </div>
        <div style={{ marginTop: 48, fontSize: 28, color: "#9ca3af" }}>
          ギフト · イベント · ランキング · ファンクラブ
        </div>
      </div>
    ),
    { ...size }
  );
}
