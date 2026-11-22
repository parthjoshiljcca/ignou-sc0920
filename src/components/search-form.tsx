"use client";

import { useLayoutEffect, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Survives the page re-mounting while the new results load.
let keepScroll: { path: string; y: number } | null = null;

/**
 * A GET search/filter form that updates the URL without a full reload and keeps the page where it was
 * (the loading skeleton in between would otherwise leave the page scrolled to the top).
 */
export function SearchForm({ action, className, children }: { action: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  const params = useSearchParams();

  useLayoutEffect(() => {
    if (!keepScroll || keepScroll.path !== action) return;
    const y = keepScroll.y;
    keepScroll = null;
    // Next.js scrolls to the top when the new results commit (even with scroll: false), and the results
    // may still be filling in. Hold the position for a moment, unless the user scrolls themselves.
    const until = performance.now() + 1500;
    let raf = 0, stopped = false;
    const stop = () => { stopped = true; cancelAnimationFrame(raf); };
    const tick = () => {
      if (stopped) return;
      if (Math.abs(window.scrollY - y) > 2) window.scrollTo(0, y);
      if (performance.now() < until) raf = requestAnimationFrame(tick);
    };
    tick();
    const opts = { passive: true, once: true } as const;
    window.addEventListener("wheel", stop, opts);
    window.addEventListener("touchstart", stop, opts);
    window.addEventListener("keydown", stop, opts);
    return () => {
      stop();
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
  }, [params, action]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new URLSearchParams();
    new FormData(e.currentTarget).forEach((v, k) => { if (typeof v === "string" && v.trim()) q.set(k, v.trim()); });
    keepScroll = { path: action, y: window.scrollY };
    (document.activeElement as HTMLElement | null)?.blur?.(); // close the phone keyboard
    router.push(q.size ? `${action}?${q}` : action, { scroll: false });
  };

  return <form role="search" className={className} action={action} onSubmit={onSubmit}>{children}</form>;
}
