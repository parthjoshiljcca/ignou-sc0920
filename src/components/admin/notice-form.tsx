"use client";

import { useActionState, useEffect, useRef } from "react";
import { createNoticeAction } from "@/actions/admin";
import { Field } from "@/components/ui";
import { FormMessage, SubmitButton } from "@/components/form-bits";

export function NoticeForm({ programmes }: { programmes: string[] }) {
  const [state, action] = useActionState(createNoticeAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-4">
      <Field label="Title" htmlFor="title"><input id="title" name="title" className="input" maxLength={160} placeholder="e.g. Assignment submission deadline extended" required /></Field>
      <Field label="Message" htmlFor="body"><textarea id="body" name="body" rows={5} className="input" required /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Who should see it" htmlFor="audience">
          <select id="audience" name="audience" className="input" defaultValue="ALL">
            <option value="ALL">All students</option>
            {programmes.map((p) => <option key={p} value={p}>{p} only</option>)}
          </select>
        </Field>
        <Field label="Link (optional)" htmlFor="link"><input id="link" name="link" type="url" className="input" placeholder="https://ignou.ac.in/…" /></Field>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="notify" defaultChecked className="size-4 accent-[var(--primary)]" /> Send notification to students</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="pinned" className="size-4 accent-[var(--primary)]" /> Pin to top</label>
      </div>
      <FormMessage state={state} />
      <div className="flex justify-end"><SubmitButton pendingText="Publishing…">Publish notice</SubmitButton></div>
    </form>
  );
}
