"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
          color: "#ededed",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            padding: "2.5rem",
            textAlign: "center",
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(16px)",
            borderRadius: "1.25rem",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <p style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>😵</p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "0.875rem", opacity: 0.7, marginBottom: "1.5rem" }}>
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "#ededed",
              color: "#171717",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
