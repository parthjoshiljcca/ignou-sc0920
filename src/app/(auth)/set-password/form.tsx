"use client";

import { useActionState } from "react";
import { setFirstPasswordAction } from "@/actions/auth";
import { Field } from "@/components/ui";
import { FormMessage, SubmitButton } from "@/components/form-bits";

export function SetPasswordForm({ needName = false, needAddress = false }: { needName?: boolean; needAddress?: boolean }) {
  const [state, action] = useActionState(setFirstPasswordAction, undefined);
  return (
    <form action={action} className="mt-6 space-y-4">
      {needName && (
        <Field label="Full name" htmlFor="fullName" hint="Exactly as on your IGNOU identity card">
          <input id="fullName" name="fullName" className="input" autoComplete="name" minLength={3} maxLength={120} required autoFocus />
        </Field>
      )}
      {needAddress && (
        <Field label="Postal address" htmlFor="address" hint="House / street, area, city, district, PIN code">
          <textarea id="address" name="address" className="input min-h-0" rows={3} minLength={10} maxLength={500} autoComplete="street-address" required />
        </Field>
      )}
      <Field label="New password" htmlFor="password" hint="At least 8 characters. Don't use your mobile number.">
        <input id="password" name="password" type="password" className="input" minLength={8} autoComplete="new-password" required autoFocus={!needName && !needAddress} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm">
        <input id="confirm" name="confirm" type="password" className="input" minLength={8} autoComplete="new-password" required />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full min-h-11" pendingText="Saving…">Save &amp; continue</SubmitButton>
    </form>
  );
}
