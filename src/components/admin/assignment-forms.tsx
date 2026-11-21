"use client";

import { useActionState } from "react";
import { updateAssignmentStatusAction, uploadAssignmentsAction } from "@/actions/assignments";
import { ASSIGNMENT_STATUSES, ASSIGNMENT_TERMS, TERM_RE } from "@/lib/assignment-status";
import { Field } from "@/components/ui";
import { FormMessage, SubmitButton, ActionForm } from "@/components/form-bits";

export function AssignmentUpload({ defaultSession }: { defaultSession: string }) {
  const [state, action] = useActionState(uploadAssignmentsAction, undefined);
  const m = defaultSession.match(TERM_RE);
  const thisYear = new Date().getFullYear();
  const defTerm = m?.[1] ?? (new Date().getMonth() < 6 ? "June" : "December");
  const defYear = m?.[2] ?? String(thisYear);
  const years = [thisYear - 1, thisYear, thisYear + 1].map(String);
  return (
    <ActionForm action={action} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Term (TEE)" htmlFor="asg-term">
          <select id="asg-term" name="term" className="input" defaultValue={defTerm} required>
            {ASSIGNMENT_TERMS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Year" htmlFor="asg-year">
          <select id="asg-year" name="year" className="input" defaultValue={defYear} required>
            {years.map((y) => <option key={y}>{y}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Current status of these assignments" htmlFor="asg-status">
        <select id="asg-status" name="status" className="input" defaultValue="award_list_generated">
          {ASSIGNMENT_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </Field>
      <input type="file" name="file" accept=".xlsx" required
        className="block w-full text-sm file:mr-3 file:rounded-[10px] file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:font-semibold file:text-primary" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="notify" defaultChecked className="size-4 accent-[var(--primary)]" /> Notify students (app users) that their receipt is ready</label>
      <p className="text-xs text-muted">Enrolment no., programme, course and date are read; the name is kept only for students not on the student list. The <b>Marks</b> column is ignored — marks are never stored.</p>
      <FormMessage state={state} />
      <SubmitButton pendingText="Importing…">Import assignments</SubmitButton>
    </ActionForm>
  );
}

export function AssignmentStatusForm({ session, current, programmes, courses }: { session: string; current: string; programmes: string[]; courses: string[] }) {
  const [state, action] = useActionState(updateAssignmentStatusAction, undefined);
  const next = ASSIGNMENT_STATUSES[Math.min(ASSIGNMENT_STATUSES.findIndex((s) => s.key === current) + 1, ASSIGNMENT_STATUSES.length - 1)].key;
  const sfx = session.replace(/\W/g, "");
  return (
    <ActionForm action={action} className="space-y-3">
      <input type="hidden" name="session" value={session} />
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="New status" htmlFor={`st-${sfx}`}>
          <select id={`st-${sfx}`} name="status" className="input" defaultValue={next}>
            {ASSIGNMENT_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Programme (optional)" htmlFor={`pr-${sfx}`}>
          <select id={`pr-${sfx}`} name="programme" className="input" defaultValue="">
            <option value="">All programmes</option>
            {programmes.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Course (optional)" htmlFor={`co-${sfx}`}>
          <input id={`co-${sfx}`} name="courseCode" list={`courses-${sfx}`} className="input uppercase" placeholder="All courses" />
          <datalist id={`courses-${sfx}`}>{courses.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="notify" defaultChecked className="size-4 accent-[var(--primary)]" /> Notify affected students</label>
      <FormMessage state={state} />
      <SubmitButton pendingText="Updating…">Update status</SubmitButton>
    </ActionForm>
  );
}
