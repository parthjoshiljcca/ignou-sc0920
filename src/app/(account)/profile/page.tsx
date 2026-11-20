import { requireUser } from "@/lib/auth";
import { Card, PageHeader, Pill } from "@/components/ui";
import { PushToggle } from "@/components/pwa";
import { PasswordForm, ProfileForm } from "./forms";
import { logoutAction } from "@/actions/auth";

export const metadata = { title: "Profile" };

export default async function Profile() {
  const u = await requireUser();
  const student = u.role === "student";
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={student ? "My profile" : "My account"} />
      {student && (
        <Card className="p-4 sm:p-5">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-muted">Enrolment no.</dt><dd className="font-semibold">{u.enrollmentNo}</dd></div>
            <div><dt className="text-muted">Programme</dt><dd className="font-semibold">{u.programme}</dd></div>
          </dl>
          {u.courses.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-sm text-muted">Courses</p>
              <div className="flex flex-wrap gap-1.5">{u.courses.map((c) => <Pill key={c}>{c}</Pill>)}</div>
            </div>
          )}
          <p className="mt-4 text-xs text-muted">Programme and courses come from the admission records. If something is wrong, raise a query.</p>
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
