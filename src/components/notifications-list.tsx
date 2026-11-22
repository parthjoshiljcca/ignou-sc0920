import { desc, eq } from "drizzle-orm";
import { Bell } from "lucide-react";
import { db, schema } from "@/db";
import type { User } from "@/db/schema";
import { markAllReadAction } from "@/actions/notifications";
import { timeAgo } from "@/lib/format";
import { Card, EmptyState, PageHeader } from "./ui";
import { PushToggle } from "./pwa";
import { NotificationRows } from "./notification-rows";

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
          <NotificationRows rows={rows.map((n) => ({ id: n.id, title: n.title, body: n.body, url: n.url, isRead: n.isRead, ago: timeAgo(n.createdAt) }))} />
        </Card>
      )}
    </>
  );
}
