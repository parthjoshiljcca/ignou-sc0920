import Link from "next/link";
import clsx from "clsx";
import { asc, desc, gte, lt } from "drizzle-orm";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { fmtDay } from "@/lib/format";
import { deleteSessionAction } from "@/actions/admin";
import { Alert, EmptyState, LinkButton, PageHeader, btnClass } from "@/components/ui";
import { ConfirmSubmit } from "@/components/form-bits";
import { SessionCard } from "@/components/session-card";
import type { CounsellingSession } from "@/db/schema";

export const metadata = { title: "Schedule" };

export default async function AdminSchedule({ searchParams }: { searchParams: Promise<{ view?: string; saved?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const past = sp.view === "past";
  const s = schema.counsellingSessions;
  const rows = await db.select().from(s).where(past ? lt(s.endsAt, new Date()) : gte(s.endsAt, new Date()))
    .orderBy(past ? desc(s.startsAt) : asc(s.startsAt)).limit(300);
  const groups = new Map<string, CounsellingSession[]>();
  for (const r of rows) groups.set(fmtDay(r.startsAt), [...(groups.get(fmtDay(r.startsAt)) ?? []), r]);

  return (
    <>
      <PageHeader title="Counselling schedule" subtitle="Students see classes for their programme and enrolled courses."
        action={<LinkButton href="/admin/schedule/new"><Plus className="size-4" aria-hidden /> Add class</LinkButton>} />
      {sp.saved && <div className="mb-4"><Alert tone="success">Schedule saved.</Alert></div>}
      <div className="mb-5 inline-flex rounded-xl border border-border bg-surface p-1 text-sm font-semibold">
        {[["Upcoming", ""], ["Past", "?view=past"]].map(([label, q]) => (
          <Link key={label} href={`/admin/schedule${q}`} className={clsx("rounded-lg px-4 py-1.5", (label === "Past") === past ? "bg-primary text-on-primary" : "text-muted hover:text-text")}>{label}</Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<CalendarDays className="size-6" />} title={past ? "No past classes" : "Nothing scheduled"} action={!past && <LinkButton href="/admin/schedule/new">Add the first class</LinkButton>} />
      ) : (
        <div className="space-y-6">
          {[...groups].map(([day, items]) => (
            <section key={day}>
              <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{day}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((x) => (
                  <SessionCard key={x.id} s={x} actions={
                    <>
                      <Link href={`/admin/schedule/${x.id}`} className={btnClass("secondary", "min-h-9 px-3")}><Pencil className="size-4" aria-hidden /> Edit</Link>
                      <form action={deleteSessionAction}>
                        <input type="hidden" name="id" value={x.id} />
                        <ConfirmSubmit message="Delete this class from the schedule?" className={btnClass("danger", "min-h-9 px-3")}><Trash2 className="size-4" aria-hidden /> Delete</ConfirmSubmit>
                      </form>
                    </>
                  } />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
