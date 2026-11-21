import Link from "next/link";
import { Credit, FullLogo } from "@/components/logo";
import { CENTRE } from "@/lib/constants";
import { WarmUp } from "@/components/pwa";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1fr_1.1fr]">
      <WarmUp />
      <section className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col" style={{ background: "#0066b2" }}>
        <Link href="/" className="relative z-10 flex flex-col items-start gap-4">
          <FullLogo className="h-20" />
          <span className="text-lg font-bold">Study Centre {CENTRE.code}</span>
        </Link>
        <div className="mt-auto max-w-md">
          <p className="text-4xl leading-tight font-bold tracking-tight">Your study centre, in your pocket.</p>
          <ul className="mt-6 space-y-3 text-white/85">
            <li>• Ask the coordinator anything and track the reply</li>
            <li>• Counselling class schedule for your programme</li>
            <li>• Notices and deadline alerts on your phone</li>
          </ul>
        </div>
        <p className="mt-10 text-xs text-white/70">
          <Link href="/about" className="font-semibold text-white hover:underline">About this app</Link> · Design &amp; Developed by: Parth D. Joshi
        </p>
        <div aria-hidden className="absolute -top-24 -right-24 size-80 rounded-full" style={{ background: "#ffffff", opacity: 0.08 }} />
      </section>
      <main className="flex min-h-dvh flex-col px-4 py-8 sm:px-8 lg:justify-center">
        <Link href="/" className="mb-8 flex flex-col items-start gap-2 lg:hidden">
          <FullLogo className="h-16 px-3 py-2" />
          <span className="text-sm font-semibold text-muted">Study Centre {CENTRE.code}</span>
        </Link>
        <div className="mx-auto w-full max-w-md">{children}</div>
        <p className="mx-auto mt-10 text-center text-sm lg:hidden"><Link href="/about" className="font-medium text-primary hover:underline">About this app</Link></p>
        <Credit className="mx-auto mt-1 text-center lg:hidden" />
      </main>
    </div>
  );
}
