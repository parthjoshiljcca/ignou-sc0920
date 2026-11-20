import { WifiOff } from "lucide-react";

export const dynamic = "force-static";
export const metadata = { title: "Offline" };

export default function Offline() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
          <WifiOff className="size-7" aria-hidden />
        </div>
        <h1 className="text-xl font-bold">You&apos;re offline</h1>
        <p className="mt-2 max-w-xs text-sm text-muted">Check your internet connection. The page will load as soon as you&apos;re back online.</p>
        <a href="/dashboard" className="mt-5 inline-flex min-h-10 items-center rounded-[10px] bg-primary px-4 text-sm font-semibold text-on-primary">
          Try again
        </a>
      </div>
    </main>
  );
}
