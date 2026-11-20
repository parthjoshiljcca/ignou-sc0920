"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction, updateProfileAction } from "@/actions/auth";
import { Field } from "@/components/ui";
import { FormMessage, SubmitButton } from "@/components/form-bits";

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const [state, action] = useActionState(updateProfileAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="Name" htmlFor="name"><input id="name" name="name" defaultValue={name} className="input" required /></Field>
      <Field label="Mobile" htmlFor="phone"><input id="phone" name="phone" type="tel" inputMode="numeric" maxLength={10} defaultValue={phone} className="input" /></Field>
      {!email.endsWith(".local") && <Field label="Email (login)" htmlFor="email"><input id="email" value={email} disabled className="input opacity-70" /></Field>}
      <FormMessage state={state} />
      <div className="flex justify-end"><SubmitButton variant="secondary" pendingText="Saving…">Save</SubmitButton></div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-4">
      <Field label="Current password" htmlFor="current"><input id="current" name="current" type="password" autoComplete="current-password" className="input" required /></Field>
      <Field label="New password" htmlFor="next" hint="At least 8 characters"><input id="next" name="next" type="password" minLength={8} autoComplete="new-password" className="input" required /></Field>
      <FormMessage state={state} />
      <div className="flex justify-end"><SubmitButton variant="secondary" pendingText="Updating…">Update password</SubmitButton></div>
    </form>
  );
}
