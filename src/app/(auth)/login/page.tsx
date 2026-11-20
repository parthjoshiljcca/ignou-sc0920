import Link from "next/link";
import { LoginForm } from "./form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Sign in with your email or enrollment number.</p>
      <LoginForm next={next ?? ""} />
      <p className="mt-6 text-center text-sm text-muted">
        First time here?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Activate your account
        </Link>
      </p>
    </>
  );
}
