"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { getCurrentUser, requireUser } from "@/lib/auth";

export async function markAllReadAction() {
  const u = await requireUser();
  await db
    .update(schema.notifications)
    .set({ isRead: true })
    .where(and(eq(schema.notifications.userId, u.id), eq(schema.notifications.isRead, false)));
  revalidatePath("/notifications");
  revalidatePath("/admin/notifications");
}

/**
 * Called by the app when a page opens: marks the user's unread notifications that point to this page
 * as read (e.g. opening a query marks its reply notifications read). On the notifications page, marks all.
 * Returns how many changed, so the caller refreshes the badge only when needed.
 */
export async function markSeenAction(path: string): Promise<number> {
  const u = await getCurrentUser();
  if (!u || typeof path !== "string" || path.length > 300) return 0;
  const N = schema.notifications;
  const all = path === "/notifications" || path === "/admin/notifications";
  const rows = await db
    .update(N)
    .set({ isRead: true })
    .where(and(eq(N.userId, u.id), eq(N.isRead, false), all ? undefined : eq(N.url, path)))
    .returning({ id: N.id });
  return rows.length;
}
