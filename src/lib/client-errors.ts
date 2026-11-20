/** Shared by the error screens and the global listeners (client-only helpers). */

export function reportClientError(e: unknown, kind: string) {
  try {
    const err = e as { message?: string; stack?: string; digest?: string };
    const body = JSON.stringify({
      message: err?.message ?? String(e),
      stack: err?.stack,
      digest: err?.digest,
      path: location.pathname,
      kind,
    });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/client-error", new Blob([body], { type: "application/json" }));
    else fetch("/api/client-error", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
  } catch {}
}

/** Errors that mean "this tab is running an older version of the app than the server". */
export function isStaleVersionError(e: unknown) {
  const m = String((e as { message?: string })?.message ?? e);
  return /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Failed to find Server Action|Server Action .* was not found|deployment/i.test(m);
}

/** Reload once to pick up the new version; never loop. */
export function reloadOnce(): boolean {
  try {
    const key = "sc0920-auto-reload-at";
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(key, String(Date.now()));
  } catch {}
  location.reload();
  return true;
}
