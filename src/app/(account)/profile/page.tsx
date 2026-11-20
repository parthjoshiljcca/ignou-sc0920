import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { PushToggle } from "@/components/pwa";
import { PasswordForm, ProfileForm } from "./forms";
import { logoutAction } from "@/actions/auth";

export const metadata = { title: "Profile" };

export default async function Profile() {
  const u = await requireUser();
  const student = u.role === "student";
  const [roster] = student && u.enrollmentNo
    ? await db.select().from(schema.roster).where(eq(schema.roster.enrollmentNo, u.enrollmentNo))
    : [];
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={student ? "My profile" : "My account"} />
      {student && (
        <Card className="p-4 sm:p-5">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-muted">Enrolment no.</dt><dd className="font-semibold">{u.enrollmentNo}</dd></div>
            <div><dt className="text-muted">Programme</dt><dd className="font-semibold">{u.programme}</dd></div>
            {roster?.admissionYear && <div><dt className="text-muted">Year of enrolment</dt><dd className="font-semibold">{roster.admissionYear}</dd></div>}
            {roster?.address && <div className="col-span-2"><dt className="text-muted">Address</dt><dd className="font-semibold">{roster.address}</dd></div>}
          </dl>
          <p className="mt-4 text-xs text-muted">These details come from the admission records. If something is wrong, raise a query.</p>
        </Card>
      )}
      <Card className="p-4 sm:p-5">
        <h2 className="mb-4 font-bold">Contact details</h2>
        <ProfileForm name={u.name} phone={u.phone ?? ""} email={u.email} />
      </Card>
      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 font-bold">Notifications</h2>
        <PushToggle />
      </Card>
      <Card className="p-4 sm:p-5">
        <h2 className="mb-4 font-bold">Change password</h2>
        <PasswordForm />
      </Card>
      <form action={logoutAction} className="lg:hidden">
        <button className="w-full rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-danger">Sign out</button>
      </form>
    </div>
  );
}
