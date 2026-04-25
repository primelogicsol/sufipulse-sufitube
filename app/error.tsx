"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page render error:", error);
  }, [error]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <h2 style={{ color: "#C8A75E", fontSize: "1.5rem", marginBottom: "1rem" }}>Something went wrong</h2>
        <p style={{ color: "#94A3B8", marginBottom: "1.5rem" }}>
          {error.message || "An unexpected error occurred. Please try refreshing the page."}
        </p>
        <button
          onClick={reset}
          style={{ background: "#C8A75E", color: "#0F172A", border: "none", padding: "0.75rem 1.5rem", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
