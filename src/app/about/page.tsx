import Link from "next/link";
import { ArrowLeft, Bell, CalendarDays, CircleHelp, LifeBuoy, Lock, Mail, Megaphone, ShieldCheck, Smartphone } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { CENTRE } from "@/lib/constants";
import { Card } from "@/components/ui";
import { Credit, FullLogo } from "@/components/logo";

export const metadata = {
  title: "About",
  description: "About the IGNOU Study Centre 0920 student app — built only for students of Study Centre 0920.",
};

const features = [
  { icon: LifeBuoy, title: "Help Desk", body: "Raise a query and get a reply from the Assistant Coordinator, right inside the app." },
  { icon: CalendarDays, title: "Counselling schedule", body: "Class dates, times, venue or online link for your programme." },
  { icon: Megaphone, title: "Notices", body: "Announcements and deadlines from the study centre." },
  { icon: Bell, title: "Instant notifications", body: "Replies, new classes and notices arrive on your phone like any other app." },
  { icon: CircleHelp, title: "FAQs", body: "Quick answers based on IGNOU's official FAQs and prospectus." },
  { icon: Smartphone, title: "Installable app", body: "Add it to your home screen — no Play Store needed." },
];

export default async function About() {
  const user = await getCurrentUser();
  const back = user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/";
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
        <Link href={back} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text">
          <ArrowLeft className="size-4" aria-hidden /> {user ? "Back to app" : "Home"}
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <div className="mb-8 flex flex-col items-start gap-4">
          <FullLogo className="h-16 px-3 py-2" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">About this app</h1>
            <p className="mt-2 text-lg text-muted">The student support app of <b className="text-text">IGNOU Study Centre {CENTRE.code}</b>.</p>
          </div>
        </div>

        <Card className="mb-6 border-primary/30 bg-primary-soft p-5">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="font-bold">Developed only for Study Centre {CENTRE.code}</h2>
              <p className="mt-1 text-[15px] leading-relaxed">
                This app is built exclusively for students of <b>IGNOU Study Centre {CENTRE.code}</b> (Regional Centre Ahmedabad).
                Only students on the centre&apos;s admission list can sign in, using their enrolment number. Students of other study
                centres should contact their own study centre or Regional Centre.
              </p>
            </div>
          </div>
        </Card>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold">What you can do</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><f.icon className="size-5" aria-hidden /></div>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-muted">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 space-y-3 text-[15px] leading-relaxed">
          <h2 className="text-lg font-bold">Important to know</h2>
          <p>
            This app is run by the study centre to help its students. It is <b>not</b> an official app of IGNOU Headquarters and does
            not replace IGNOU&apos;s portals. Admission, re-registration, exam forms, hall tickets, results and grade cards are handled
            only on the official IGNOU websites:{" "}
            <a href="https://www.ignou.ac.in" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">ignou.ac.in</a> and{" "}
            <a href="https://ignou.samarth.edu.in" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">ignou.samarth.edu.in</a>.
          </p>
          <p>FAQ answers are based on IGNOU&apos;s official FAQs and prospectus. Fees, dates and rules can change — always check the latest IGNOU notice.</p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Lock className="size-5 text-primary" aria-hidden /> Your data</h2>
          <p className="text-[15px] leading-relaxed">
            From the admission records the app keeps only your <b>enrolment number, name, programme, year of enrolment, mobile number,
            email and address</b>, plus the queries you raise. This is used only by Study Centre {CENTRE.code} to support you and is not
            shared with anyone else. Your password is stored encrypted — nobody, including the coordinator, can see it.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold">Contact</h2>
          <a href="mailto:sc0920@ignou.ac.in" className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 font-semibold text-primary hover:bg-surface-2">
            <Mail className="size-5" aria-hidden /> sc0920@ignou.ac.in
          </a>
          {user?.role === "student" && <p className="mt-2 text-sm text-muted">Or raise a query from the <Link href="/tickets/new" className="font-medium text-primary hover:underline">Help Desk</Link>.</p>}
        </section>

        <footer className="border-t border-border pt-6 text-center">
          <p className="text-sm font-semibold">{CENTRE.name}</p>
          <Credit className="mt-1 text-sm" />
        </footer>
      </main>
    </div>
  );
}
