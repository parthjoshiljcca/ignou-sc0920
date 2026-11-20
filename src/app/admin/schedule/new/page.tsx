import { requireAdmin } from "@/lib/auth";
import { getCourseCodes, getProgrammes } from "@/lib/programmes";
import { Card, PageHeader } from "@/components/ui";
import { SessionForm } from "@/components/admin/session-form";

export const metadata = { title: "Add class" };

export default async function NewSession() {
  await requireAdmin();
  const [programmes, courses] = await Promise.all([getProgrammes(), getCourseCodes()]);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add counselling class" subtitle="All times are IST." />
      <Card className="p-4 sm:p-6"><SessionForm d={{}} programmes={programmes} courses={courses} /></Card>
    </div>
  );
}
