"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { importAssignments, parseAssignmentsXlsx, setAssignmentStatus, userIdsForEnrolments } from "@/lib/assignments";
import { ASSIGNMENT_STATUSES, statusDetail, statusLabel, type AssignmentStatus } from "@/lib/assignment-status";
import { notifyUsers } from "@/lib/notify";
import type { FormState } from "./auth";

const statusKeys = ASSIGNMENT_STATUSES.map((s) => s.key) as [AssignmentStatus, ...AssignmentStatus[]];
const Session = z.string().trim().min(3, "Enter the assignment session, e.g. September 2026-27").max(60);

export async function uploadAssignmentsAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const session = Session.safeParse(fd.get("session"));
  if (!session.success) return { error: session.error.issues[0].message };
  const status = z.enum(statusKeys).safeParse(fd.get("status"));
  if (!status.success) return { error: "Choose the current status" };
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose the assignment Excel file (.xlsx)" };
  if (!file.name.toLowerCase().endsWith(".xlsx")) return { error: "Only .xlsx files are supported" };
  if (file.size > 15 * 1024 * 1024) return { error: "File is larger than 15 MB" };

  try {
    const { rows, skipped } = await parseAssignmentsXlsx(await file.arrayBuffer());
    if (!rows.length) return { error: "No assignment rows found in this file." };
    const r = await importAssignments(db, session.data, rows, status.data);
    if (fd.get("notify")) {
      const ids = await userIdsForEnrolments(db, [...new Set(rows.map((x) => x.enrollmentNo))]);
      await notifyUsers(ids, {
        title: `Assignments ${session.data}: ${statusLabel(status.data)}`,
        body: `Your assignment submission is recorded. ${statusDetail(status.data)} Download your receipt in the app.`,
        url: "/assignments",
      });
    }
    revalidatePath("/admin/assignments");
    const extra = skipped.length ? ` Skipped ${skipped.length}: ${skipped.slice(0, 4).join("; ")}${skipped.length > 4 ? "…" : ""}` : "";
    return {
      ok: `Imported ${r.rows} course submissions for ${r.students} students (${r.added} new, ${r.rows - r.added} already present). ${r.receipts} new receipts created. Marks were not read.${extra}`,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't read this file" };
  }
}

export async function updateAssignmentStatusAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const session = Session.safeParse(fd.get("session"));
  const status = z.enum(statusKeys).safeParse(fd.get("status"));
  if (!session.success || !status.success) return { error: "Choose a session and a status" };
  const programme = String(fd.get("programme") ?? "").trim() || undefined;
  const courseCode = String(fd.get("courseCode") ?? "").trim().toUpperCase() || undefined;

  const enrolments = await setAssignmentStatus(db, { session: session.data, status: status.data, programme, courseCode });
  let notified = 0;
  if (fd.get("notify") && enrolments.length) {
    const ids = await userIdsForEnrolments(db, enrolments);
    notified = ids.length;
    await notifyUsers(ids, {
      title: `Assignment status: ${statusLabel(status.data)}`,
      body: `${session.data}${courseCode ? ` · ${courseCode}` : ""} — ${statusDetail(status.data)}`,
      url: "/assignments",
    });
  }
  revalidatePath("/admin/assignments");
  const scope = [programme, courseCode].filter(Boolean).join(" · ") || "all programmes";
  return {
    ok: enrolments.length
      ? `Updated ${enrolments.length} students (${scope}) to “${statusLabel(status.data)}”.${fd.get("notify") ? ` ${notified} students with an app account were notified.` : ""}`
      : `Nothing to change — every matching submission is already “${statusLabel(status.data)}”.`,
  };
}
