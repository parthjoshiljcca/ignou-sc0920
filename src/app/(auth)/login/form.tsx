"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { Field } from "@/components/ui";
import { FormMessage, SubmitButton } from "@/components/form-bits";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Enrolment number" htmlFor="identifier" hint="Coordinator? Use your email.">
        <input id="identifier" name="identifier" className="input" autoComplete="username" placeholder="e.g. 2650052768" required autoFocus />
      </Field>
      <Field label="Password" htmlFor="password">
        <div className="relative">
          <input id="password" name="password" type={show ? "text" : "password"} className="input pr-11" autoComplete="current-password" required />
          <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-lg p-2 text-muted hover:text-text">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full min-h-11" pendingText="Signing in…">Sign in</SubmitButton>
      <p className="text-center text-xs text-muted">Forgot your password? Raise it with the study centre and the coordinator will reset it to your mobile number.</p>
    </form>
  );
}
