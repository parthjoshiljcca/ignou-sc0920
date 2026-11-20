/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";

/** IGNOU emblem on a white tile, so it stays legible in dark mode too. */
export function Logo({ className = "size-9" }: { className?: string }) {
  return (
    <span className={clsx("grid shrink-0 place-items-center rounded-xl bg-white p-1 ring-1 ring-black/5", className)}>
      <img src="/brand/ignou-emblem.png" alt="IGNOU" className="size-full object-contain" />
    </span>
  );
}

/** Full "ignou — The People's University" lock-up. */
export function FullLogo({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5", className)}>
      <img src="/brand/ignou-logo.png" alt="IGNOU – The People's University" className="h-full w-auto" />
    </span>
  );
}

export const CREDIT = "Design & Developed by: Parth D. Joshi";

export function Credit({ className }: { className?: string }) {
  return <p className={clsx("text-xs text-muted", className)}>{CREDIT}</p>;
}
