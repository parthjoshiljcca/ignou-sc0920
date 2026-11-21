/* eslint-disable @next/next/no-img-element */
import { fmtDate, fmtDateTime, properName } from "@/lib/format";
import { ASSIGNMENT_STATUSES, overallStatus, statusIndex, statusLabel } from "@/lib/assignment-status";
import type { ReceiptData } from "@/lib/assignment-data";

/**
 * Printable acknowledgement of assignment submission (A4 / phone). Uses fixed light colours so it
 * prints the same in dark mode. Marks are never shown — they are not stored.
 */
export function AssignmentReceipt({ data, verifyUrl, qr }: { data: ReceiptData; verifyUrl: string; qr: string }) {
  const { receipt, rows, student } = data;
  const overall = overallStatus(rows.map((r) => r.status));
  const lastUpdate = rows.reduce((d, r) => (r.statusUpdatedAt > d ? r.statusUpdatedAt : d), rows[0]?.statusUpdatedAt ?? receipt.createdAt);
  const cur = statusIndex(overall);
  return (
    <article className="receipt mx-auto w-full max-w-[780px] rounded-2xl border border-[#d9dee8] bg-white p-5 text-[#111827] sm:p-8" style={{ colorScheme: "light" }}>
      <header className="flex flex-wrap items-center gap-4 border-b-2 border-[#0066b2] pb-4">
        <img src="/brand/ignou-logo.png" alt="IGNOU – The People's University" className="h-14 w-auto" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">IGNOU Study Centre 0920</p>
          <p className="text-sm text-[#4b5563]">Regional Centre Ahmedabad</p>
        </div>
      </header>

      <h1 className="mt-5 text-center text-xl font-bold tracking-tight sm:text-2xl">Assignment Submission Receipt</h1>
      <p className="text-center text-sm text-[#4b5563]">For Term-End Examination: <b className="text-[#111827]">{receipt.session}</b></p>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-[#4b5563]">Receipt No.</dt><dd className="font-bold">{receipt.receiptNo}</dd>
          <dt className="text-[#4b5563]">Name</dt><dd className="font-semibold">{student.name ? properName(student.name) : "—"}</dd>
          <dt className="text-[#4b5563]">Enrolment No.</dt><dd className="font-semibold">{student.enrollmentNo}</dd>
          <dt className="text-[#4b5563]">Programme</dt><dd className="font-semibold">{student.programme ?? "—"}</dd>
          <dt className="text-[#4b5563]">Courses submitted</dt><dd className="font-semibold">{rows.length}</dd>
        </dl>
        <div className="flex flex-col items-center gap-1 sm:items-end">
          <div className="size-24 rounded-lg border border-[#d9dee8] bg-white p-1.5" dangerouslySetInnerHTML={{ __html: qr }} aria-label="QR code to verify this receipt" role="img" />
          <p className="text-[10px] text-[#6b7280]">Scan to verify</p>
        </div>
      </div>

      <table className="mt-5 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#eef4fb] text-left">
            <th className="border border-[#d9dee8] px-2 py-1.5 font-semibold">#</th>
            <th className="border border-[#d9dee8] px-2 py-1.5 font-semibold">Course code</th>
            <th className="border border-[#d9dee8] px-2 py-1.5 font-semibold">Submitted on</th>
            <th className="border border-[#d9dee8] px-2 py-1.5 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id}>
              <td className="border border-[#d9dee8] px-2 py-1.5">{i + 1}</td>
              <td className="border border-[#d9dee8] px-2 py-1.5 font-semibold">{r.courseCode}</td>
              <td className="border border-[#d9dee8] px-2 py-1.5">{fmtDate(r.submittedOn)}</td>
              <td className="border border-[#d9dee8] px-2 py-1.5">{statusLabel(r.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-5 rounded-xl border border-[#d9dee8] p-3">
        <p className="text-sm"><span className="text-[#4b5563]">Current status:</span> <b className="text-[#0066b2]">{statusLabel(overall)}</b> <span className="text-[#6b7280]">(updated {fmtDate(lastUpdate)})</span></p>
        <ol className="mt-2 flex flex-wrap gap-x-1 gap-y-1 text-[11px]">
          {ASSIGNMENT_STATUSES.map((s, i) => (
            <li key={s.key} className={i <= cur ? "font-semibold text-[#0066b2]" : "text-[#9ca3af]"}>
              {i <= cur ? "✓" : "○"} {s.label}{i < ASSIGNMENT_STATUSES.length - 1 ? " →" : ""}
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-5 space-y-1 border-t border-[#d9dee8] pt-3 text-[11px] leading-relaxed text-[#6b7280]">
        <p>This is a computer-generated acknowledgement issued by IGNOU Study Centre 0920 and does not need a signature. It confirms receipt of the assignments listed above; it is not a mark sheet. Marks are not shown here — they appear in your grade card on the IGNOU website after IGNOU updates them.</p>
        <p>Verify this receipt: <span className="break-all text-[#0066b2]">{verifyUrl}</span></p>
        <p>Generated on {fmtDateTime(new Date())} · Design &amp; Developed by: Parth D. Joshi</p>
      </footer>
    </article>
  );
}
