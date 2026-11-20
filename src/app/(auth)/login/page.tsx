import { Info } from "lucide-react";
import { LoginForm } from "./form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted">Students of IGNOU Study Centre 0920.</p>
      <div className="mt-5 flex gap-3 rounded-xl bg-info-soft p-3.5 text-sm text-info">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          <b>First time?</b> Use your <b>enrolment number</b> and, as password, the <b>mobile number</b> you gave in your
          IGNOU admission form. You&apos;ll then create your own password.
        </p>
      </div>
      <LoginForm next={next ?? ""} />
    </>
  );
}
