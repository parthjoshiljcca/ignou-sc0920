import Link from "next/link";
import { ClipboardCheck, FileText } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { studentAssignments } from "@/lib/assignment-data";
import { overallStatus, statusDetail, statusLabel } from "@/lib/assignment-status";
import { fmtDate } from "@/lib/format";
import { Card, EmptyState, LinkButton, PageHeader, Pill } from "@/components/ui";
import { AssignmentStepper } from "@/components/assignment-stepper";

export const metadata = { title: "Assignments" };

export default async function Assignments() {
  const u = await requireStudent();
  const sessions = u.enrollmentNo ? await studentAssignments(u.enrollmentNo) : [];

  return (
    <>
      <PageHeader title="My assignments" subtitle="Submission status of your assignments at Study Centre 0920. Marks are not shown here — they appear in your IGNOU grade card." />
      {sessions.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="size-6" />}
          title="No assignment submissions yet"
          body="Once the study centre records your submitted assignments, they'll appear here with their status and a receipt."
          action={<LinkButton href="/tickets/new" variant="secondary">Submitted but not listed? Ask us</LinkButton>}
        />
      ) : (
        <div className="space-y-6">
          {sessions.map(({ receipt, rows }) => {
            const overall = overallStatus(rows.map((r) => r.status));
            return (
              <Card key={receipt.id} className="p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-muted uppercase">Assignment session</p>
                    <h2 className="text-lg font-bold">{receipt.session}</h2>
                    <p className="text-sm text-muted">Receipt {receipt.receiptNo} · {rows.length} course{rows.length === 1 ? "" : "s"}</p>
                  </div>
                  <LinkButton href={`/receipt/${receipt.id}`}><FileText className="size-4" aria-hidden /> Receipt</LinkButton>
                </div>

                <div className="mt-5 rounded-xl bg-primary-soft p-3.5">
                  <p className="text-sm">Current status: <b className="text-primary">{statusLabel(overall)}</b></p>
                  <p className="mt-0.5 text-sm text-muted">{statusDetail(overall)}</p>
                </div>
                <div className="mt-5"><AssignmentStepper status={overall} /></div>

                <h3 className="mt-6 mb-2 text-sm font-semibold text-muted">Courses</h3>
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {rows.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 px-3.5 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold whitespace-nowrap">{r.courseCode}</p>
                        <p className="text-xs text-muted">Submitted {fmtDate(r.submittedOn)}</p>
                      </div>
                      <Pill tone={r.status === overall ? "primary" : "neutral"}>{statusLabel(r.status)}</Pill>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted">A course missing from this list? <Link href="/tickets/new" className="font-semibold text-primary hover:underline">Raise a query</Link> with the course code and submission date.</p>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
