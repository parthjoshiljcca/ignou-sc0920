"use client";

import { useActionState } from "react";
import { resetStudentPasswordAction, uploadRosterAction } from "@/actions/admin";
import { FormMessage, SubmitButton } from "@/components/form-bits";

export function RosterUpload() {
  const [state, action] = useActionState(uploadRosterAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="file" name="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required
        className="block w-full text-sm file:mr-3 file:rounded-[10px] file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:font-semibold file:text-primary" />
      <FormMessage state={state} />
      <SubmitButton pendingText="Importing…">Import roster</SubmitButton>
    </form>
  );
}

export function ResetPassword({ id }: { id: number }) {
  const [state, action] = useActionState(resetStudentPasswordAction, undefined);
  if (state?.ok) return <p className="text-xs font-semibold text-success select-all">{state.ok}</p>;
  return (
    <form action={action} onSubmit={(e) => { if (!confirm("Reset this student's password?")) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <button className="text-xs font-semibold text-primary hover:underline">Reset password</button>
      <FormMessage state={state} />
    </form>
  );
}
