import Link from "next/link";
import { RegisterForm } from "./form";

export const metadata = { title: "Activate account" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Activate your account</h1>
      <p className="mt-1 text-sm text-muted">
        For students admitted to IGNOU Study Centre 0920. We match your details with the centre&apos;s admission list, so
        your name, programme and courses are filled in for you.
      </p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted">
        Already activated?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
