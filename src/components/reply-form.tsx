"use client";

import { useActionState, useEffect, useRef } from "react";
import { replyTicketAction } from "@/actions/tickets";
import { FormMessage, SubmitButton } from "./form-bits";

export function ReplyForm({ ticketId, isAdmin, currentStatus, placeholder }: { ticketId: number; isAdmin?: boolean; currentStatus?: string; placeholder?: string }) {
  const [state, action] = useActionState(replyTicketAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="ticketId" value={ticketId} />
      <label htmlFor="reply" className="sr-only">Reply</label>
      <textarea id="reply" name="body" className="input" rows={4} maxLength={5000} placeholder={placeholder ?? "Write a reply…"} required />
      {state?.error && <FormMessage state={state} />}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {isAdmin && (
          <label className="flex items-center gap-2 text-sm text-muted">
            Set status
            <select key={currentStatus} name="status" className="input w-auto py-1.5" defaultValue={currentStatus === "open" ? "in_progress" : currentStatus}>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </label>
        )}
        <SubmitButton pendingText="Sending…">Send reply</SubmitButton>
      </div>
    </form>
  );
}
