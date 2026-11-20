"use client";

import { useEffect } from "react";
import { isStaleVersionError, reloadOnce, reportClientError } from "@/lib/client-errors";

/** Friendly replacement for Next's "Application error: a client-side exception has occurred". */
export function ErrorScreen({ error, reset, kind }: { error: Error & { digest?: string }; reset?: () => void; kind: string }) {
  useEffect(() => {
    reportClientError(error, kind);
    if (isStaleVersionError(error)) reloadOnce();
  }, [error, kind]);

  return (
    <div style={{ minHeight: "70dvh", display: "grid", placeItems: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 380, textAlign: "center" }}>
        <p style={{ fontSize: 40, margin: 0 }}>⚠️</p>
        <h1 style={{ fontSize: 20, margin: "8px 0 6px" }}>Something went wrong</h1>
        <p style={{ color: "#5b6478", fontSize: 15, lineHeight: 1.5, margin: 0 }}>
          The app may have just been updated. Tap <b>Reload</b>. If it keeps happening, update your Chrome browser, turn off
          page translation for this site, or open the link in Chrome instead of inside Gmail/WhatsApp.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
          <button
            onClick={() => location.reload()}
            style={{ background: "#0066b2", color: "#fff", border: 0, borderRadius: 10, padding: "10px 18px", fontWeight: 600, fontSize: 15 }}
          >
            Reload
          </button>
          {reset && (
            <button onClick={() => reset()} style={{ background: "transparent", color: "#0066b2", border: "1px solid #c9d6ea", borderRadius: 10, padding: "10px 18px", fontWeight: 600, fontSize: 15 }}>
              Try again
            </button>
          )}
          <a href="/login" style={{ color: "#0066b2", padding: "10px 12px", fontWeight: 600, fontSize: 15 }}>Sign in page</a>
        </div>
        <p style={{ color: "#97a1b8", fontSize: 12, marginTop: 18 }}>If the problem continues, email sc0920@ignou.ac.in{error.digest ? ` (code ${error.digest})` : ""}.</p>
      </div>
    </div>
  );
}
