"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";

export async function markAllReadAction() {
  const u = await requireUser();
  await db
    .update(schema.notifications)
    .set({ isRead: true })
    .where(and(eq(schema.notifications.userId, u.id), eq(schema.notifications.isRead, false)));
  revalidatePath("/notifications");
  revalidatePath("/admin/notifications");
}
