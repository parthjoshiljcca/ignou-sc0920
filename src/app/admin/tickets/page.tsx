import Link from "next/link";
import clsx from "clsx";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { Inbox, Search } from "lucide-react";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { STATUS_LABEL, TICKET_CATEGORIES } from "@/lib/constants";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { TicketRow } from "@/components/ticket-row";

export const metadata = { title: "Queries" };
const TABS = ["active", "open", "in_progress", "resolved", "closed", "all"] as const;

export default async function AdminTickets({ searchParams }: { searchParams: Promise<{ status?: string; category?: string; q?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (TABS as readonly string[]).includes(sp.status ?? "") ? sp.status! : "active";
  const t = schema.tickets;
  const conds: SQL[] = [];
  if (status === "active") conds.push(or(eq(t.status, "open"), eq(t.status, "in_progress"))!);
  else if (status !== "all") conds.push(eq(t.status, status as "open"));
  if (sp.category) conds.push(eq(t.category, sp.category));
  const q = sp.q?.trim();
  if (q) {
    const like = `%${q}%`;
    conds.push(or(ilike(t.subject, like), ilike(schema.users.name, like), ilike(schema.users.enrollmentNo, like), sql`${t.id}::text = ${q.replace(/^#/, "")}`)!);
  }
  const rows = await db.select({ t, name: schema.users.name, enrol: schema.users.enrollmentNo, programme: schema.users.programme })
    .from(t).innerJoin(schema.users, eq(schema.users.id, t.studentId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(t.updatedAt)).limit(200);

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status, category: sp.category, q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/admin/tickets?${p}`;
  };

  return (
    <>
      <PageHeader title="Student queries" subtitle="Reply, update status and keep students informed." />
      <div className="-mx-4 mb-4 overflow-x-auto px-4">
        <div className="inline-flex gap-1 rounded-xl border border-border bg-surface p-1 text-sm font-semibold">
          {TABS.map((s) => (
            <Link key={s} href={href({ status: s })} className={clsx("rounded-lg px-3 py-1.5 whitespace-nowrap", s === status ? "bg-primary text-on-primary" : "text-muted hover:text-text")}>
              {s === "active" ? "Needs action" : s === "all" ? "All" : STATUS_LABEL[s]}
            </Link>
          ))}
        </div>
      </div>
      <form className="mb-4 flex flex-wrap gap-2" action="/admin/tickets">
        <input type="hidden" name="status" value={status} />
        <div className="relative min-w-0 flex-1 basis-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Search subject, name, enrolment or #id" className="input pl-9" aria-label="Search queries" />
        </div>
        <select name="category" defaultValue={sp.category ?? ""} className="input w-auto" aria-label="Category">
          <option value="">All categories</option>
          {TICKET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button className="rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-2">Filter</button>
      </form>
      {rows.length === 0 ? (
        <EmptyState icon={<Inbox className="size-6" />} title="No queries here" body="Try another filter." />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {rows.map(({ t, name, enrol, programme }) => (
            <TicketRow key={t.id} href={`/admin/tickets/${t.id}`} {...t} who={`${name} · ${enrol} · ${programme}`} />
          ))}
        </Card>
      )}
    </>
  );
}
