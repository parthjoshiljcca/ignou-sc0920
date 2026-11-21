"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { createTicketAction } from "@/actions/tickets";
import { Field } from "@/components/ui";
import { FormMessage, SubmitButton, ActionForm } from "@/components/form-bits";
import { TICKET_CATEGORIES } from "@/lib/constants";
import type { FaqItem } from "@/components/faq-browser";

export function NewTicketForm({ faqs, map }: { faqs: FaqItem[]; map: Record<string, string[]> }) {
  const [state, action] = useActionState(createTicketAction, undefined);
  const [category, setCategory] = useState("");
  const related = category ? faqs.filter((f) => map[category]?.includes(f.category)).slice(0, 4) : [];

  return (
    <ActionForm action={action} className="space-y-4">
      <Field label="Category" htmlFor="category">
        <select id="category" name="category" className="input" required value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="" disabled>What is this about?</option>
          {TICKET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>

      {related.length > 0 && (
        <div className="rounded-xl border border-border bg-accent-soft p-3.5">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="size-4 text-accent" aria-hidden /> These might answer your question
          </p>
          <ul className="space-y-1.5">
            {related.map((f) => (
              <li key={f.id}>
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-primary">{f.question}</summary>
                  <p className="prose-msg mt-1.5 text-muted">{f.answer}</p>
                </details>
              </li>
            ))}
          </ul>
          <Link href="/faqs" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">See all FAQs →</Link>
        </div>
      )}

      <Field label="Subject" htmlFor="subject">
        <input id="subject" name="subject" className="input" maxLength={160} placeholder="e.g. MCS-211 assignment not accepted" required />
      </Field>
      <Field label="Details" htmlFor="body">
        <textarea id="body" name="body" className="input" rows={7} maxLength={5000} placeholder="Describe your issue…" required />
      </Field>
      <FormMessage state={state} />
      <div className="flex justify-end">
        <SubmitButton pendingText="Submitting…">Submit query</SubmitButton>
      </div>
    </ActionForm>
  );
}
