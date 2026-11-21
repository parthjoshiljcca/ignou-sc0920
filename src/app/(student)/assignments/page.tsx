import Link from "next/link";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { acceptingTerms, submissionSettings } from "@/lib/submissions";
import { cancelRequestAction } from "@/actions/submissions";
import { Alert, btnClass } from "@/components/ui";
import { Hourglass, Send } from "lucide-react";
import { ClipboardCheck, FileText } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { studentAssignments } from "@/lib/assignment-data";
import { overallStatus, statusDetail, statusLabel } from "@/lib/assignment-status";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { Card, EmptyState, LinkButton, PageHeader, Pill } from "@/components/ui";
import { AssignmentStepper } from "@/components/assignment-stepper";

export const metadata = { title: "Assignments" };

export default async function Assignments({ searchParams }: { searchParams: Promise<{ requested?: string }> }) {
  const u = await requireStudent();
  const { requested } = await searchParams;
  const [sessions, settings, open, requests] = await Promise.all([
    u.enrollmentNo ? studentAssignments(u.enrollmentNo) : Promise.resolve([]),
    submissionSettings(),
    acceptingTerms(),
    u.enrollmentNo
      ? db.select().from(schema.assignmentRequests)
          .where(and(eq(schema.assignmentRequests.enrollmentNo, u.enrollmentNo), inArray(schema.assignmentRequests.status, ["pending", "rejected"]),
            gte(schema.assignmentRequests.createdAt, new Date(Date.now() - 30 * 864e5))))
          .orderBy(desc(schema.assignmentRequests.createdAt))
      : Promise.resolve([]),
  ]);
  const canSubmit = settings.enabled && open.length > 0;

  return (
    <>
      <PageHeader
        title="My assignments"
        subtitle="Track your submitted assignments and download the receipt. Marks are not shown here."
        action={canSubmit ? <LinkButton href="/assignments/submit"><Send className="size-4" aria-hidden /> Submit assignments</LinkButton> : undefined}
      />
      {requested && <div className="mb-4"><Alert tone="success">Sent for approval. You&apos;ll get a notification when the coordinator approves it.</Alert></div>}
      {requests.length > 0 && (
        <div className="mb-5 space-y-3">
          {requests.map((q) => (
            <Card key={q.id} className={q.status === "pending" ? "border-warning/50 p-4" : "border-danger/40 p-4"}>
              <div className="flex items-start gap-3">
                <Hourglass className={`mt-0.5 size-5 shrink-0 ${q.status === "pending" ? "text-warning" : "text-danger"}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{q.status === "pending" ? "Submitted — waiting for coordinator approval" : "Not approved"}</p>
                  <p className="text-sm text-muted">TEE {q.term} · {fmtDate(q.submittedOn)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{q.courses.map((c) => <Pill key={c}>{c}</Pill>)}</div>
                  {q.status === "rejected" && q.note && <p className="mt-2 text-sm">Reason: {q.note}</p>}
                </div>
                {q.status === "pending" && (
                  <form action={cancelRequestAction}>
                    <input type="hidden" name="id" value={q.id} />
                    <button className={btnClass("ghost", "min-h-8 px-2 text-xs")}>Cancel</button>
                  </form>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {sessions.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="size-6" />}
          title="No assignment submissions yet"
          body="Once the study centre records your submitted assignments, they'll appear here with their status and a receipt."
          action={canSubmit ? <LinkButton href="/assignments/submit"><Send className="size-4" aria-hidden /> Submit assignments</LinkButton> : <LinkButton href="/tickets/new" variant="secondary">Submitted but not listed? Ask us</LinkButton>}
        />
      ) : (
        <div className="space-y-5">
          {sessions.map(({ receipt, rows }) => {
            const overall = overallStatus(rows.map((r) => r.status));
            return (
              <Card key={receipt.id} className="overflow-hidden">
                <div className="flex items-start gap-3 p-4 sm:p-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold tracking-wide text-muted uppercase">Term-End Exam</p>
                    <h2 className="text-lg leading-tight font-bold">{receipt.session}</h2>
                    <p className="mt-0.5 truncate text-xs text-muted">Receipt {receipt.receiptNo}</p>
                  </div>
                  <LinkButton href={`/receipt/${receipt.id}`} className="min-h-9 shrink-0 px-3"><FileText className="size-4" aria-hidden /> Receipt</LinkButton>
                </div>

                <div className="border-y border-border bg-primary-soft/60 px-4 py-4 sm:px-5">
                  <p className="text-sm">
                    <span className="text-muted">Current status</span>
                    <span className="mt-0.5 block text-base font-bold text-primary">{statusLabel(overall)}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted">{statusDetail(overall)}</p>
                  <div className="mt-4"><AssignmentStepper status={overall} /></div>
                </div>

                <div className="p-4 sm:p-5">
                  <h3 className="mb-2.5 text-sm font-semibold">{rows.length} course{rows.length === 1 ? "" : "s"} submitted</h3>
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {rows.map((r) => (
                      <li key={r.id} className="rounded-xl border border-border bg-bg/40 px-3 py-2">
                        <p className="font-semibold whitespace-nowrap">{r.courseCode}</p>
                        <p className="text-xs text-muted">{r.submittedAt ? fmtDateTime(r.submittedAt) : fmtDate(r.submittedOn)}</p>
                        {r.status !== overall && <div className="mt-1"><Pill tone="primary">{statusLabel(r.status)}</Pill></div>}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-muted">Course missing? <Link href="/tickets/new" className="font-semibold text-primary hover:underline">Raise a query</Link> with the course code and date.</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
