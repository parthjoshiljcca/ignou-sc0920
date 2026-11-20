"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireAdmin, requireStudent, requireUser } from "@/lib/auth";
import { STATUS_LABEL, TICKET_CATEGORIES } from "@/lib/constants";
import { notifyAdmins, notifyUsers } from "@/lib/notify";
import type { FormState } from "./auth";

const NewTicket = z.object({
  category: z.enum(TICKET_CATEGORIES, { message: "Choose a category" }),
  subject: z.string().trim().min(5, "Subject is too short").max(160),
  body: z.string().trim().min(10, "Please describe your query in a little more detail").max(5000),
});

export async function createTicketAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireStudent();
  const parsed = NewTicket.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const [t] = await db
    .insert(schema.tickets)
    .values({ studentId: u.id, category: d.category, subject: d.subject })
    .returning({ id: schema.tickets.id });
  await db.insert(schema.ticketMessages).values({ ticketId: t.id, authorId: u.id, body: d.body });

  await notifyAdmins({
    title: `New query #${t.id} · ${d.category}`,
    body: `${u.name} (${u.enrollmentNo}): ${d.subject}`,
    url: `/admin/tickets/${t.id}`,
  });
  redirect(`/tickets/${t.id}?created=1`);
}

const Reply = z.object({
  ticketId: z.coerce.number().int().positive(),
  body: z.string().trim().min(1, "Write a message").max(5000),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
});

export async function replyTicketAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const parsed = Reply.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { ticketId, body, status } = parsed.data;

  const [t] = await db.select().from(schema.tickets).where(eq(schema.tickets.id, ticketId)).limit(1);
  if (!t) return { error: "Query not found" };
  if (u.role === "student" && t.studentId !== u.id) return { error: "Query not found" };

  await db.insert(schema.ticketMessages).values({ ticketId, authorId: u.id, body });

  let newStatus = t.status;
  if (u.role === "admin") {
    newStatus = status ?? (t.status === "open" ? "in_progress" : t.status);
  } else if (t.status === "resolved" || t.status === "closed") {
    newStatus = "open"; // student follow-up re-opens the query
  }
  await db.update(schema.tickets).set({ status: newStatus, updatedAt: new Date() }).where(eq(schema.tickets.id, ticketId));

  if (u.role === "admin") {
    await notifyUsers([t.studentId], {
      title: `Reply on query #${ticketId}`,
      body: `${body.slice(0, 140)}${body.length > 140 ? "…" : ""}`,
      url: `/tickets/${ticketId}`,
    });
    revalidatePath(`/admin/tickets/${ticketId}`);
  } else {
    await notifyAdmins({
      title: `Follow-up on query #${ticketId}`,
      body: `${u.name}: ${body.slice(0, 140)}`,
      url: `/admin/tickets/${ticketId}`,
    });
    revalidatePath(`/tickets/${ticketId}`);
  }
  return { ok: "Sent" };
}

export async function updateTicketMetaAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("ticketId"));
  const status = z.enum(["open", "in_progress", "resolved", "closed"]).safeParse(fd.get("status"));
  const priority = z.enum(["low", "normal", "high"]).safeParse(fd.get("priority"));
  const [t] = await db.select().from(schema.tickets).where(eq(schema.tickets.id, id)).limit(1);
  if (!t) return;
  const patch: Partial<typeof schema.tickets.$inferInsert> = { updatedAt: new Date() };
  if (status.success) patch.status = status.data;
  if (priority.success) patch.priority = priority.data;
  await db.update(schema.tickets).set(patch).where(eq(schema.tickets.id, id));
  if (status.success && status.data !== t.status) {
    await notifyUsers([t.studentId], {
      title: `Query #${id} is now ${STATUS_LABEL[status.data]}`,
      body: t.subject,
      url: `/tickets/${id}`,
    });
  }
  revalidatePath(`/admin/tickets/${id}`);
  revalidatePath("/admin/tickets");
}

export async function closeOwnTicketAction(fd: FormData) {
  const u = await requireStudent();
  const id = Number(fd.get("ticketId"));
  await db
    .update(schema.tickets)
    .set({ status: "closed", updatedAt: new Date() })
    .where(and(eq(schema.tickets.id, id), eq(schema.tickets.studentId, u.id)));
  revalidatePath(`/tickets/${id}`);
}
