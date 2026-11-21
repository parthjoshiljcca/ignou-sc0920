import Link from "next/link";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { sessionsForStudent } from "@/lib/queries";
import { CalendarDays, CircleHelp, ClipboardCheck, LifeBuoy, Megaphone, Plus, ChevronRight } from "lucide-react";
import { studentAssignments } from "@/lib/assignment-data";
import { overallStatus, statusLabel } from "@/lib/assignment-status";
import { db, schema } from "@/db";
import { requireStudent } from "@/lib/auth";
import { fmtDay, properName, timeAgo } from "@/lib/format";
import { Card, LinkButton, Pill } from "@/components/ui";
import { SetupReminder } from "@/components/pwa";
import { SessionCard } from "@/components/session-card";
import { TicketRow } from "@/components/ticket-row";

export const metadata = { title: "Home" };

export default async function Dashboard() {
  const u = await requireStudent();
  const prog = u.programme ?? "Other";

  const [sessions, notices, tickets, assignments] = await Promise.all([
    sessionsForStudent(u, { upcoming: true, limit: 3 }),
    db.select().from(schema.announcements)
      .where(or(eq(schema.announcements.audience, "ALL"), eq(schema.announcements.audience, prog)))
      .orderBy(desc(schema.announcements.pinned), desc(schema.announcements.createdAt)).limit(3),
    db.select().from(schema.tickets)
      .where(and(eq(schema.tickets.studentId, u.id), inArray(schema.tickets.status, ["open", "in_progress", "resolved"])))
      .orderBy(desc(schema.tickets.updatedAt)).limit(3),
    u.enrollmentNo ? studentAssignments(u.enrollmentNo) : Promise.resolve([]),
  ]);
  const latestAsg = assignments[0];
  const asgStatus = latestAsg ? overallStatus(latestAsg.rows.map((r) => r.status)) : null;

  return (
    <>
      <SetupReminder />

      <div className="mb-6">
        <p className="text-sm text-muted">Namaste 🙏</p>
        <h1 className="text-2xl font-bold tracking-tight">{properName(u.name)}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Pill tone="primary">{u.programme}</Pill>
          <Pill>Enrol. {u.enrollmentNo}</Pill>
        </div>
      </div>

      <Link href="/tickets/new" className="mb-3 flex items-center gap-4 rounded-2xl bg-primary-fill p-5 text-on-primary">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15">
          <Plus className="size-6" aria-hidden />
        </div>
        <div className="flex-1">
          <p className="font-bold">Have a question?</p>
          <p className="text-sm opacity-85">Raise a query and the coordinator will reply here.</p>
        </div>
        <ChevronRight className="size-5 opacity-80" aria-hidden />
      </Link>
      {latestAsg && asgStatus && (
        <Link href="/assignments" className="mb-3 flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-surface-2">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <ClipboardCheck className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">My assignments</span>
            <span className="block truncate text-xs text-muted">{latestAsg.receipt.session} · {latestAsg.rows.length} courses</span>
            <span className="mt-1 inline-flex rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">{statusLabel(asgStatus)}</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
        </Link>
      )}
      <Link href="/faqs" className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm hover:bg-surface-2">
        <CircleHelp className="size-5 shrink-0 text-accent" aria-hidden />
        <span className="flex-1"><b>FAQs</b> <span className="text-muted">— hall ticket, re-registration, results, refunds…</span></span>
        <ChevronRight className="size-4 text-muted" aria-hidden />
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle icon={<CalendarDays className="size-4" />} title="Upcoming classes" href="/schedule" />
          {sessions.length ? (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id}>
                  <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">{fmtDay(s.startsAt)}</p>
                  <SessionCard s={s} />
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-5 text-sm text-muted">No classes scheduled for your programme yet. We&apos;ll notify you when they&apos;re announced.</Card>
          )}
        </section>

        <div className="space-y-6">
          <section>
            <SectionTitle icon={<LifeBuoy className="size-4" />} title="My active queries" href="/tickets" />
            {tickets.length ? (
              <Card className="divide-y divide-border overflow-hidden">
                {tickets.map((t) => (
                  <TicketRow key={t.id} href={`/tickets/${t.id}`} {...t} />
                ))}
              </Card>
            ) : (
              <Card className="p-5 text-sm text-muted">No open queries. Tap &ldquo;Have a question?&rdquo; to ask one.</Card>
            )}
          </section>

          <section>
            <SectionTitle icon={<Megaphone className="size-4" />} title="Latest notices" href="/notices" />
            {notices.length ? (
              <Card className="divide-y divide-border overflow-hidden">
                {notices.map((n) => (
                  <Link key={n.id} href="/notices" className="block px-4 py-3.5 hover:bg-surface-2">
                    <div className="flex items-center gap-2">
                      {n.pinned && <Pill tone="accent">Pinned</Pill>}
                      <span className="text-xs text-muted">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="mt-1 font-semibold">{n.title}</p>
                    <p className="line-clamp-2 text-sm text-muted">{n.body}</p>
                  </Link>
                ))}
              </Card>
            ) : (
              <Card className="p-5 text-sm text-muted">No notices yet.</Card>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function SectionTitle({ icon, title, href }: { icon: React.ReactNode; title: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 font-bold">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      <LinkButton href={href} variant="ghost" className="min-h-8 px-2 text-xs">See all</LinkButton>
    </div>
  );
}
