"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { fmtDay, fmtTime, istInputToDate } from "@/lib/format";
import { notifyStudents } from "@/lib/notify";
import type { FormState } from "./auth";

const SessionSchema = z
  .object({
    programme: z.string().trim().min(1, "Choose a programme").max(40),
    courseCode: z.string().trim().min(2, "Enter the course code").max(20).toUpperCase(),
    title: z.string().trim().max(160).optional(),
    counsellor: z.string().trim().max(120).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
    start: z.string().regex(/^\d{2}:\d{2}$/, "Choose a start time"),
    end: z.string().regex(/^\d{2}:\d{2}$/, "Choose an end time"),
    mode: z.enum(["offline", "online"]),
    venue: z.string().trim().max(200).optional(),
    meetingLink: z.union([z.url("Meeting link must be a full URL"), z.literal("")]).optional(),
    notes: z.string().trim().max(2000).optional(),
    notify: z.string().optional(),
  })
  .refine((d) => d.end > d.start, { message: "End time must be after start time" });

export async function saveSessionAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = SessionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const id = Number(fd.get("id") || 0);
  const values = {
    programme: d.programme,
    courseCode: d.courseCode,
    title: d.title || null,
    counsellor: d.counsellor || null,
    startsAt: istInputToDate(`${d.date}T${d.start}`),
    endsAt: istInputToDate(`${d.date}T${d.end}`),
    mode: d.mode,
    venue: d.venue || null,
    meetingLink: d.meetingLink || null,
    notes: d.notes || null,
  };
  if (id) await db.update(schema.counsellingSessions).set(values).where(eq(schema.counsellingSessions.id, id));
  else await db.insert(schema.counsellingSessions).values(values);

  if (d.notify) {
    await notifyStudents(
      {
        title: `${id ? "Updated" : "New"} counselling: ${d.courseCode}`,
        body: `${fmtDay(values.startsAt)} · ${fmtTime(values.startsAt)}–${fmtTime(values.endsAt)} · ${d.mode === "online" ? "Online" : d.venue || "Study Centre"}`,
        url: "/schedule",
      },
      d.programme,
    );
  }
  revalidatePath("/admin/schedule");
  redirect("/admin/schedule?saved=1");
}

export async function deleteSessionAction(fd: FormData) {
  await requireAdmin();
  await db.delete(schema.counsellingSessions).where(eq(schema.counsellingSessions.id, Number(fd.get("id"))));
  revalidatePath("/admin/schedule");
}

const NoticeSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(160),
  body: z.string().trim().min(5, "Write the notice").max(5000),
  link: z.union([z.url("Link must be a full URL"), z.literal("")]).optional(),
  audience: z.string().trim().min(1).max(40),
  pinned: z.string().optional(),
  notify: z.string().optional(),
});

export async function createNoticeAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireAdmin();
  const parsed = NoticeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  await db.insert(schema.announcements).values({
    title: d.title,
    body: d.body,
    link: d.link || null,
    audience: d.audience,
    pinned: !!d.pinned,
    authorId: u.id,
  });
  if (d.notify) {
    await notifyStudents({ title: d.title, body: d.body.slice(0, 160), url: "/notices" }, d.audience);
  }
  revalidatePath("/admin/notices");
  return { ok: d.notify ? "Notice published and students notified" : "Notice published" };
}

export async function deleteNoticeAction(fd: FormData) {
  await requireAdmin();
  await db.delete(schema.announcements).where(eq(schema.announcements.id, Number(fd.get("id"))));
  revalidatePath("/admin/notices");
}

export async function togglePinAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const [n] = await db.select().from(schema.announcements).where(eq(schema.announcements.id, id));
  if (n) await db.update(schema.announcements).set({ pinned: !n.pinned }).where(eq(schema.announcements.id, id));
  revalidatePath("/admin/notices");
}

export async function setStudentActiveAction(fd: FormData) {
  await requireAdmin();
  await db
    .update(schema.users)
    .set({ isActive: fd.get("active") === "1" })
    .where(eq(schema.users.id, Number(fd.get("id"))));
  revalidatePath("/admin/students");
}

export async function uploadRosterAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose the admission export (.xlsx) file" };
  if (!file.name.toLowerCase().endsWith(".xlsx")) return { error: "Only .xlsx files are supported" };
  if (file.size > 15 * 1024 * 1024) return { error: "File is larger than 15 MB" };
  try {
    const { parseRosterXlsx, upsertRoster } = await import("@/lib/roster");
    const { rows, skipped } = await parseRosterXlsx(await file.arrayBuffer());
    if (!rows.length) return { error: "No valid student rows found in this file." };
    const n = await upsertRoster(db, rows);
    revalidatePath("/admin/students");
    return { ok: `Imported ${n} students.${skipped.length ? ` Skipped ${skipped.length}: ${skipped.slice(0, 5).join("; ")}${skipped.length > 5 ? "…" : ""}` : ""}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't read this file" };
  }
}

export async function resetStudentPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const bcrypt = (await import("bcryptjs")).default;
  const temp = `SC${Math.random().toString().slice(2, 8)}`;
  await db.update(schema.users).set({ passwordHash: await bcrypt.hash(temp, 10) }).where(eq(schema.users.id, id));
  return { ok: `Temporary password: ${temp} — share it with the student and ask them to change it from Profile.` };
}
