import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getProgrammes } from "@/lib/programmes";
import { allCourseCodes, courseCatalog, listTerms } from "@/lib/submissions";
import { Card, PageHeader } from "@/components/ui";
import { RecordSubmissionForm } from "@/components/admin/record-submission";

export const metadata = { title: "Record submission" };

export default async function RecordSubmissionPage() {
  await requireAdmin();
  const [terms, programmes, byProg, allCourses, catalog] = await Promise.all([
    listTerms(),
    getProgrammes(),
    db.execute<{ p: string; c: string; t: string | null }>(sql`
      select p, c, min(t) t from (
        select programme p, course_code c, coalesce(term, 'zz') t from programme_courses
        union all
        select coalesce(r.programme, s.programme) p, s.course_code c, 'zz' t
        from assignment_submissions s left join roster r on r.enrollment_no = s.enrollment_no
      ) x where p is not null group by 1, 2 order by 1, 3, 2`),
    allCourseCodes(),
    courseCatalog(),
  ]);
  const suggestionsByProgramme: Record<string, string[]> = {};
  const termsByProgramme: Record<string, Record<string, string>> = {};
  for (const r of byProg.rows) {
    (suggestionsByProgramme[r.p] ??= []).push(r.c);
    if (r.t && r.t !== "zz") (termsByProgramme[r.p] ??= {})[r.c] = r.t;
  }
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
            programmes={programmes} suggestionsByProgramme={suggestionsByProgramme} termsByProgramme={termsByProgramme} titles={catalog.titles} allCourses={allCourses} />
        ) : (
          <p className="text-sm text-muted">Add a term first in <Link href="/admin/assignments/settings" className="font-semibold text-primary">Submission settings</Link>.</p>
        )}
      </Card>
    </div>
  );
}
