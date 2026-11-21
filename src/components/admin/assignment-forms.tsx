"use client";

import { useActionState } from "react";
import { updateAssignmentStatusAction, uploadAssignmentsAction } from "@/actions/assignments";
import { ASSIGNMENT_STATUSES } from "@/lib/assignment-status";
import { Field } from "@/components/ui";
import { FormMessage, SubmitButton } from "@/components/form-bits";

export function AssignmentUpload({ defaultSession }: { defaultSession: string }) {
  const [state, action] = useActionState(uploadAssignmentsAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <Field label="Assignment session" htmlFor="asg-session" hint="Used on receipts, e.g. September 2026-27">
        <input id="asg-session" name="session" className="input" defaultValue={defaultSession} maxLength={60} required />
      </Field>
      <Field label="Current status of these assignments" htmlFor="asg-status">
        <select id="asg-status" name="status" className="input" defaultValue="award_list_generated">
          {ASSIGNMENT_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </Field>
      <input type="file" name="file" accept=".xlsx" required
        className="block w-full text-sm file:mr-3 file:rounded-[10px] file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:font-semibold file:text-primary" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="notify" defaultChecked className="size-4 accent-[var(--primary)]" /> Notify students (app users) that their receipt is ready</label>
      <p className="text-xs text-muted">Only enrolment no., programme, course and date are read. The <b>Name</b> and <b>Marks</b> columns are ignored — marks are never stored.</p>
      <FormMessage state={state} />
      <SubmitButton pendingText="Importing…">Import assignments</SubmitButton>
    </form>
  );
}

export function AssignmentStatusForm({ session, current, programmes, courses }: { session: string; current: string; programmes: string[]; courses: string[] }) {
  const [state, action] = useActionState(updateAssignmentStatusAction, undefined);
  const next = ASSIGNMENT_STATUSES[Math.min(ASSIGNMENT_STATUSES.findIndex((s) => s.key === current) + 1, ASSIGNMENT_STATUSES.length - 1)].key;
  const sfx = session.replace(/\W/g, "");
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="session" value={session} />
      <div className="grid gap-3 sm:grid-cols-3">
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
    </form>
  );
}
