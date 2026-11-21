"use client";

import { useActionState, useState } from "react";
import { KeyRound } from "lucide-react";
import { createSubmissionRequestAction } from "@/actions/submissions";
import { Field } from "@/components/ui";
import { FormMessage, SubmitButton, ActionForm } from "@/components/form-bits";
import { CoursePicker } from "@/components/course-picker";

export function StudentSubmitForm({ terms, alreadyByTerm, suggestions, allCodes, titles, semesters, today }: {
  terms: string[]; alreadyByTerm: Record<string, string[]>; suggestions: string[]; allCodes: string[];
  titles: Record<string, string>; semesters: Record<string, string>; today: string;
}) {
  const [state, action] = useActionState(createSubmissionRequestAction, undefined);
  const [term, setTerm] = useState(terms[0]);
  return (
    <ActionForm action={action} className="space-y-5">
      <Field label="Term-End Exam" htmlFor="term">
        <select id="term" name="term" className="input" value={term} onChange={(e) => setTerm(e.target.value)}>
          {terms.map((t) => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <div>
        <p className="mb-1.5 text-sm font-medium">Courses you are submitting</p>
        <CoursePicker key={term} suggestions={suggestions} allCodes={allCodes} titles={titles} terms={semesters} already={alreadyByTerm[term] ?? []} />
      </div>
      <p className="text-sm text-muted">Submission date: <b className="text-text">{today}</b></p>
      <Field label="Submission PIN" htmlFor="pin" hint="Ask the coordinator at the study centre when you hand in your assignments.">
        <div className="relative">
          <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input id="pin" name="pin" inputMode="numeric" pattern="\d{4,6}" maxLength={6} autoComplete="one-time-code" className="input pl-9 tracking-[0.3em]" required />
        </div>
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full min-h-11" pendingText="Submitting…">Submit for approval</SubmitButton>
      <p className="text-center text-xs text-muted">After the coordinator approves, your receipt and status appear on the Assignments page.</p>
    </ActionForm>
  );
}
