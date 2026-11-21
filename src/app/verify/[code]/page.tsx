import { BadgeCheck, CircleX } from "lucide-react";
import { receiptByVerifyCode } from "@/lib/assignment-data";
import { overallStatus, statusLabel } from "@/lib/assignment-status";
import { fmtDate, properName } from "@/lib/format";
import { FullLogo } from "@/components/logo";

export const metadata = { title: "Verify receipt", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Public check that an assignment receipt is genuine. Shows minimal details only. */
export default async function Verify({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code;
  const data = /^[A-Za-z0-9_-]{8,24}$/.test(code) ? await receiptByVerifyCode(code) : null;
  const mask = (e: string) => e.slice(0, 4) + "••••" + e.slice(-2);
  const initials = (n: string | null) => (n ? properName(n).split(" ").map((w) => w[0]).join(".") + "." : "—");

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-8">
      <FullLogo className="h-14 px-3 py-2" />
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Receipt verification</h1>
      <p className="text-sm text-muted">IGNOU Study Centre 0920 · Assignment submission receipts</p>
      {data ? (
        <div className="mt-5 rounded-2xl border border-success/40 bg-success-soft p-5">
          <p className="flex items-center gap-2 text-lg font-bold text-success"><BadgeCheck className="size-6" aria-hidden /> Genuine receipt</p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted">Receipt No.</dt><dd className="font-semibold">{data.receipt.receiptNo}</dd>
            <dt className="text-muted">Session</dt><dd className="font-semibold">{data.receipt.session}</dd>
            <dt className="text-muted">Student</dt><dd className="font-semibold">{initials(data.student.name)} · {mask(data.student.enrollmentNo)}</dd>
            <dt className="text-muted">Courses</dt><dd className="font-semibold">{data.rows.map((r) => r.courseCode).join(", ")}</dd>
            <dt className="text-muted">Submitted</dt><dd className="font-semibold">{data.rows.length ? `${fmtDate(data.rows[0].submittedOn)}${data.rows.length > 1 && data.rows.at(-1)!.submittedOn !== data.rows[0].submittedOn ? ` – ${fmtDate(data.rows.at(-1)!.submittedOn)}` : ""}` : "—"}</dd>
            <dt className="text-muted">Current status</dt><dd className="font-semibold">{statusLabel(overallStatus(data.rows.map((r) => r.status)))}</dd>
          </dl>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-danger/40 bg-danger-soft p-5">
          <p className="flex items-center gap-2 text-lg font-bold text-danger"><CircleX className="size-6" aria-hidden /> Receipt not found</p>
          <p className="mt-1 text-sm">This receipt could not be verified. Please contact sc0920@ignou.ac.in.</p>
        </div>
      )}
      <p className="mt-8 text-center text-xs text-muted">Design &amp; Developed by: Parth D. Joshi</p>
    </main>
  );
}
