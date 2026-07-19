"use client";

import { useEffect } from "react";

/**
 * Renders in place of the root layout, so globals.css/tokens.css may not be
 * available — critical token values are inlined rather than referenced.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled root error", { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "6rem 1.5rem",
          textAlign: "center",
          backgroundColor: "#F5F6F7",
          color: "#3A3F45",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#B9C0C7" }}>
          Application error
        </p>
        <h1 style={{ margin: 0, fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 400, color: "#15171A" }}>
          Altr needs a moment.
        </h1>
        <p style={{ margin: 0, maxWidth: "36ch" }}>
          Something interrupted the whole page. Reloading usually fixes it.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            borderRadius: "10px",
            backgroundColor: "#15171A",
            color: "#F5F6F7",
            padding: "0.75rem 1.5rem",
            border: "none",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
