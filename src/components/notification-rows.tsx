"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markSeenAction } from "@/actions/notifications";
import clsx from "clsx";

export type NotificationRow = { id: number; title: string; body: string; url: string | null; isRead: boolean; ago: string };

/**
 * Opening the notifications page marks everything read, which refreshes this list. The ones that were
 * unread when the page opened stay highlighted for this visit, so it's still clear what is new.
 */
export function NotificationRows({ rows }: { rows: NotificationRow[] }) {
  const [fresh] = useState(() => new Set(rows.filter((r) => !r.isRead).map((r) => r.id)));
  const router = useRouter();
  // Mark everything read only after this list has its data, so the "New" highlights are right.
  const unread = rows.some((r) => !r.isRead);
  useEffect(() => {
    if (!unread) return;
    markSeenAction("/notifications").then((n) => { if (n > 0) router.refresh(); }).catch(() => {});
  }, [unread, router]);
  return rows.map((n) => {
    const isNew = !n.isRead || fresh.has(n.id);
    const inner = (
      <div className="flex gap-3 px-4 py-3.5">
        <span className={clsx("mt-2 size-2 shrink-0 rounded-full", isNew ? "bg-accent" : "bg-transparent")} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className={clsx("text-[15px]", isNew && "font-semibold")}>{n.title}</p>
          <p className="line-clamp-2 text-sm text-muted">{n.body}</p>
          <p className="mt-0.5 text-xs text-muted">{n.ago}{isNew && <span className="ml-2 font-semibold text-accent">New</span>}</p>
        </div>
      </div>
    );
    return n.url ? (
      <Link key={n.id} href={n.url} className="block hover:bg-surface-2">{inner}</Link>
    ) : (
      <div key={n.id}>{inner}</div>
    );
  });
}
