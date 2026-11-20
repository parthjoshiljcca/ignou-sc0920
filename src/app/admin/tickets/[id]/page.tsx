import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, eq, ne } from "drizzle-orm";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { fmtDateTime, properName } from "@/lib/format";
import { updateTicketMetaAction } from "@/actions/tickets";
import { Card, PriorityBadge, StatusBadge, Pill } from "@/components/ui";
import { TicketThread } from "@/components/ticket-thread";
import { ReplyForm } from "@/components/reply-form";
import { SubmitButton } from "@/components/form-bits";

export const metadata = { title: "Query" };

export default async function AdminTicket({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [row] = await db.select({ t: schema.tickets, s: schema.users }).from(schema.tickets)
    .innerJoin(schema.users, eq(schema.users.id, schema.tickets.studentId)).where(eq(schema.tickets.id, id));
  if (!row) notFound();
  const { t, s } = row;
  const [info] = s.enrollmentNo
    ? await db.select({ year: schema.roster.admissionYear, address: schema.roster.address }).from(schema.roster).where(eq(schema.roster.enrollmentNo, s.enrollmentNo))
    : [];
  const [{ others }] = await db.select({ others: count() }).from(schema.tickets)
    .where(and(eq(schema.tickets.studentId, s.id), ne(schema.tickets.id, id)));

  return (
    <div>
      <Link href="/admin/tickets" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text">
        <ArrowLeft className="size-4" aria-hidden /> All queries
      </Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          <div className="mb-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={t.status} />
              <PriorityBadge priority={t.priority} />
              <span className="text-xs text-muted">#{t.id} · {t.category} · {fmtDateTime(t.createdAt)}</span>
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">{t.subject}</h1>
          </div>
          <TicketThread ticketId={t.id} viewerId={admin.id} />
          <Card className="mt-6 p-4">
            <ReplyForm key={t.status} ticketId={t.id} isAdmin currentStatus={t.status} placeholder={`Reply to ${properName(s.name)}…`} />
          </Card>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <Card className="p-4">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Student</p>
            <p className="mt-1 font-bold">{properName(s.name)}</p>
            <div className="mt-2 flex flex-wrap gap-1.5"><Pill tone="primary">{s.programme}</Pill><Pill>{s.enrollmentNo}</Pill></div>
            <div className="mt-3 space-y-1.5 text-sm">
              {s.phone && <a href={`tel:${s.phone}`} className="flex items-center gap-2 text-primary hover:underline"><Phone className="size-4" aria-hidden /> {s.phone}</a>}
              {!s.email.endsWith(".local") && <a href={`mailto:${s.email}`} className="flex items-center gap-2 break-all text-primary hover:underline"><Mail className="size-4 shrink-0" aria-hidden /> {s.email}</a>}
            </div>
            {info?.year && <p className="mt-3 text-xs text-muted">Admitted {info.year}</p>}
            {info?.address && <p className="mt-1 text-xs text-muted">{info.address}</p>}
            {others > 0 && (
              <Link href={`/admin/tickets?status=all&q=${s.enrollmentNo}`} className="mt-3 block text-sm font-semibold text-primary hover:underline">
                {others} other quer{others === 1 ? "y" : "ies"} →
              </Link>
            )}
          </Card>
          <Card className="p-4">
            <form key={`${t.status}-${t.priority}`} action={updateTicketMetaAction} className="space-y-3">
              <input type="hidden" name="ticketId" value={t.id} />
              <label className="block text-sm font-medium">Status
                <select name="status" defaultValue={t.status} className="input mt-1.5">
                  <option value="open">Open</option><option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option><option value="closed">Closed</option>
                </select>
              </label>
              <label className="block text-sm font-medium">Priority
                <select name="priority" defaultValue={t.priority} className="input mt-1.5">
                  <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
                </select>
              </label>
              <SubmitButton variant="secondary" className="w-full" pendingText="Updating…">Update</SubmitButton>
            </form>
          </Card>
        </aside>
      </div>
    </div>
  );
}
