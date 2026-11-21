import clsx from "clsx";
import { Check } from "lucide-react";
import { ASSIGNMENT_STATUSES, statusIndex } from "@/lib/assignment-status";

/**
 * Six-step progress. Phones: a compact bar of six dots with "Step n of 6". Wider screens: labelled steps.
 */
export function AssignmentStepper({ status }: { status: string }) {
  const cur = statusIndex(status);
  const total = ASSIGNMENT_STATUSES.length;
  return (
    <div aria-label={`Assignment progress: step ${cur + 1} of ${total}, ${ASSIGNMENT_STATUSES[cur]?.label}`}>
      <ol className="grid grid-cols-6" role="list">
        {ASSIGNMENT_STATUSES.map((s, i) => {
          const done = i < cur, now = i === cur;
          return (
            <li key={s.key} className="relative flex flex-col items-center text-center" aria-current={now ? "step" : undefined}>
              {i < total - 1 && (
                <span aria-hidden className={clsx("absolute top-3 left-1/2 h-0.5 w-full", i < cur ? "bg-success" : "bg-border")} />
              )}
              <span
                className={clsx(
                  "relative z-10 grid size-6 place-items-center rounded-full text-[11px] font-bold",
                  done && "bg-success text-white",
                  now && "bg-primary-fill text-on-primary ring-4 ring-primary/25",
                  !done && !now && "border-2 border-border bg-surface text-muted",
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <span className={clsx("mt-2 hidden px-1 text-xs leading-tight sm:block", now ? "font-bold text-primary" : done ? "font-medium" : "text-muted")}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-center text-xs text-muted sm:hidden">
        Step {cur + 1} of {total} · <b className="text-primary">{ASSIGNMENT_STATUSES[cur]?.label}</b>
        {cur < total - 1 && <> · next: {ASSIGNMENT_STATUSES[cur + 1].label}</>}
      </p>
    </div>
  );
}
