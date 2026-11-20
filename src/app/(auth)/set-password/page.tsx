import { requireUser } from "@/lib/auth";
import { properName } from "@/lib/format";
import { anyMissing, missingProfileFields } from "@/lib/profile";
import { SetPasswordForm } from "./form";

export const metadata = { title: "Set your password" };
export const dynamic = "force-dynamic";

export default async function SetPasswordPage() {
  const u = await requireUser();
  const need = u.role === "student" ? await missingProfileFields(u.enrollmentNo) : { name: false, address: false, email: false };
  const greeting = need.name ? "Welcome!" : `Welcome, ${properName(u.name)}!`;
  return (
    <>
      <p className="text-sm font-semibold text-accent">Step 2 of 2</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">{greeting}</h1>
      <p className="mt-1 text-sm text-muted">
        {anyMissing(need)
          ? "Some of your details are missing from the study centre's records. Please fill them in and create your own password — this is required once."
          : "You signed in with your mobile number. Create your own password to keep your account safe. You'll use it from now on."}
      </p>
      {u.role === "student" && (
        <div className="mt-4 rounded-xl border border-border bg-surface p-3 text-sm">
          <p><span className="text-muted">Enrolment no.</span> <b>{u.enrollmentNo}</b></p>
          <p><span className="text-muted">Programme</span> <b>{u.programme}</b></p>
        </div>
      )}
      <SetPasswordForm need={need} />
    </>
  );
}
