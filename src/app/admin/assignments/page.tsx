import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import { sql } from "drizzle-orm";
import { Check, Download, FileText, PenLine, Search, Settings2 } from "lucide-react";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { ASSIGNMENT_STATUSES, statusLabel } from "@/lib/assignment-status";
import { properName } from "@/lib/format";
import { Card, LinkButton, PageHeader, Pill, btnClass } from "@/components/ui";
import { fmtDate, timeAgo } from "@/lib/format";
import { pendingRequests, submissionSettings } from "@/lib/submissions";
import { approveRequestAction } from "@/actions/submissions";
import { RejectRequest } from "@/components/admin/reject-request";
import { AssignmentStatusForm, AssignmentUpload } from "@/components/admin/assignment-forms";

export const metadata = { title: "Assignments" };

export default async function AdminAssignments({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const q = (await searchParams).q?.trim() ?? "";
  const S = schema.assignmentSubmissions;

  const [pending, settings] = await Promise.all([pendingRequests(), submissionSettings()]);
  const [sessions, byStatus, programmes, courses, found] = await Promise.all([
    db.execute<{ session: string; rows: number; students: number; app_students: number }>(sql`
      select s.session, count(*)::int rows, count(distinct s.enrollment_no)::int students,
             count(distinct u.id)::int app_students
      from ${S} s left join users u on u.enrollment_no = s.enrollment_no and u.role = 'student'
      group by s.session order by max(s.created_at) desc`),
    db.execute<{ session: string; status: string; students: number }>(sql`
      select session, status, count(distinct enrollment_no)::int students from ${S} group by session, status`),
    db.execute<{ session: string; programme: string }>(sql`
      select distinct s.session, coalesce(r.programme, s.programme) programme
      from ${S} s left join roster r on r.enrollment_no = s.enrollment_no where coalesce(r.programme, s.programme) is not null order by 2`),
    db.execute<{ session: string; course_code: string }>(sql`select distinct session, course_code from ${S} order by 2`),
    q
      ? db.execute<{ id: number; session: string; receipt_no: string; enrollment_no: string; name: string | null; programme: string | null; courses: number; status: string }>(sql`
          select rc.id, rc.session, rc.receipt_no, rc.enrollment_no, coalesce(r.name, rc.student_name) as name, coalesce(r.programme, max(s.programme)) programme,
                 count(s.id)::int courses, (array_agg(s.status order by array_position(enum_range(null::assignment_status), s.status)))[1]::text status
          from assignment_receipts rc
          join ${S} s on s.session = rc.session and s.enrollment_no = rc.enrollment_no
          left join roster r on r.enrollment_no = rc.enrollment_no
          where rc.enrollment_no ilike ${"%" + q + "%"} or rc.receipt_no ilike ${"%" + q + "%"} or r.name ilike ${"%" + q + "%"} or rc.student_name ilike ${"%" + q + "%"}
          group by rc.id, r.name, r.programme, rc.student_name order by rc.session, rc.receipt_no limit 50`)
      : Promise.resolve({ rows: [] }),
  ]);

  const statusRows = (session: string) => ASSIGNMENT_STATUSES.map((s) => ({ ...s, n: byStatus.rows.find((r) => r.session === session && r.status === s.key)?.students ?? 0 }));
  const leading = (session: string) => statusRows(session).reduce((a, b) => (b.n > a.n ? b : a)).key;

  return (
    <>
      <PageHeader title="Assignments" subtitle="Submission status and receipts for students. Marks are never stored or shown." />

      <div className="mb-5 flex flex-wrap gap-2">
        <LinkButton href="/admin/assignments/new"><PenLine className="size-4" aria-hidden /> Record a submission</LinkButton>
        <LinkButton href="/admin/assignments/settings" variant="secondary"><Settings2 className="size-4" aria-hidden /> Settings &amp; terms</LinkButton>
        <span className="inline-flex items-center gap-2 self-center text-sm text-muted">
          Student submissions: <Pill tone={settings.enabled ? "accent" : "neutral"}>{settings.enabled ? "ON" : "OFF"}</Pill>
        </span>
      </div>

      {pending.rows.length > 0 && (
        <Card className="mb-5 overflow-hidden border-accent/50">
          <div className="border-b border-border bg-accent-soft px-4 py-3 sm:px-6">
            <h2 className="font-bold">Waiting for your approval ({pending.rows.length})</h2>
            <p className="text-sm text-muted">Submitted by students from the app with the PIN. Approve to record them as Received and issue the receipt.</p>
          </div>
          <ul className="divide-y divide-border">
            {pending.rows.map((q) => (
              <li key={q.id} className="space-y-2.5 px-4 py-3.5 sm:px-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="font-semibold">{q.name ? properName(q.name) : "Name not on record"} <span className="text-sm font-normal text-muted">· {q.enrollment_no} · {q.programme ?? "—"}</span></p>
                  <p className="text-xs text-muted">TEE {q.term} · {fmtDate(q.submitted_on)} · {timeAgo(q.created_at)}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">{q.courses.map((c) => <Pill key={c} tone="primary">{c}</Pill>)}</div>
                <div className="flex flex-wrap items-start gap-2">
                  <form action={approveRequestAction}>
                    <input type="hidden" name="id" value={q.id} />
                    <button className={btnClass("primary", "min-h-9 px-3")}><Check className="size-4" aria-hidden /> Approve</button>
                  </form>
                  <RejectRequest id={q.id} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="space-y-4">
        {sessions.rows.length === 0 && <Card className="p-5 text-sm text-muted">No assignment lists uploaded yet. Upload one below.</Card>}
        {sessions.rows.map((s) => (
          <Card key={s.session} className="p-4 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 className="text-lg font-bold">TEE {s.session}</h2>
              <a href={`/admin/assignments/export?term=${encodeURIComponent(s.session)}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                <Download className="size-4" aria-hidden /> Download Excel
              </a>
              <p className="text-xs text-muted">{s.students} students · {s.rows} courses · {s.app_students} on the app</p>
            </div>
            <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {statusRows(s.session).map((r, i) => (
                <li key={r.key} className={`rounded-xl border px-2.5 py-2 ${r.n ? "border-primary/50 bg-primary-soft" : "border-border"}`}>
                  <p className={`text-lg leading-none font-bold tabular-nums ${r.n ? "text-primary" : "text-muted"}`}>{r.n}</p>
                  <p className="mt-1 text-[11px] leading-tight text-muted"><span className="font-semibold">{i + 1}.</span> {r.label}</p>
                </li>
              ))}
            </ul>
            <details className="group mt-4 rounded-xl border border-border" open>
              <summary className="cursor-pointer list-none px-3.5 py-2.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                Change status <span className="font-normal text-muted">— move students to the next step</span>
              </summary>
              <div className="border-t border-border p-3.5">
                <AssignmentStatusForm
                  session={s.session}
                  current={leading(s.session)}
                  programmes={programmes.rows.filter((p) => p.session === s.session).map((p) => p.programme)}
                  courses={courses.rows.filter((c) => c.session === s.session).map((c) => c.course_code)}
                />
              </div>
            </details>
          </Card>
        ))}

        <Card className="overflow-hidden">
          <details open={sessions.rows.length === 0}>
            <summary className="cursor-pointer list-none p-4 font-bold sm:px-6 [&::-webkit-details-marker]:hidden">
              Upload an assignment list <span className="font-normal text-sm text-muted">— new term (June / December) or more submissions</span>
            </summary>
            <div className="border-t border-border p-4 sm:p-6">
              <AssignmentUpload defaultSession={sessions.rows[0]?.session ?? ""} />
            </div>
          </details>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-bold">Find a student&apos;s receipt</h2>
        <SearchForm className="mb-4 flex gap-2" action="/admin/assignments">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input name="q" defaultValue={q} placeholder="Enrolment no., name or receipt no." className="input pl-9" aria-label="Search receipts" />
          </div>
          <button className="rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface-2">Search</button>
        </SearchForm>
        {q && (
          <Card className="divide-y divide-border overflow-hidden">
            {found.rows.length === 0 && <p className="p-5 text-sm text-muted">No receipts match “{q}”.</p>}
            {found.rows.map((r) => (
              <Link key={r.id} href={`/receipt/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface-2">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="truncate font-semibold">{r.name ? properName(r.name) : <span className="font-medium text-muted italic">Not on the student list yet</span>}</p>
                  <p className="text-xs text-muted">{r.enrollment_no} · {r.programme ?? "—"} · TEE {r.session} · {r.courses} courses</p>
                </div>
                <Pill tone="primary">{statusLabel(r.status)}</Pill>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><FileText className="size-4" aria-hidden /> {r.receipt_no}</span>
              </Link>
            ))}
          </Card>
        )}
      </section>
    </>
  );
}
