"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, BellRing, Check, Download, Share, SquarePlus, X } from "lucide-react";
import clsx from "clsx";
import { btnClass } from "./ui";
import { isStaleVersionError, reloadOnce, reportClientError } from "@/lib/client-errors";

/* ------------------------------------------------------------------ */
/* Install prompt store: Chrome fires `beforeinstallprompt` once, often */
/* before React mounts, so we capture it globally as early as possible. */
/* ------------------------------------------------------------------ */

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferredPrompt: BIPEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BIPEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    emit();
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

type InstallState = "installed" | "prompt" | "ios" | "manual";
function useInstallState(): InstallState | null {
  return useSyncExternalStore(
    subscribe,
    () => (installed || isStandalone() ? "installed" : deferredPrompt ? "prompt" : isIos() ? "ios" : "manual"),
    () => null,
  );
}

async function promptInstall() {
  if (!deferredPrompt) return false;
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  if (outcome === "accepted") installed = true;
  emit();
  return outcome === "accepted";
}

/* --------------------------- Web push --------------------------- */

type PushState = "unsupported" | "needs-install" | "denied" | "off" | "on";
const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlB64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function readPushState(): Promise<PushState> {
  const hasApi = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!VAPID) return "unsupported";
  if (!hasApi) return isIos() && !isStandalone() ? "needs-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub && Notification.permission === "granted") {
    // Re-send so the server always has this device (cheap, idempotent).
    fetch("/api/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub) }).catch(() => {});
    return "on";
  }
  return "off";
}

async function enablePush(): Promise<PushState> {
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? "denied" : "off";
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(VAPID!) }));
  const res = await fetch("/api/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub) });
  if (res.ok) {
    reg.showNotification("Notifications are on ✅", {
      body: "You'll get replies, class schedules and notices from SC 0920 instantly.",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
    }).catch(() => {});
  }
  return res.ok ? "on" : "off";
}

async function disablePush(): Promise<PushState> {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await fetch("/api/push", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
    await sub.unsubscribe();
  }
  return "off";
}

function usePushState() {
  const [state, setState] = useState<PushState | null>(null);
  useEffect(() => {
    readPushState().then(setState).catch(() => setState("unsupported"));
  }, []);
  return [state, setState] as const;
}

/* ------------------------ Service worker ------------------------ */

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    // Report crashes that happen outside React, and recover when this tab runs an outdated version.
    const onError = (e: ErrorEvent) => {
      reportClientError(e.error ?? e.message, "window");
      if (isStaleVersionError(e.error ?? e.message)) reloadOnce();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      reportClientError(e.reason, "promise");
      if (isStaleVersionError(e.reason)) reloadOnce();
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}

/**
 * Keeps the open app up to date in real time, without the user refreshing:
 * - when a push notification arrives (message from the service worker), and
 * - by polling a small fingerprint of everything the user can see (/api/live) and
 *   soft-refreshing the page when it changes.
 * Polling is gentle on the free database: every 8 s while the app is on screen and in use,
 * every 45 s after 3 idle minutes, and not at all while the app is in the background.
 */
export function LiveUpdates({ rendered }: { rendered: string }) {
  const router = useRouter();
  // Fingerprint of the data currently on screen (updates when a refresh lands).
  const shown = useRef(rendered);
  useEffect(() => {
    shown.current = rendered;
  }, [rendered]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastActivity = Date.now();
    let lastRefresh = 0;
    let stopped = false;
    let inFlight = false;

    const refresh = () => {
      lastRefresh = Date.now();
      router.refresh();
    };

    const check = async () => {
      if (stopped || inFlight || document.visibilityState !== "visible") return;
      inFlight = true;
      try {
        const r = await fetch("/api/live", { cache: "no-store" });
        if (r.ok) {
          const { v } = (await r.json()) as { v: string };
          // Self-healing: if a refresh was dropped, the next check still sees a mismatch and retries.
          if (v && v !== shown.current && Date.now() - lastRefresh > 2500) refresh();
        }
      } catch {
        // offline or a deploy in progress — try again next tick
      } finally {
        inFlight = false;
      }
    };

    const schedule = () => {
      clearTimeout(timer);
      if (stopped || document.visibilityState !== "visible") return;
      const idle = Date.now() - lastActivity > 3 * 60 * 1000;
      timer = setTimeout(async () => {
        await check();
        schedule();
      }, idle ? 45000 : 8000);
    };

    const onActivity = () => {
      const wasIdle = Date.now() - lastActivity > 3 * 60 * 1000;
      lastActivity = Date.now();
      if (wasIdle) {
        check();
        schedule();
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        lastActivity = Date.now();
        check();
        schedule();
      } else clearTimeout(timer);
    };
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "push") refresh();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onVisible);
    for (const ev of ["pointerdown", "keydown", "scroll", "touchstart"]) window.addEventListener(ev, onActivity, { passive: true });
    navigator.serviceWorker?.addEventListener("message", onMsg);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onVisible);
      for (const ev of ["pointerdown", "keydown", "scroll", "touchstart"]) window.removeEventListener(ev, onActivity);
      navigator.serviceWorker?.removeEventListener("message", onMsg);
    };
  }, [router]);
  return null;
}

/* ----------------------- App setup sheet ----------------------- */

const SNOOZE_KEY = "sc0920-setup-snoozed-until";

/**
 * Bottom sheet shown after sign-in until the app is installed and notifications are on.
 * Browsers only allow the permission prompt after a tap, so "Allow" is a button.
 */
export function AppSetupSheet({ force = false }: { force?: boolean }) {
  const install = useInstallState();
  const [push, setPush] = usePushState();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const installDone = install === "installed";
  const pushDone = push === "on" || push === "unsupported";
  const allDone = installDone && pushDone;

  useEffect(() => {
    if (install === null || push === null || allDone) return;
    let snoozed = false;
    try {
      snoozed = !force && Number(localStorage.getItem(SNOOZE_KEY) || 0) > Date.now();
    } catch {}
    if (!snoozed) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [install, push, allDone, force]);

  useEffect(() => {
    if (open && allDone) {
      const t = setTimeout(() => setOpen(false), 1600);
      return () => clearTimeout(t);
    }
  }, [open, allDone]);

  const later = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + 2 * 24 * 3600 * 1000));
    } catch {}
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="setup-title">
      <div className="pb-safe w-full max-w-md rounded-t-3xl bg-surface p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
            <BellRing className="size-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="setup-title" className="text-lg font-bold">{allDone ? "You're all set! 🎉" : "Set up the SC 0920 app"}</h2>
            <p className="text-sm text-muted">Get replies, class schedules and notices instantly — like any other app on your phone.</p>
          </div>
          <button onClick={later} aria-label="Close" className="rounded-lg p-1 text-muted hover:text-text"><X className="size-5" /></button>
        </div>

        <ol className="space-y-3">
          <Step n={1} done={installDone} title="Install the app" body={
            install === "installed" ? "Installed on this device." :
            install === "prompt" ? "Adds SC 0920 to your home screen. Opens full-screen, no browser bar." :
            install === "ios" ? <>Tap <Share className="inline size-4 align-text-bottom" aria-label="Share" /> at the bottom of Safari, then <b>Add to Home Screen</b> <SquarePlus className="inline size-4 align-text-bottom" aria-hidden />. Open the app from your home screen.</> :
            <>In your browser menu (⋮), choose <b>Install app</b> or <b>Add to Home screen</b>.</>
          }>
            {install === "prompt" && (
              <button className={btnClass("primary", "min-h-9")} onClick={() => promptInstall()}>
                <Download className="size-4" aria-hidden /> Install
              </button>
            )}
          </Step>

          <Step n={2} done={push === "on"} skipped={push === "unsupported"} title="Allow notifications" body={
            push === "on" ? "Notifications are on for this device." :
            push === "denied" ? <>Notifications are blocked. Open your browser&apos;s <b>Site settings → Notifications</b> for this site and choose <b>Allow</b>.</> :
            push === "needs-install" ? "On iPhone, install the app first (step 1), open it from the home screen, then allow notifications." :
            push === "unsupported" ? "This browser can't show notifications. You'll still see every update inside the app." :
            "Tap Allow, then choose Allow in the pop-up."
          }>
            {push === "off" && (
              <button
                disabled={busy}
                className={btnClass("primary", "min-h-9")}
                onClick={async () => {
                  setBusy(true);
                  try { setPush(await enablePush()); } catch { setPush("off"); } finally { setBusy(false); }
                }}
              >
                <Bell className="size-4" aria-hidden /> {busy ? "Allowing…" : "Allow"}
              </button>
            )}
          </Step>
        </ol>

        <div className="mt-5 flex justify-end gap-2">
          {allDone ? (
            <button className={btnClass("primary")} onClick={() => setOpen(false)}>Done</button>
          ) : (
            <button className={btnClass("ghost")} onClick={later}>Maybe later</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ n, done, skipped, title, body, children }: { n: number; done: boolean; skipped?: boolean; title: string; body: React.ReactNode; children?: React.ReactNode }) {
  return (
    <li className={clsx("flex gap-3 rounded-2xl border p-3.5", done ? "border-success/30 bg-success-soft" : "border-border")}>
      <span className={clsx("grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold", done ? "bg-success text-white" : skipped ? "bg-surface-2 text-muted" : "bg-primary text-on-primary")}>
        {done ? <Check className="size-4" aria-hidden /> : n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{body}</p>
        {!done && children && <div className="mt-2.5">{children}</div>}
      </div>
    </li>
  );
}

/** Small reminder card for dashboards when setup is incomplete (sheet was snoozed). */
export function SetupReminder() {
  const install = useInstallState();
  const [push] = usePushState();
  const [show, setShow] = useState(false);
  if (install === null || push === null) return null;
  const pending = (install !== "installed" ? 1 : 0) + (push === "off" || push === "needs-install" || push === "denied" ? 1 : 0);
  if (!pending) return null;
  return (
    <>
      <button onClick={() => setShow(true)} className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-border bg-accent-soft p-4 text-left">
        <BellRing className="size-5 shrink-0 text-accent" aria-hidden />
        <span className="min-w-0 flex-1 text-sm">
          <b>Finish app setup</b> — {install !== "installed" ? "install the app" : ""}{install !== "installed" && pending > 1 ? " and " : ""}{push !== "on" && push !== "unsupported" ? "allow notifications" : ""} so you never miss an update.
        </span>
        <span className={btnClass("primary", "min-h-9 shrink-0")}>Set up</span>
      </button>
      {show && <AppSetupSheet force key={Date.now()} />}
    </>
  );
}

/* --------------------- Profile / notifications --------------------- */

export function PushToggle() {
  const [state, setState] = usePushState();
  const install = useInstallState();
  const [busy, setBusy] = useState(false);
  if (state === null) return null;

  if (state === "unsupported") return <p className="text-sm text-muted">This browser can&apos;t show notifications. You&apos;ll still see every update under Notifications.</p>;
  if (state === "needs-install") return <p className="text-sm text-muted">On iPhone, add the app to your Home Screen first (Share → Add to Home Screen), open it from there, then turn on notifications.</p>;
  if (state === "denied") return <p className="text-sm text-muted">Notifications are blocked. Allow them for this site in your browser&apos;s site settings.</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {state === "on" ? (
        <button disabled={busy} className={btnClass("secondary")} onClick={async () => { setBusy(true); try { setState(await disablePush()); } finally { setBusy(false); } }}>
          <BellOff className="size-4" aria-hidden /> Turn off notifications on this device
        </button>
      ) : (
        <button disabled={busy} className={btnClass("primary")} onClick={async () => { setBusy(true); try { setState(await enablePush()); } catch { setState("off"); } finally { setBusy(false); } }}>
          <Bell className="size-4" aria-hidden /> Turn on notifications on this device
        </button>
      )}
      {install === "prompt" && (
        <button className={btnClass("secondary")} onClick={() => promptInstall()}>
          <Download className="size-4" aria-hidden /> Install app
        </button>
      )}
    </div>
  );
}
