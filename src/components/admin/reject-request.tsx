"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { rejectRequestAction } from "@/actions/submissions";
import { btnClass } from "@/components/ui";

export function RejectRequest({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className={btnClass("danger", "min-h-9 px-3")}><X className="size-4" aria-hidden /> Reject</button>;
  return (
    <form action={rejectRequestAction} className="flex min-w-0 flex-1 basis-64 flex-wrap gap-2">
      <input type="hidden" name="id" value={id} />
      <input name="note" placeholder="Reason (shown to the student)" className="input min-w-0 flex-1 py-1.5" maxLength={300} autoFocus />
      <button className={btnClass("danger", "min-h-9 px-3")}>Reject</button>
      <button type="button" onClick={() => setOpen(false)} className={btnClass("ghost", "min-h-9 px-3")}>Cancel</button>
    </form>
  );
}
