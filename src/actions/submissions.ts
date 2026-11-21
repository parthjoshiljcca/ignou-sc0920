"use server";

import { and, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin, requireStudent } from "@/lib/auth";
import { ASSIGNMENT_TERMS, TERM_RE } from "@/lib/assignment-status";
import { notifyAdmins, notifyUsers } from "@/lib/notify";
import {
  acceptingTerms, checkPin, existingCourses, lookupStudent, parseCourses, pinBlocked, recordSubmissions,
  setSetting, submissionSettings, termSortKey,
} from "@/lib/submissions";
import type { FormState } from "./auth";

const today = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10); // IST date

function refresh() {
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/assignments/settings");
  revalidatePath("/assignments");
}

/* ============================ coordinator ============================ */

export async function saveSubmissionSettingsAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const enabled = fd.get("enabled") === "on";
  const pin = String(fd.get("pin") ?? "").trim();
  const current = await submissionSettings();
  if (pin && !/^\d{4,6}$/.test(pin)) return { error: "PIN must be 4 to 6 digits" };
  if (enabled && !pin && !current.pin) return { error: "Set a PIN first — students need it to submit from the app." };
  if (pin) await setSetting("submission_pin", pin);
  await setSetting("student_submissions_enabled", enabled ? "true" : "false");
  refresh();
  return { ok: `Student submissions are now ${enabled ? "ON" : "OFF"}.${pin ? " PIN updated." : ""}` };
}

export async function addTermAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const term = z.enum(ASSIGNMENT_TERMS).safeParse(fd.get("term"));
  const year = Number(fd.get("year"));
  if (!term.success || !Number.isInteger(year) || year < 2020 || year > 2100) return { error: "Choose June or December and a year" };
  const name = `${term.data} ${year}`;
  const res = await db
    .insert(schema.assignmentTerms)
    .values({ name, sortKey: termSortKey(name), accepting: true })
    .onConflictDoNothing()
    .returning({ id: schema.assignmentTerms.id });
  refresh();
  return res.length ? { ok: `Added term ${name}` } : { error: `${name} already exists` };
}

export async function toggleTermAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  await db.update(schema.assignmentTerms).set({ accepting: sql`not ${schema.assignmentTerms.accepting}` }).where(eq(schema.assignmentTerms.id, id));
  refresh();
}

/** Used by the coordinator's entry form to fill in a student's details. */
export async function lookupStudentAction(enrollmentNo: string, term: string) {
  await requireAdmin();
  const e = enrollmentNo.replace(/\D/g, "");
  if (!/^\d{9,10}$/.test(e)) return { error: "Enter a 9 or 10 digit enrolment number" } as const;
  const s = await lookupStudent(e);
  const already = TERM_RE.test(term) ? await existingCourses(term, e) : [];
  return { enrollmentNo: e, ...s, already } as const;
}

const Entry = z.object({
  enrollmentNo: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().regex(/^\d{9,10}$/, "Enter a 9 or 10 digit enrolment number")),
  term: z.string().regex(TERM_RE, "Choose the term"),
  submittedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the submission date"),
  courses: z.string().min(1, "Add at least one course"),
  name: z.string().trim().max(120).optional(),
  programme: z.string().trim().max(40).optional(),
  mobile: z.string().optional(),
  email: z.string().trim().max(200).optional(),
});

export async function recordSubmissionAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const p = Entry.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  if (d.submittedOn > today()) return { error: "Submission date can't be in the future" };
  const [term] = await db.select().from(schema.assignmentTerms).where(eq(schema.assignmentTerms.name, d.term));
  if (!term) return { error: "Unknown term" };
  const { ok: courses, bad } = parseCourses(d.courses);
  if (bad.length) return { error: `Not a course code: ${bad.join(", ")} (use e.g. MCS-211)` };
  if (!courses.length) return { error: "Add at least one course" };
  if (courses.length > 15) return { error: "At most 15 courses at a time" };

  const s = await lookupStudent(d.enrollmentNo);
  let programme = s.found ? s.programme : null;
  if (!s.found) {
    // New student: add them to the student list so they can also sign in later.
    const name = (d.name ?? "").replace(/\s+/g, " ");
    const mobile = (d.mobile ?? "").replace(/\D/g, "").slice(-10);
    const prog = (d.programme ?? "").toUpperCase().replace(/\s+/g, "");
    if (name.length < 3) return { error: "Enter the student's full name" };
    if (!prog) return { error: "Enter the programme (e.g. MCA_NEW, BBA)" };
    if (!/^[6-9]\d{9}$/.test(mobile)) return { error: "Enter a valid 10-digit mobile number (the student's first-login password)" };
    const email = d.email && z.email().safeParse(d.email.toLowerCase()).success ? d.email.toLowerCase() : null;
    await db
      .insert(schema.roster)
      .values({ enrollmentNo: d.enrollmentNo, name: name.toUpperCase(), programme: prog, mobile, email, admissionYear: 2000 + Number(d.enrollmentNo.slice(0, 2)) })
      .onConflictDoNothing();
    programme = prog;
  }

  const r = await recordSubmissions({ term: d.term, enrollmentNo: d.enrollmentNo, programme, courses, submittedOn: d.submittedOn });
  if (!r.added.length) return { error: `All these courses are already recorded for ${d.term}: ${r.skipped.join(", ")}` };

  const [u] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.enrollmentNo, d.enrollmentNo));
  if (u) {
    await notifyUsers([u.id], {
      title: `Assignments received · TEE ${d.term}`,
      body: `${r.added.join(", ")} recorded at the study centre. Your receipt is ready.`,
      url: "/assignments",
    });
  }
  refresh();
  redirect(`/receipt/${r.receipt.id}?new=1`);
}

export async function approveRequestAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const [q] = await db.select().from(schema.assignmentRequests).where(and(eq(schema.assignmentRequests.id, id), eq(schema.assignmentRequests.status, "pending")));
  if (!q) return;
  const s = await lookupStudent(q.enrollmentNo);
  const r = await recordSubmissions({ term: q.term, enrollmentNo: q.enrollmentNo, programme: s.found ? s.programme : null, courses: q.courses, submittedOn: q.submittedOn });
  await db
    .update(schema.assignmentRequests)
    .set({ status: "approved", decidedBy: admin.id, decidedAt: new Date(), note: r.skipped.length ? `Already recorded: ${r.skipped.join(", ")}` : null })
    .where(eq(schema.assignmentRequests.id, id));
  if (q.userId) {
    await notifyUsers([q.userId], {
      title: `Assignments approved · TEE ${q.term}`,
      body: `${q.courses.join(", ")} — status: Received. Your receipt ${r.receipt.receiptNo} is ready.`,
      url: "/assignments",
    });
  }
  refresh();
}

export async function rejectRequestAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const note = String(fd.get("note") ?? "").trim().slice(0, 300) || null;
  const [q] = await db
    .update(schema.assignmentRequests)
    .set({ status: "rejected", decidedBy: admin.id, decidedAt: new Date(), note })
    .where(and(eq(schema.assignmentRequests.id, id), eq(schema.assignmentRequests.status, "pending")))
    .returning();
  if (q?.userId) {
    await notifyUsers([q.userId], {
      title: `Assignment submission not approved · TEE ${q.term}`,
      body: note ? `Reason: ${note}` : "Please contact the study centre.",
      url: "/assignments",
    });
  }
  refresh();
}

/* ============================== student ============================== */

export async function createSubmissionRequestAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireStudent();
  const settings = await submissionSettings();
  if (!settings.enabled || !settings.pin) return { error: "Submissions from the app are closed right now." };
  if (!u.enrollmentNo) return { error: "Your account has no enrolment number." };

  const term = String(fd.get("term") ?? "");
  const open = await acceptingTerms();
  if (!open.some((t) => t.name === term)) return { error: "Choose a term that is open for submission" };

  const { ok: courses, bad } = parseCourses(String(fd.get("courses") ?? ""));
  if (bad.length) return { error: `Not a course code: ${bad.join(", ")} (write like MCS-211)` };
  if (!courses.length) return { error: "Add the course codes of the assignments you are submitting" };
  if (courses.length > 15) return { error: "At most 15 courses at a time" };

  const already = new Set(await existingCourses(term, u.enrollmentNo));
  const pending = await db
    .select({ courses: schema.assignmentRequests.courses })
    .from(schema.assignmentRequests)
    .where(and(eq(schema.assignmentRequests.enrollmentNo, u.enrollmentNo), eq(schema.assignmentRequests.term, term), eq(schema.assignmentRequests.status, "pending")));
  pending.forEach((p) => p.courses.forEach((c) => already.add(c)));
  const fresh = courses.filter((c) => !already.has(c));
  if (!fresh.length) return { error: `Already submitted for ${term}: ${courses.join(", ")}` };

  if (await pinBlocked(u.id)) return { error: "Too many wrong PIN attempts. Try again after 30 minutes." };
  const pin = String(fd.get("pin") ?? "").trim();
  if (!(await checkPin(u.id, pin, settings.pin))) return { error: "Wrong PIN. Ask the coordinator at the study centre for the submission PIN." };

  await db.insert(schema.assignmentRequests).values({ term, enrollmentNo: u.enrollmentNo, userId: u.id, courses: fresh, submittedOn: today() });
  await notifyAdmins({
    title: `Assignment submission to approve · ${term}`,
    body: `${u.name} (${u.enrollmentNo}): ${fresh.join(", ")}`,
    url: "/admin/assignments",
  });
  refresh();
  redirect("/assignments?requested=1");
}

export async function cancelRequestAction(fd: FormData) {
  const u = await requireStudent();
  await db
    .update(schema.assignmentRequests)
    .set({ status: "cancelled", decidedAt: new Date() })
    .where(and(eq(schema.assignmentRequests.id, Number(fd.get("id"))), eq(schema.assignmentRequests.userId, u.id), eq(schema.assignmentRequests.status, "pending")));
  refresh();
}
