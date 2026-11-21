"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { addTermAction, saveSubmissionSettingsAction } from "@/actions/submissions";
import { ASSIGNMENT_TERMS } from "@/lib/assignment-status";
import { Field } from "@/components/ui";
import { FormMessage, SubmitButton, ActionForm } from "@/components/form-bits";

export function SubmissionSettingsForm({ switchOn, pin }: { switchOn: boolean; pin: string | null }) {
  const [state, action] = useActionState(saveSubmissionSettingsAction, undefined);
  const [show, setShow] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (state?.ok && pinRef.current) pinRef.current.value = ""; }, [state]);
  return (
    <ActionForm action={action} className="space-y-4">
      <label className="flex items-start gap-3 rounded-xl border border-border p-3.5">
        <input type="checkbox" name="enabled" defaultChecked={switchOn} className="mt-0.5 size-5 accent-[var(--primary-fill)]" />
        <span>
          <span className="block font-semibold">Students can submit assignments from the app</span>
          <span className="block text-sm text-muted">When off, students don&apos;t see the submit option at all. You can still record submissions yourself.</span>
        </span>
      </label>
      <Field label={pin ? "Submission PIN" : "Set a submission PIN"} htmlFor="pin" hint="4–6 digits. Give it to students at the study centre when they hand in assignments. Change it any time.">
        <div className="flex items-center gap-2">
          <input ref={pinRef} id="pin" name="pin" inputMode="numeric" pattern="\d{4,6}" maxLength={6} placeholder={pin ? "Leave blank to keep the current PIN" : "e.g. 4821"} className="input" autoComplete="off" />
        </div>
      </Field>
      {pin && (
        <p className="flex items-center gap-2 text-sm">
          Current PIN: <b className="font-mono tracking-widest">{show ? pin : "•".repeat(pin.length)}</b>
          <button type="button" onClick={() => setShow((v) => !v)} className="rounded-lg p-1 text-muted hover:text-text" aria-label={show ? "Hide PIN" : "Show PIN"}>
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </p>
      )}
      <FormMessage state={state} />
      <SubmitButton pendingText="Saving…">Save</SubmitButton>
    </ActionForm>
  );
}

export function AddTermForm() {
  const [state, action] = useActionState(addTermAction, undefined);
  const y = new Date().getFullYear();
  return (
    <ActionForm action={action} className="space-y-3">
      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
        <Field label="Term" htmlFor="new-term">
          <select id="new-term" name="term" className="input">{ASSIGNMENT_TERMS.map((t) => <option key={t}>{t}</option>)}</select>
        </Field>
        <Field label="Year" htmlFor="new-year">
          <select id="new-year" name="year" className="input" defaultValue={String(y + 1)}>{[y - 1, y, y + 1, y + 2].map((v) => <option key={v}>{v}</option>)}</select>
        </Field>
        <SubmitButton variant="secondary" pendingText="Adding…">Add</SubmitButton>
      </div>
      <FormMessage state={state} />
    </ActionForm>
  );
}
