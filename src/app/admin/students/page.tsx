import Link from "next/link";
import clsx from "clsx";
import { and, asc, count, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { Search } from "lucide-react";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { getProgrammes } from "@/lib/programmes";
import { setStudentActiveAction } from "@/actions/admin";
import { Card, PageHeader, Pill } from "@/components/ui";
import { ResetPassword, RosterUpload } from "@/components/admin/student-tools";

export const metadata = { title: "Students" };

export default async function Students({ searchParams }: { searchParams: Promise<{ q?: string; programme?: string; show?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const r = schema.roster, u = schema.users;
  const conds: SQL[] = [];
  if (sp.programme) conds.push(eq(r.programme, sp.programme));
  if (sp.show === "pending") conds.push(isNull(u.id));
  if (sp.show === "active") conds.push(sql`${u.id} is not null`);
  const q = sp.q?.trim();
  if (q) conds.push(or(ilike(r.name, `%${q}%`), ilike(r.enrollmentNo, `%${q}%`), ilike(r.mobile, `%${q}%`))!);

  const [rows, [{ total }], [{ activated }], programmes] = await Promise.all([
    db.select({ r, user: { id: u.id, isActive: u.isActive, createdAt: u.createdAt } }).from(r)
      .leftJoin(u, eq(u.enrollmentNo, r.enrollmentNo))
      .where(conds.length ? and(...conds) : undefined).orderBy(asc(r.programme), asc(r.name)).limit(500),
    db.select({ total: count() }).from(r),
    db.select({ activated: count() }).from(u).where(eq(u.role, "student")),
    getProgrammes(),
  ]);

  const pct = total ? Math.round((activated / total) * 100) : 0;
  return (
    <>
      <PageHeader title="Students" subtitle="Admission roster for SC 0920 and who has activated the app." />
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-4 sm:p-5">
          <p className="text-sm text-muted">Activated</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{activated}<span className="text-lg text-muted"> / {total}</span></p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">Share the app link and ask students to tap “Activate” with their enrolment number and date of birth.</p>
        </Card>
        <Card id="upload" className="p-4 sm:p-5">
          <p className="font-bold">Upload admission roster</p>
          <p className="mt-1 mb-3 text-sm text-muted">The IGNOU admission export (.xlsx). Only enrolment no., name, programme, email, mobile, DOB and course codes are stored — everything else in the file is ignored. Re-uploading updates existing students.</p>
          <RosterUpload />
        </Card>
      </div>

      <form className="mb-4 flex flex-wrap gap-2" action="/admin/students">
        <div className="relative min-w-0 flex-1 basis-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Name, enrolment or mobile" className="input pl-9" aria-label="Search students" />
        </div>
        <select name="programme" defaultValue={sp.programme ?? ""} className="input w-auto" aria-label="Programme">
          <option value="">All programmes</option>
          {programmes.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select name="show" defaultValue={sp.show ?? ""} className="input w-auto" aria-label="Status">
          <option value="">Everyone</option><option value="active">Activated</option><option value="pending">Not yet activated</option>
        </select>
        <button className="rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-2">Filter</button>
      </form>

      <p className="mb-2 text-sm text-muted">{rows.length} student{rows.length === 1 ? "" : "s"}{rows.length === 500 ? " (first 500)" : ""}</p>
      <Card className="divide-y divide-border overflow-hidden">
        {rows.map(({ r: s, user }) => (
          <div key={s.enrollmentNo} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
            <div className="min-w-0 flex-1 basis-60">
              <p className="truncate font-semibold">{s.name}</p>
              <p className="text-xs text-muted">{s.enrollmentNo} · {s.mobile ?? "—"}</p>
            </div>
            <Pill tone="primary">{s.programme}</Pill>
            {user?.id ? (
              <div className="flex flex-wrap items-center gap-3">
                <Pill tone={user.isActive ? "accent" : "neutral"}>{user.isActive ? `Joined ${fmtDate(user.createdAt!)}` : "Deactivated"}</Pill>
                <ResetPassword id={user.id} />
                <form action={setStudentActiveAction}>
                  <input type="hidden" name="id" value={user.id} />
                  <input type="hidden" name="active" value={user.isActive ? "0" : "1"} />
                  <button className={clsx("text-xs font-semibold hover:underline", user.isActive ? "text-danger" : "text-success")}>{user.isActive ? "Deactivate" : "Reactivate"}</button>
                </form>
              </div>
            ) : <Pill>Not activated</Pill>}
          </div>
        ))}
        {rows.length === 0 && <p className="p-5 text-sm text-muted">No students match. {total === 0 && <>Upload the roster above to get started.</>}</p>}
      </Card>
      <p className="mt-3 text-xs text-muted"><Link href="/admin/tickets?status=all" className="hover:underline">See all queries →</Link></p>
    </>
  );
}
