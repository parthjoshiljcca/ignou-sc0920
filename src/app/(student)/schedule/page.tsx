import Link from "next/link";
import clsx from "clsx";
import { CalendarDays } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { sessionsForStudent } from "@/lib/queries";
import { fmtDay } from "@/lib/format";
import { EmptyState, PageHeader, Pill } from "@/components/ui";
import { SessionCard } from "@/components/session-card";
import type { CounsellingSession } from "@/db/schema";

export const metadata = { title: "Counselling schedule" };

export default async function Schedule({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const u = await requireStudent();
  const past = (await searchParams).view === "past";
  const rows = await sessionsForStudent(u, { upcoming: !past });
  const list = past ? [...rows].reverse() : rows;

  const groups = new Map<string, CounsellingSession[]>();
  for (const s of list) {
    const k = fmtDay(s.startsAt);
    groups.set(k, [...(groups.get(k) ?? []), s]);
  }

  return (
    <>
      <PageHeader
        title="Counselling schedule"
        subtitle={<>Classes for <b>{u.programme}</b> and your enrolled courses. All times IST.</>}
      />
      {u.courses.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {u.courses.map((c) => <Pill key={c}>{c}</Pill>)}
        </div>
      )}
      <div className="mb-5 inline-flex rounded-xl border border-border bg-surface p-1 text-sm font-semibold" role="tablist">
        {[["Upcoming", ""], ["Past", "?view=past"]].map(([label, q]) => {
          const active = (label === "Past") === past;
          return (
            <Link key={label} href={`/schedule${q}`} role="tab" aria-selected={active}
              className={clsx("rounded-lg px-4 py-1.5", active ? "bg-primary text-on-primary" : "text-muted hover:text-text")}>
              {label}
            </Link>
          );
        })}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<CalendarDays className="size-6" />} title={past ? "No past classes" : "No upcoming classes yet"}
          body={past ? undefined : "When the coordinator schedules counselling for your courses, it will appear here and you'll get a notification."} />
      ) : (
        <div className="space-y-6">
          {[...groups].map(([day, items]) => (
            <section key={day}>
              <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{day}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((s) => <SessionCard key={s.id} s={s} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
