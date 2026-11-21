import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { listTerms, submissionSettings } from "@/lib/submissions";
import { toggleTermAction } from "@/actions/submissions";
import { Card, PageHeader, Pill, btnClass } from "@/components/ui";
import { AddTermForm, SubmissionSettingsForm } from "@/components/admin/submission-settings";

export const metadata = { title: "Submission settings" };

export default async function SubmissionSettingsPage() {
  await requireAdmin();
  const [s, terms, counts] = await Promise.all([
    submissionSettings(),
    listTerms(),
    db.execute<{ session: string; n: number }>(sql`select session, count(distinct enrollment_no)::int n from assignment_submissions group by session`),
  ]);
  const count = (t: string) => counts.rows.find((r) => r.session === t)?.n ?? 0;
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/assignments" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text"><ArrowLeft className="size-4" aria-hidden /> Assignments</Link>
      <PageHeader title="Submission settings" subtitle="Control whether students can submit from the app, the PIN, and which terms are open." />
      <div className="space-y-5">
        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="font-bold">Student submissions</h2>
            <Pill tone={s.enabled ? "accent" : "neutral"}>{s.enabled ? "ON" : "OFF"}</Pill>
          </div>
          <SubmissionSettingsForm switchOn={s.switchOn} pin={s.pin} />
        </Card>
        <Card className="p-4 sm:p-6">
          <h2 className="mb-1 font-bold">Terms</h2>
          <p className="mb-4 text-sm text-muted">Only open terms can be chosen for new submissions. Closing a term keeps its receipts and status.</p>
          <ul className="mb-5 divide-y divide-border overflow-hidden rounded-xl border border-border">
            {terms.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-3.5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">TEE {t.name}</p>
                  <p className="text-xs text-muted">{count(t.name)} students recorded</p>
                </div>
                <Pill tone={t.accepting ? "accent" : "neutral"}>{t.accepting ? "Open" : "Closed"}</Pill>
                <form action={toggleTermAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <button className={btnClass("secondary", "min-h-9 px-3")}>{t.accepting ? "Close" : "Open"}</button>
                </form>
              </li>
            ))}
          </ul>
          <h3 className="mb-2 text-sm font-semibold">Add a term</h3>
          <AddTermForm />
        </Card>
      </div>
    </div>
  );
}
