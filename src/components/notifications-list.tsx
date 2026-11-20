import Link from "next/link";
import clsx from "clsx";
import { desc, eq } from "drizzle-orm";
import { Bell } from "lucide-react";
import { db, schema } from "@/db";
import type { User } from "@/db/schema";
import { markAllReadAction } from "@/actions/notifications";
import { timeAgo } from "@/lib/format";
import { Card, EmptyState, PageHeader } from "./ui";
import { PushToggle } from "./pwa";

export async function NotificationsList({ user }: { user: User }) {
  const rows = await db.select().from(schema.notifications)
    .where(eq(schema.notifications.userId, user.id))
    .orderBy(desc(schema.notifications.createdAt)).limit(100);
  const hasUnread = rows.some((r) => !r.isRead);

  return (
    <>
      <PageHeader
        title="Notifications"
        action={hasUnread ? (
          <form action={markAllReadAction}>
            <button className="text-sm font-semibold text-primary hover:underline">Mark all as read</button>
          </form>
        ) : undefined}
      />
      <div className="mb-5"><PushToggle /></div>
      {rows.length === 0 ? (
        <EmptyState icon={<Bell className="size-6" />} title="You're all caught up" />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {rows.map((n) => {
            const inner = (
              <div className="flex gap-3 px-4 py-3.5">
                <span className={clsx("mt-2 size-2 shrink-0 rounded-full", n.isRead ? "bg-transparent" : "bg-accent")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className={clsx("text-[15px]", !n.isRead && "font-semibold")}>{n.title}</p>
                  <p className="line-clamp-2 text-sm text-muted">{n.body}</p>
                  <p className="mt-0.5 text-xs text-muted">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
            return n.url ? (
              <Link key={n.id} href={n.url} className="block hover:bg-surface-2">{inner}</Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </Card>
      )}
    </>
  );
}
