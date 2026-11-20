"use client";

import { useActionState } from "react";
import { activateAction } from "@/actions/auth";
import { Field } from "@/components/ui";
import { FormMessage, SubmitButton } from "@/components/form-bits";

export function RegisterForm() {
  const [state, action] = useActionState(activateAction, undefined);
  return (
    <form action={action} className="mt-6 space-y-4">
      <Field label="Enrolment number" htmlFor="enrollmentNo" hint="10 digits, printed on your IGNOU ID card / admission confirmation">
        <input id="enrollmentNo" name="enrollmentNo" className="input" inputMode="numeric" pattern="\d{9,10}" maxLength={10} placeholder="e.g. 2650052768" autoComplete="off" required autoFocus />
      </Field>
      <Field label="Date of birth" htmlFor="dob">
        <input id="dob" name="dob" type="date" className="input" max={new Date().toISOString().slice(0, 10)} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Create password" htmlFor="password" hint="At least 8 characters">
          <input id="password" name="password" type="password" className="input" minLength={8} autoComplete="new-password" required />
        </Field>
        <Field label="Confirm password" htmlFor="confirm">
          <input id="confirm" name="confirm" type="password" className="input" minLength={8} autoComplete="new-password" required />
        </Field>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="w-full min-h-11" pendingText="Verifying…">Verify &amp; activate</SubmitButton>
    </form>
  );
}
