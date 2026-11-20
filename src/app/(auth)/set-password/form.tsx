"use client";

import { useActionState } from "react";
import { setFirstPasswordAction } from "@/actions/auth";
import { Field } from "@/components/ui";
import { FormMessage, SubmitButton } from "@/components/form-bits";

type Need = { name: boolean; address: boolean; email: boolean };

export function SetPasswordForm({ need = { name: false, address: false, email: false } }: { need?: Need }) {
  const [state, action] = useActionState(setFirstPasswordAction, undefined);
  const anyMissing = need.name || need.address || need.email;
  return (
    <form action={action} className="mt-6 space-y-4">
      {anyMissing && (
        <p className="rounded-xl bg-warning-soft px-3.5 py-2.5 text-sm font-medium text-warning">Fields marked * are required.</p>
      )}
      {need.name && (
        <Field label="Full name *" htmlFor="fullName" hint="Exactly as on your IGNOU identity card">
          <input id="fullName" name="fullName" className="input" autoComplete="name" minLength={3} maxLength={120} required autoFocus />
        </Field>
      )}
      {need.email && (
        <Field label="Email *" htmlFor="email" hint="We'll use this to contact you; you can also sign in with it">
          <input id="email" name="email" type="email" className="input" autoComplete="email" maxLength={200} required autoFocus={!need.name} />
        </Field>
      )}
      {need.address && (
        <Field label="Postal address *" htmlFor="address" hint="House / street, area, city, district, PIN code">
          <textarea id="address" name="address" className="input min-h-0" rows={3} minLength={10} maxLength={500} autoComplete="street-address" required />
        </Field>
      )}
      <Field label={anyMissing ? "New password *" : "New password"} htmlFor="password" hint="At least 8 characters. Don't use your mobile number.">
        <input id="password" name="password" type="password" className="input" minLength={8} autoComplete="new-password" required autoFocus={!anyMissing} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm">
        <input id="confirm" name="confirm" type="password" className="input" minLength={8} autoComplete="new-password" required />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full min-h-11" pendingText="Saving…">Save &amp; continue</SubmitButton>
    </form>
  );
}
