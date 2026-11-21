"use client";

import { useActionState, useState } from "react";
import { saveSessionAction } from "@/actions/admin";
import { Field } from "@/components/ui";
import { FormMessage, SubmitButton, ActionForm } from "@/components/form-bits";

export type SessionDefaults = {
  id?: number; programme?: string; courseCode?: string; title?: string | null; counsellor?: string | null;
  date?: string; start?: string; end?: string; mode?: "offline" | "online"; venue?: string | null; meetingLink?: string | null; notes?: string | null;
};

export function SessionForm({ d, programmes, courses }: { d: SessionDefaults; programmes: string[]; courses: string[] }) {
  const [state, action] = useActionState(saveSessionAction, undefined);
  const [mode, setMode] = useState(d.mode ?? "offline");
  return (
    <ActionForm action={action} className="space-y-4">
      {d.id && <input type="hidden" name="id" value={d.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Course code" htmlFor="courseCode" >
          <input id="courseCode" autoCapitalize="characters" name="courseCode" list="course-codes" defaultValue={d.courseCode} className="input uppercase" placeholder="e.g. MCS211" required />
          <datalist id="course-codes">{courses.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Programme" htmlFor="programme" hint="Students of this programme see the class">
          <select id="programme" name="programme" defaultValue={d.programme ?? "ALL"} className="input">
            <option value="ALL">All programmes</option>
            {programmes.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Topic (optional)" htmlFor="title"><input id="title" autoCapitalize="characters" name="title" defaultValue={d.title ?? ""} className="input uppercase" placeholder="e.g. Block 2 – Data Structures" /></Field>
      <Field label="Counsellor (optional)" htmlFor="counsellor"><input id="counsellor" autoCapitalize="characters" name="counsellor" defaultValue={d.counsellor ?? ""} className="input uppercase" /></Field>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-1"><Field label="Date" htmlFor="date"><input id="date" name="date" type="date" defaultValue={d.date} className="input" required /></Field></div>
        <Field label="Starts" htmlFor="start"><input id="start" name="start" type="time" defaultValue={d.start ?? "10:00"} className="input" required /></Field>
        <Field label="Ends" htmlFor="end"><input id="end" name="end" type="time" defaultValue={d.end ?? "12:00"} className="input" required /></Field>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Mode</legend>
        <div className="inline-flex rounded-xl border border-border bg-surface p-1 text-sm font-semibold">
          {(["offline", "online"] as const).map((m) => (
            <label key={m} className={`cursor-pointer rounded-lg px-4 py-1.5 ${mode === m ? "bg-primary-fill text-on-primary" : "text-muted"}`}>
              <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only" />
              {m === "offline" ? "At centre" : "Online"}
            </label>
          ))}
        </div>
      </fieldset>
      {mode === "offline" ? (
        <Field label="Venue" htmlFor="venue"><input id="venue" autoCapitalize="characters" name="venue" defaultValue={d.venue ?? ""} className="input uppercase" placeholder="e.g. Room 12, Study Centre 0920" /></Field>
      ) : (
        <Field label="Meeting link" htmlFor="meetingLink"><input id="meetingLink" name="meetingLink" type="url" defaultValue={d.meetingLink ?? ""} className="input" placeholder="https://meet.google.com/…" /></Field>
      )}
      <Field label="Notes for students (optional)" htmlFor="notes"><textarea id="notes" name="notes" rows={3} defaultValue={d.notes ?? ""} className="input min-h-0" placeholder="Bring assignment copy, etc." /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="notify" defaultChecked className="size-4 accent-[var(--primary)]" /> Notify students about this {d.id ? "change" : "class"}</label>
      <FormMessage state={state} />
      <div className="flex justify-end"><SubmitButton pendingText="Saving…">{d.id ? "Save changes" : "Add to schedule"}</SubmitButton></div>
    </ActionForm>
  );
}
