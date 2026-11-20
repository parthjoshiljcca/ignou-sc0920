import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { ChevronRight, CircleHelp, LifeBuoy, Plus } from "lucide-react";
import { db, schema } from "@/db";
import { requireStudent } from "@/lib/auth";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { TicketRow } from "@/components/ticket-row";

export const metadata = { title: "Help Desk" };

export default async function Tickets() {
  const u = await requireStudent();
  const rows = await db.select().from(schema.tickets).where(eq(schema.tickets.studentId, u.id)).orderBy(desc(schema.tickets.updatedAt));
  const active = rows.filter((r) => r.status === "open" || r.status === "in_progress");
  const done = rows.filter((r) => r.status === "resolved" || r.status === "closed");

  return (
    <>
      <PageHeader
        title="Help Desk"
        subtitle="Your questions to the study centre and their replies."
        action={<LinkButton href="/tickets/new"><Plus className="size-4" aria-hidden /> New query</LinkButton>}
      />
      <Link href="/faqs" className="mb-5 flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 hover:bg-surface-2">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><CircleHelp className="size-5" aria-hidden /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Frequently asked questions</span>
          <span className="block text-sm text-muted">Hall ticket, re-registration, study material, refunds and more — instant answers.</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
      </Link>
      {rows.length === 0 ? (
        <EmptyState
          icon={<LifeBuoy className="size-6" />}
          title="No queries yet"
          body="Ask about admission, assignments, exam forms, results or anything else. The coordinator will reply here."
          action={<LinkButton href="/tickets/new">Ask a question</LinkButton>}
        />
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted">Active ({active.length})</h2>
              <Card className="divide-y divide-border overflow-hidden">
                {active.map((t) => <TicketRow key={t.id} href={`/tickets/${t.id}`} {...t} />)}
              </Card>
            </section>
          )}
          {done.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted">Resolved &amp; closed ({done.length})</h2>
              <Card className="divide-y divide-border overflow-hidden">
                {done.map((t) => <TicketRow key={t.id} href={`/tickets/${t.id}`} {...t} />)}
              </Card>
            </section>
          )}
        </div>
      )}
    </>
  );
}
