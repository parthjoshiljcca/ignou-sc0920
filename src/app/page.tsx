import { CalendarDays, LifeBuoy, Megaphone, Smartphone } from "lucide-react";
import { Logo } from "@/components/logo";
import { LinkButton } from "@/components/ui";
import { CENTRE } from "@/lib/constants";

const features = [
  { icon: LifeBuoy, title: "Help Desk", body: "Raise a query about admission, assignments, exams or results and get a reply from the coordinator." },
  { icon: CalendarDays, title: "Counselling schedule", body: "See upcoming classes for your programme with time, venue or online link." },
  { icon: Megaphone, title: "Notices", body: "Important dates and announcements from the study centre, in one place." },
  { icon: Smartphone, title: "Works like an app", body: "Install it on your phone's home screen and get instant alerts." },
];

export default function Landing() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
        <Logo className="size-10" />
        <span className="flex-1 font-bold">{CENTRE.name}</span>
        <LinkButton href="/login" variant="ghost">Sign in</LinkButton>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <section className="py-10 sm:py-16">
          <p className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">Indira Gandhi National Open University</p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl">
            Everything you need from Study Centre {CENTRE.code}.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Ask questions, track replies, check your counselling timetable and never miss a notice.
          </p>
          <p className="mt-6 max-w-xl rounded-xl bg-surface p-3.5 text-sm text-muted ring-1 ring-border">
            <b className="text-text">First time?</b> Sign in with your enrolment number, and your registered mobile number as the password.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href="/login" className="min-h-12 px-6 text-base">Student sign in</LinkButton>
            
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-3 grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <f.icon className="size-5" aria-hidden />
              </div>
              <p className="font-semibold">{f.title}</p>
              <p className="mt-1 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
