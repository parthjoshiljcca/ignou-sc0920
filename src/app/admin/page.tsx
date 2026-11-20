import Link from "next/link";
import { and, asc, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { CalendarPlus, Inbox, Megaphone, Upload } from "lucide-react";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { fmtDay, properName } from "@/lib/format";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { SetupReminder } from "@/components/pwa";
import { TicketRow } from "@/components/ticket-row";
import { SessionCard } from "@/components/session-card";

export const metadata = { title: "Overview" };

export default async function AdminHome() {
  const u = await requireAdmin();
  const [[byStatus], [{ roster }], [{ students }], waiting, upcoming] = await Promise.all([
    db.select({
      open: sql<number>`count(*) filter (where ${schema.tickets.status} = 'open')`.mapWith(Number),
      progress: sql<number>`count(*) filter (where ${schema.tickets.status} = 'in_progress')`.mapWith(Number),
      resolvedWeek: sql<number>`count(*) filter (where ${schema.tickets.status} in ('resolved','closed') and ${schema.tickets.updatedAt} > now() - interval '7 days')`.mapWith(Number),
    }).from(schema.tickets),
    db.select({ roster: count() }).from(schema.roster),
    db.select({ students: count() }).from(schema.users).where(eq(schema.users.role, "student")),
    db.select({ t: schema.tickets, name: schema.users.name }).from(schema.tickets)
      .innerJoin(schema.users, eq(schema.users.id, schema.tickets.studentId))
      .where(inArray(schema.tickets.status, ["open", "in_progress"]))
      .orderBy(desc(sql`${schema.tickets.priority} = 'high'`), asc(schema.tickets.updatedAt)).limit(6),
    db.select().from(schema.counsellingSessions).where(gte(schema.counsellingSessions.endsAt, new Date()))
      .orderBy(asc(schema.counsellingSessions.startsAt)).limit(4),
  ]);

  const stats = [
    { label: "New queries", value: byStatus.open, href: "/admin/tickets?status=open", tone: "text-info" },
    { label: "In progress", value: byStatus.progress, href: "/admin/tickets?status=in_progress", tone: "text-warning" },
    { label: "Resolved (7 days)", value: byStatus.resolvedWeek, href: "/admin/tickets?status=resolved", tone: "text-success" },
    { label: "Students signed in", value: `${students}/${roster}`, href: "/admin/students", tone: "text-primary" },
  ];

  return (
    <>
      <SetupReminder />
      <PageHeader title={`Hello, ${properName(u.name)}`} subtitle="Here's what needs your attention at SC 0920." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl border border-border bg-surface p-4 hover:bg-surface-2">
            <p className={`text-2xl font-bold tabular-nums ${s.tone}`}>{s.value}</p>
            <p className="mt-0.5 text-sm text-muted">{s.label}</p>
          </Link>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <LinkButton href="/admin/schedule/new" variant="secondary"><CalendarPlus className="size-4" aria-hidden /> Schedule class</LinkButton>
        <LinkButton href="/admin/notices" variant="secondary"><Megaphone className="size-4" aria-hidden /> Post notice</LinkButton>
        <LinkButton href="/admin/students#upload" variant="secondary"><Upload className="size-4" aria-hidden /> Upload roster</LinkButton>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold"><Inbox className="size-4 text-primary" aria-hidden /> Waiting for reply</h2>
            <LinkButton href="/admin/tickets" variant="ghost" className="min-h-8 px-2 text-xs">All queries</LinkButton>
          </div>
          {waiting.length ? (
            <Card className="divide-y divide-border overflow-hidden">
              {waiting.map(({ t, name }) => <TicketRow key={t.id} href={`/admin/tickets/${t.id}`} {...t} who={properName(name)} />)}
            </Card>
          ) : <Card className="p-5 text-sm text-muted">Inbox zero. Nothing waiting. 🎉</Card>}
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold"><CalendarPlus className="size-4 text-primary" aria-hidden /> Next classes</h2>
            <LinkButton href="/admin/schedule" variant="ghost" className="min-h-8 px-2 text-xs">Schedule</LinkButton>
          </div>
          {upcoming.length ? (
            <div className="space-y-3">
              {upcoming.map((s) => (
                <div key={s.id}>
                  <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">{fmtDay(s.startsAt)}</p>
                  <SessionCard s={s} />
                </div>
              ))}
            </div>
          ) : <Card className="p-5 text-sm text-muted">No classes scheduled.</Card>}
        </section>
      </div>
    </>
  );
}
