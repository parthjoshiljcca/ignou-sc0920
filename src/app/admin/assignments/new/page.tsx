import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getProgrammes } from "@/lib/programmes";
import { listTerms } from "@/lib/submissions";
import { Card, PageHeader } from "@/components/ui";
import { RecordSubmissionForm } from "@/components/admin/record-submission";

export const metadata = { title: "Record submission" };

export default async function RecordSubmissionPage() {
  await requireAdmin();
  const [terms, programmes, byProg] = await Promise.all([
    listTerms(),
    getProgrammes(),
    db.execute<{ p: string; c: string; n: number }>(sql`
      select coalesce(r.programme, s.programme) p, s.course_code c, count(*)::int n
      from assignment_submissions s left join roster r on r.enrollment_no = s.enrollment_no
      group by 1, 2 order by 1, 3 desc, 2`),
  ]);
  const suggestionsByProgramme: Record<string, string[]> = {};
  for (const r of byProg.rows) (suggestionsByProgramme[r.p] ??= []).push(r.c);
  const totals = new Map<string, number>();
  for (const r of byProg.rows) totals.set(r.c, (totals.get(r.c) ?? 0) + r.n);
  const allCourses = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const open = terms.filter((t) => t.accepting);
  const defaultTerm = (open.sort((a, b) => a.sortKey - b.sortKey)[0] ?? terms[0])?.name ?? "";
  const today = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/assignments" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text"><ArrowLeft className="size-4" aria-hidden /> Assignments</Link>
      <PageHeader title="Record a submission" subtitle="For a student handing in assignments at the centre. A receipt is created straight away with status “Received”." />
      <Card className="p-4 sm:p-6">
        {terms.length ? (
          <RecordSubmissionForm terms={terms.map((t) => ({ name: t.name, accepting: t.accepting }))} defaultTerm={defaultTerm} today={today}
            programmes={programmes} suggestionsByProgramme={suggestionsByProgramme} allCourses={allCourses} />
        ) : (
          <p className="text-sm text-muted">Add a term first in <Link href="/admin/assignments/settings" className="font-semibold text-primary">Submission settings</Link>.</p>
        )}
      </Card>
    </div>
  );
}
