"use client";

import { useActionState, useEffect, useRef } from "react";
import { restoreDefaultFaqsAction, saveFaqAction } from "@/actions/faqs";
import { Field } from "@/components/ui";
import { FormMessage, SubmitButton } from "@/components/form-bits";

type Faq = { id?: number; category?: string; question?: string; answer?: string; link?: string | null; sortOrder?: number };

export function FaqForm({ faq, categories }: { faq?: Faq; categories: string[] }) {
  const [state, action] = useActionState(saveFaqAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  const isNew = !faq?.id;
  useEffect(() => { if (state?.ok && isNew) ref.current?.reset(); }, [state, isNew]);
  const sfx = faq?.id ?? "new";
  return (
    <form ref={ref} action={action} className="space-y-3">
      {faq?.id && <input type="hidden" name="id" value={faq.id} />}
      <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
        <Field label="Category" htmlFor={`cat-${sfx}`}>
          <input id={`cat-${sfx}`} name="category" list="faq-categories" defaultValue={faq?.category} className="input" required />
        </Field>
        <Field label="Order" htmlFor={`ord-${sfx}`}>
          <input id={`ord-${sfx}`} name="sortOrder" type="number" min={0} defaultValue={faq?.sortOrder ?? ""} placeholder="auto" className="input" />
        </Field>
      </div>
      <datalist id="faq-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
      <Field label="Question" htmlFor={`q-${sfx}`}>
        <input id={`q-${sfx}`} name="question" defaultValue={faq?.question} className="input" required />
      </Field>
      <Field label="Answer" htmlFor={`a-${sfx}`} hint="Web links and email addresses become clickable automatically.">
        <textarea id={`a-${sfx}`} name="answer" defaultValue={faq?.answer} rows={5} className="input" required />
      </Field>
      <Field label="Official link (optional)" htmlFor={`l-${sfx}`}>
        <input id={`l-${sfx}`} name="link" type="url" defaultValue={faq?.link ?? ""} className="input" placeholder="https://www.ignou.ac.in/…" />
      </Field>
      <FormMessage state={state} />
      <div className="flex justify-end"><SubmitButton pendingText="Saving…">{isNew ? "Add FAQ" : "Save changes"}</SubmitButton></div>
    </form>
  );
}

export function RestoreDefaults() {
  const [state, action] = useActionState(restoreDefaultFaqsAction, undefined);
  return (
    <form action={action} className="space-y-2">
      <SubmitButton variant="secondary" pendingText="Restoring…">Restore missing IGNOU FAQs</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
