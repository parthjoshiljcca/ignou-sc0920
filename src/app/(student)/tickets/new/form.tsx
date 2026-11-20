"use client";

import { useActionState } from "react";
import { createTicketAction } from "@/actions/tickets";
import { Field } from "@/components/ui";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import { TICKET_CATEGORIES } from "@/lib/constants";

export function NewTicketForm() {
  const [state, action] = useActionState(createTicketAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="Category" htmlFor="category">
        <select id="category" name="category" className="input" required defaultValue="">
          <option value="" disabled>What is this about?</option>
          {TICKET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Subject" htmlFor="subject">
        <input id="subject" name="subject" className="input" maxLength={160} placeholder="e.g. MCS-011 assignment not accepted" required />
      </Field>
      <Field label="Details" htmlFor="body">
        <textarea id="body" name="body" className="input" rows={7} maxLength={5000} placeholder="Describe your issue…" required />
      </Field>
      <FormMessage state={state} />
      <div className="flex justify-end">
        <SubmitButton pendingText="Submitting…">Submit query</SubmitButton>
      </div>
    </form>
  );
}
