import Link from "next/link";
import { Logo } from "@/components/logo";
import { CENTRE } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-primary p-12 text-white lg:flex lg:flex-col" style={{ background: "#1f3c88" }}>
        <Link href="/" className="flex items-center gap-3">
          <Logo className="size-11" />
          <span className="text-lg font-bold">{CENTRE.name}</span>
        </Link>
        <div className="mt-auto max-w-md">
          <p className="text-4xl leading-tight font-bold tracking-tight">Your study centre, in your pocket.</p>
          <ul className="mt-6 space-y-3 text-white/85">
            <li>• Ask the coordinator anything and track the reply</li>
            <li>• Counselling class schedule for your programme</li>
            <li>• Notices and deadline alerts on your phone</li>
          </ul>
        </div>
        <div aria-hidden className="absolute -top-24 -right-24 size-80 rounded-full" style={{ background: "#e8890c", opacity: 0.18 }} />
      </section>
      <main className="flex min-h-dvh flex-col px-4 py-8 sm:px-8 lg:justify-center">
        <Link href="/" className="mb-8 flex items-center gap-3 lg:hidden">
          <Logo className="size-10" />
          <span className="font-bold">{CENTRE.name}</span>
        </Link>
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
