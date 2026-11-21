import clsx from "clsx";
import { Check } from "lucide-react";
import { ASSIGNMENT_STATUSES, statusIndex } from "@/lib/assignment-status";

/** Six-step progress line. Vertical on phones, horizontal on wider screens. */
export function AssignmentStepper({ status, compact = false }: { status: string; compact?: boolean }) {
  const cur = statusIndex(status);
  return (
    <ol className={clsx("grid gap-0", compact ? "grid-cols-6" : "sm:grid-cols-6")} aria-label="Assignment progress">
      {ASSIGNMENT_STATUSES.map((s, i) => {
        const done = i < cur, now = i === cur;
        return (
          <li key={s.key} className={clsx("relative flex gap-3", compact ? "flex-col items-center text-center" : "pb-4 last:pb-0 sm:flex-col sm:items-center sm:pb-0 sm:text-center")} aria-current={now ? "step" : undefined}>
            {i < ASSIGNMENT_STATUSES.length - 1 && (
              <span
                aria-hidden
                className={clsx(
                  "absolute",
                  compact ? "top-3 left-1/2 h-0.5 w-full" : "top-7 bottom-0 left-3 w-0.5 sm:top-3 sm:bottom-auto sm:left-1/2 sm:h-0.5 sm:w-full",
                  done ? "bg-success" : "bg-border",
                )}
              />
            )}
            <span
              className={clsx(
                "relative z-10 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                done && "bg-success text-white",
                now && "bg-primary text-on-primary ring-4 ring-primary/20",
                !done && !now && "border-2 border-border bg-surface text-muted",
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            {!compact && (
              <span className={clsx("pt-0.5 text-sm leading-tight sm:mt-1.5 sm:px-1 sm:pt-0 sm:text-xs", now ? "font-bold text-primary" : done ? "font-medium" : "text-muted")}>
                {s.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
