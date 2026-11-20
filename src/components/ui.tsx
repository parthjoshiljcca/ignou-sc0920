import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";
import { STATUS_LABEL, PRIORITY_LABEL } from "@/lib/constants";

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-h-10 px-4";
const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "bg-surface border border-border text-text hover:bg-surface-2",
  ghost: "text-muted hover:text-text hover:bg-surface-2",
  danger: "bg-danger-soft text-danger hover:brightness-95",
};

export function btnClass(variant: BtnVariant = "primary", extra?: string) {
  return clsx(btnBase, btnVariants[variant], extra);
}

export function Button({ variant = "primary", className, ...p }: ComponentProps<"button"> & { variant?: BtnVariant }) {
  return <button className={btnClass(variant, className)} {...p} />;
}

export function LinkButton({ variant = "primary", className, ...p }: ComponentProps<typeof Link> & { variant?: BtnVariant }) {
  return <Link className={btnClass(variant, className)} {...p} />;
}

export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div className={clsx("rounded-2xl border border-border bg-surface", className)} {...p} />;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[22px] font-bold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

const statusTone: Record<string, string> = {
  open: "bg-info-soft text-info",
  in_progress: "bg-warning-soft text-warning",
  resolved: "bg-success-soft text-success",
  closed: "bg-surface-2 text-muted",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", statusTone[status])}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "normal") return null;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        priority === "high" ? "bg-danger-soft text-danger" : "bg-surface-2 text-muted",
      )}
    >
      {PRIORITY_LABEL[priority]} priority
    </span>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "primary" | "accent" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "primary" && "bg-primary-soft text-primary",
        tone === "accent" && "bg-accent-soft text-accent",
        tone === "neutral" && "bg-surface-2 text-muted",
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-full bg-primary-soft text-primary">{icon}</div>
      <p className="font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}

export function Alert({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "rounded-xl px-3.5 py-2.5 text-sm font-medium",
        tone === "error" && "bg-danger-soft text-danger",
        tone === "success" && "bg-success-soft text-success",
        tone === "info" && "bg-info-soft text-info",
      )}
    >
      {children}
    </div>
  );
}
