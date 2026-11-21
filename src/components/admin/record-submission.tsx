"use client";

import { useActionState, useState, useTransition } from "react";
import { Search, UserRound } from "lucide-react";
import { lookupStudentAction, recordSubmissionAction } from "@/actions/submissions";
import { Field, Pill } from "@/components/ui";
import { FormMessage, SubmitButton, ActionForm } from "@/components/form-bits";
import { CoursePicker } from "@/components/course-picker";

type Lookup = Awaited<ReturnType<typeof lookupStudentAction>>;

export function RecordSubmissionForm({ terms, defaultTerm, today, programmes, suggestionsByProgramme, allCourses }: {
  terms: { name: string; accepting: boolean }[]; defaultTerm: string; today: string; programmes: string[];
  suggestionsByProgramme: Record<string, string[]>; allCourses: string[];
}) {
  const [state, action] = useActionState(recordSubmissionAction, undefined);
  const [enrol, setEnrol] = useState("");
  const [term, setTerm] = useState(defaultTerm);
  const [info, setInfo] = useState<Lookup | null>(null);
  const [newProg, setNewProg] = useState("");
  const [pending, start] = useTransition();

  const fetchStudent = (e = enrol, t = term) => start(async () => setInfo(await lookupStudentAction(e, t)));
  const ok = info && !("error" in info);
  const programme = ok ? (info.found ? info.programme : newProg || info.programmeHint || "") : "";
  const sugg = (programme && (suggestionsByProgramme[programme] ?? suggestionsByProgramme[programme.replace(/_/g, "")])) || allCourses.slice(0, 60);

  return (
    <ActionForm action={action} className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field label="Enrolment number" htmlFor="enrollmentNo">
          <div className="flex gap-2">
            <input id="enrollmentNo" name="enrollmentNo" value={enrol} inputMode="numeric" maxLength={10} className="input" placeholder="e.g. 2650052768"
              onChange={(e) => { setEnrol(e.target.value); setInfo(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); fetchStudent(); } }} required />
            <button type="button" onClick={() => fetchStudent()} disabled={pending} className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] bg-primary-fill px-4 text-sm font-semibold text-on-primary">
              <Search className="size-4" aria-hidden /> {pending ? "…" : "Fetch"}
            </button>
          </div>
        </Field>
        <Field label="Term (TEE)" htmlFor="term">
          <select id="term" name="term" className="input" value={term} onChange={(e) => { setTerm(e.target.value); if (ok) fetchStudent(enrol, e.target.value); }}>
            {terms.map((t) => <option key={t.name} value={t.name}>{t.name}{t.accepting ? "" : " (closed)"}</option>)}
          </select>
        </Field>
      </div>

      {info && "error" in info && <p className="text-sm font-medium text-danger">{info.error}</p>}

      {ok && info.found && (
        <div className="flex items-start gap-3 rounded-xl border border-success/40 bg-success-soft p-3.5">
          <UserRound className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
          <div className="min-w-0 text-sm">
            <p className="font-bold">{info.name ?? "Name not on record yet"}</p>
            <p className="text-muted">{info.enrollmentNo} · {info.programme} · {info.mobile ?? "no mobile"}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Pill tone={info.onApp ? "accent" : "neutral"}>{info.onApp ? "Uses the app" : "Not signed in yet"}</Pill>
              {info.already.length > 0 && <Pill>{info.already.length} already recorded for {term}</Pill>}
            </div>
          </div>
        </div>
      )}

      {ok && !info.found && (
        <div className="space-y-3 rounded-xl border border-warning/40 bg-warning-soft p-3.5">
          <p className="text-sm font-semibold text-warning">Not in the student list — enter details. The student will be added and can sign in with this mobile number.</p>
          <Field label="Full name *" htmlFor="name"><input id="name" name="name" className="input" required /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Programme *" htmlFor="programme">
              <input id="programme" name="programme" list="programmes" className="input uppercase" defaultValue={info.programmeHint ?? ""} onChange={(e) => setNewProg(e.target.value.toUpperCase())} required />
              <datalist id="programmes">{programmes.map((p) => <option key={p} value={p} />)}</datalist>
            </Field>
            <Field label="Mobile *" htmlFor="mobile"><input id="mobile" name="mobile" type="tel" inputMode="numeric" maxLength={10} className="input" required /></Field>
          </div>
          <Field label="Email (optional)" htmlFor="email"><input id="email" name="email" type="email" className="input" /></Field>
        </div>
      )}

      {ok && (
        <>
          <Field label="Submission date" htmlFor="submittedOn">
            <input id="submittedOn" name="submittedOn" type="date" max={today} defaultValue={today} className="input" required />
          </Field>
          <div>
            <p className="mb-1.5 text-sm font-medium">Courses submitted *</p>
            <CoursePicker key={`${info.enrollmentNo}-${term}`} suggestions={sugg} allCodes={allCourses} already={info.already} />
          </div>
          <FormMessage state={state} />
          <SubmitButton className="w-full min-h-11" pendingText="Saving…">Save &amp; create receipt</SubmitButton>
        </>
      )}
      {!info && <p className="text-sm text-muted">Enter the enrolment number and tap <b>Fetch</b>.</p>}
    </ActionForm>
  );
}
