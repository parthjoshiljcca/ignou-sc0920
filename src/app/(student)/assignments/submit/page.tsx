import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db, schema } from "@/db";
import { requireStudent } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { acceptingTerms, courseSuggestions, submissionSettings } from "@/lib/submissions";
import { Card, PageHeader } from "@/components/ui";
import { StudentSubmitForm } from "@/components/student-submit-form";

export const metadata = { title: "Submit assignments" };

export default async function SubmitAssignments() {
  const u = await requireStudent();
  const [settings, terms] = await Promise.all([submissionSettings(), acceptingTerms()]);
  if (!settings.enabled || !terms.length || !u.enrollmentNo) redirect("/assignments");
  const names = terms.map((t) => t.name);
  const [done, pending, suggestions] = await Promise.all([
    db.select({ t: schema.assignmentSubmissions.session, c: schema.assignmentSubmissions.courseCode }).from(schema.assignmentSubmissions)
      .where(and(eq(schema.assignmentSubmissions.enrollmentNo, u.enrollmentNo), inArray(schema.assignmentSubmissions.session, names))),
    db.select({ t: schema.assignmentRequests.term, cs: schema.assignmentRequests.courses }).from(schema.assignmentRequests)
      .where(and(eq(schema.assignmentRequests.enrollmentNo, u.enrollmentNo), eq(schema.assignmentRequests.status, "pending"))),
    courseSuggestions(u.programme),
  ]);
  const alreadyByTerm: Record<string, string[]> = {};
  done.forEach((r) => (alreadyByTerm[r.t] ??= []).push(r.c));
  pending.forEach((r) => (alreadyByTerm[r.t] ??= []).push(...r.cs));
  const today = fmtDate(new Date());
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/assignments" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text"><ArrowLeft className="size-4" aria-hidden /> My assignments</Link>
      <PageHeader title="Submit assignments" subtitle={`Record the assignments you handed in at Study Centre 0920. ${u.programme ? `Programme: ${u.programme}.` : ""}`} />
      <Card className="p-4 sm:p-6">
        <StudentSubmitForm terms={names} alreadyByTerm={alreadyByTerm} suggestions={suggestions} today={today} />
      </Card>
    </div>
  );
}
