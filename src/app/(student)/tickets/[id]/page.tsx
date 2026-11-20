import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db, schema } from "@/db";
import { requireStudent } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { closeOwnTicketAction } from "@/actions/tickets";
import { Alert, Card, StatusBadge } from "@/components/ui";
import { TicketThread } from "@/components/ticket-thread";
import { ReplyForm } from "@/components/reply-form";

export const metadata = { title: "Query" };

export default async function TicketPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const u = await requireStudent();
  const id = Number((await params).id);
  const { created } = await searchParams;
  if (!Number.isInteger(id)) notFound();
  const [t] = await db.select().from(schema.tickets).where(and(eq(schema.tickets.id, id), eq(schema.tickets.studentId, u.id)));
  if (!t) notFound();
  const finished = t.status === "resolved" || t.status === "closed";

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/tickets" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text">
        <ArrowLeft className="size-4" aria-hidden /> All queries
      </Link>
      {created && <div className="mb-4"><Alert tone="success">Query submitted. You&apos;ll be notified when the coordinator replies.</Alert></div>}
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={t.status} />
          <span className="text-xs text-muted">#{t.id} · {t.category} · Opened {fmtDateTime(t.createdAt)}</span>
        </div>
        <h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">{t.subject}</h1>
      </div>

      <TicketThread ticketId={t.id} viewerId={u.id} />

      <Card className="mt-6 p-4">
        {t.status === "closed" ? (
          <p className="mb-3 text-sm text-muted">This query is closed. Sending a message will reopen it.</p>
        ) : t.status === "resolved" ? (
          <p className="mb-3 text-sm text-muted">Marked resolved. Still need help? Reply below to reopen.</p>
        ) : null}
        <ReplyForm ticketId={t.id} placeholder={finished ? "Reply to reopen this query…" : "Add more information…"} />
      </Card>

      {!finished && (
        <form action={closeOwnTicketAction} className="mt-3 text-right">
          <input type="hidden" name="ticketId" value={t.id} />
          <button className="text-sm font-medium text-muted underline-offset-4 hover:text-text hover:underline">My issue is solved — close query</button>
        </form>
      )}
    </div>
  );
}
