"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Download, Share, X } from "lucide-react";
import { btnClass } from "./ui";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallBanner() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem("install-dismissed") === "1") return;
    } catch {}
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) {
      setIos(true);
      setHidden(false);
    }
    const h = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  if (hidden) return null;
  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem("install-dismissed", "1");
    } catch {}
  };

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-border bg-primary-soft p-4">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-on-primary">
        <Download className="size-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Install the SC 0920 app</p>
        {ios ? (
          <p className="mt-0.5 text-sm text-muted">
            Tap <Share className="inline size-4 align-text-bottom" aria-label="Share" /> then <b>Add to Home Screen</b>.
          </p>
        ) : (
          <p className="mt-0.5 text-sm text-muted">Get it on your home screen for quick access and alerts.</p>
        )}
        {evt && (
          <button
            className={btnClass("primary", "mt-3 min-h-9")}
            onClick={async () => {
              await evt.prompt();
              await evt.userChoice;
              setHidden(true);
            }}
          >
            Install
          </button>
        )}
      </div>
      <button onClick={dismiss} aria-label="Dismiss" className="rounded-lg p-1 text-muted hover:text-text">
        <X className="size-5" />
      </button>
    </div>
  );
}

function urlB64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushToggle({ compact = false }: { compact?: boolean }) {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const [state, setState] = useState<"loading" | "unsupported" | "denied" | "off" | "on">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!key || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return setState("unsupported");
      }
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, [key]);

  async function enable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState(perm === "denied" ? "denied" : "off");
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(key!) });
      const res = await fetch("/api/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub) });
      setState(res.ok ? "on" : "off");
    } catch {
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return null;
  if (state === "unsupported") {
    return compact ? null : (
      <p className="text-sm text-muted">
        Push alerts aren&apos;t available in this browser. On iPhone, install the app to the home screen first. You&apos;ll still see every update under Notifications.
      </p>
    );
  }
  if (state === "denied") {
    return <p className="text-sm text-muted">Notifications are blocked. Allow them for this site in your browser settings.</p>;
  }
  if (compact && state === "on") return null;

  if (compact) {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-accent-soft p-4">
        <Bell className="size-5 shrink-0 text-accent" aria-hidden />
        <p className="min-w-0 flex-1 text-sm">
          <b>Turn on alerts</b> for replies, class schedules and notices.
        </p>
        <button onClick={enable} disabled={busy} className={btnClass("primary", "min-h-9 shrink-0")}>
          Turn on
        </button>
      </div>
    );
  }

  return state === "on" ? (
    <button onClick={disable} disabled={busy} className={btnClass("secondary")}>
      <BellOff className="size-4" aria-hidden /> Turn off push alerts on this device
    </button>
  ) : (
    <button onClick={enable} disabled={busy} className={btnClass("primary")}>
      <Bell className="size-4" aria-hidden /> Turn on push alerts on this device
    </button>
  );
}
