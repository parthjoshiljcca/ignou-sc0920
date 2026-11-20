"use client";

import { useActionState } from "react";
import { setFirstPasswordAction } from "@/actions/auth";
import { Field } from "@/components/ui";
import { FormMessage, SubmitButton } from "@/components/form-bits";

export function SetPasswordForm() {
  const [state, action] = useActionState(setFirstPasswordAction, undefined);
  return (
    <form action={action} className="mt-6 space-y-4">
      <Field label="New password" htmlFor="password" hint="At least 8 characters. Don't use your mobile number.">
        <input id="password" name="password" type="password" className="input" minLength={8} autoComplete="new-password" required autoFocus />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm">
        <input id="confirm" name="confirm" type="password" className="input" minLength={8} autoComplete="new-password" required />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full min-h-11" pendingText="Saving…">Save password &amp; continue</SubmitButton>
    </form>
  );
}
