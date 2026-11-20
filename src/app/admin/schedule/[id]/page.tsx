import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { dateToIstInput } from "@/lib/format";
import { getCourseCodes, getProgrammes } from "@/lib/programmes";
import { Card, PageHeader } from "@/components/ui";
import { SessionForm } from "@/components/admin/session-form";

export const metadata = { title: "Edit class" };

export default async function EditSession({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [s] = await db.select().from(schema.counsellingSessions).where(eq(schema.counsellingSessions.id, id));
  if (!s) notFound();
  const [programmes, courses] = await Promise.all([getProgrammes(), getCourseCodes()]);
  const start = dateToIstInput(s.startsAt);
  const end = dateToIstInput(s.endsAt);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Edit ${s.courseCode} class`} subtitle="All times are IST." />
      <Card className="p-4 sm:p-6">
        <SessionForm programmes={programmes} courses={courses}
          d={{ ...s, date: start.slice(0, 10), start: start.slice(11, 16), end: end.slice(11, 16) }} />
      </Card>
    </div>
  );
}
