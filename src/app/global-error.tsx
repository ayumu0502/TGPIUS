"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f8fa",
          fontFamily: "sans-serif",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            background: "#ffffff",
            border: "1px solid #e8eaed",
            borderRadius: 16,
            padding: 40,
            textAlign: "center",
          }}
        >
          <p style={{ color: "#9e7d3c", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em" }}>
            500
          </p>
          <h1 style={{ color: "#111827", fontSize: 24, marginTop: 12, marginBottom: 0 }}>
            サーバーエラー
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.8, marginTop: 16 }}>
            予期しない問題が発生しました。時間をおいて再度お試しください。
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 32,
              background: "linear-gradient(135deg, #dbb978, #c5a059)",
              color: "#ffffff",
              border: "none",
              borderRadius: 9999,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            再試行
          </button>
        </div>
      </body>
    </html>
  );
}
