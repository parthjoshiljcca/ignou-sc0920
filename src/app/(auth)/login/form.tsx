"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Field } from "@/components/ui";
import { FormMessage, SubmitButton } from "@/components/form-bits";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email or enrollment number" htmlFor="identifier">
        <input id="identifier" name="identifier" className="input" autoComplete="username" required autoFocus />
      </Field>
      <Field label="Password" htmlFor="password">
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full min-h-11" pendingText="Signing in…">Sign in</SubmitButton>
      <p className="text-center text-xs text-muted">Forgot your password? Contact the study centre and we&apos;ll reset it.</p>
    </form>
  );
}
