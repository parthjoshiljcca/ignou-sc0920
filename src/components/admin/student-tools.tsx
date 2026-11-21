"use client";

import { useActionState } from "react";
import { resetStudentPasswordAction, uploadRosterAction } from "@/actions/admin";
import { FormMessage, SubmitButton, ActionForm } from "@/components/form-bits";

export function RosterUpload() {
  const [state, action] = useActionState(uploadRosterAction, undefined);
  return (
    <ActionForm action={action} className="space-y-3">
      <input type="file" name="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required
        className="block w-full text-sm file:mr-3 file:rounded-[10px] file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:font-semibold file:text-primary" />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="updateExisting" className="mt-0.5 size-4 accent-[var(--primary)]" />
        <span>Also update details of students already in the app <span className="text-muted">(otherwise only new students are added and empty details filled)</span></span>
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingText="Importing…">Import list</SubmitButton>
    </ActionForm>
  );
}

export function ResetPassword({ id }: { id: number }) {
  const [state, action] = useActionState(resetStudentPasswordAction, undefined);
  if (state?.ok) return <p className="text-xs font-semibold text-success select-all">{state.ok}</p>;
  return (
    <ActionForm action={action} onSubmit={(e) => { if (!confirm("Reset this student's password?")) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <button className="text-xs font-semibold text-primary hover:underline">Reset password</button>
      <FormMessage state={state} />
    </ActionForm>
  );
}
