import "server-only";
import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import { db, schema } from "@/db";
import { ensureReceipts } from "./assignments";
import { TERM_RE } from "./assignment-status";
import { isPlaceholderName } from "./text";

/* ------------------------------ settings ------------------------------ */

export async function getSetting(key: string) {
  const [r] = await db.select({ v: schema.appSettings.value }).from(schema.appSettings).where(eq(schema.appSettings.key, key));
  return r?.v ?? null;
}

export async function setSetting(key: string, value: string) {
  await db
    .insert(schema.appSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.appSettings.key, set: { value, updatedAt: new Date() } });
}

export async function submissionSettings() {
  const rows = await db.select().from(schema.appSettings).where(inArray(schema.appSettings.key, ["student_submissions_enabled", "submission_pin"]));
  const get = (k: string) => rows.find((r) => r.key === k)?.value ?? null;
  const pin = get("submission_pin");
  return { enabled: get("student_submissions_enabled") === "true" && !!pin, switchOn: get("student_submissions_enabled") === "true", pin };
}

/* -------------------------------- terms ------------------------------- */

export function termSortKey(name: string) {
  const m = name.match(TERM_RE);
  if (!m) return 0;
  return Number(m[2]) * 100 + (m[1] === "June" ? 6 : 12);
}

export async function listTerms() {
  return db.select().from(schema.assignmentTerms).orderBy(desc(schema.assignmentTerms.sortKey));
}

export async function acceptingTerms() {
  return db
    .select()
    .from(schema.assignmentTerms)
    .where(eq(schema.assignmentTerms.accepting, true))
    .orderBy(asc(schema.assignmentTerms.sortKey));
}

/* ------------------------------- courses ------------------------------ */

/** "mcs 211" / "MCS211" / "mcs-211" → "MCS-211"; returns null if it isn't a course code. */
export function normalizeCourse(raw: string) {
  const s = raw.trim().toUpperCase().replace(/\s+/g, "");
  const m = s.match(/^([A-Z]{2,8})-?(\d{1,4}[A-Z]{0,2})$/);
  return m ? `${m[1]}-${m[2]}` : null;
}

export function parseCourses(raw: string) {
  const parts = raw.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
  const ok: string[] = [];
  const bad: string[] = [];
  for (const p of parts) {
    const c = normalizeCourse(p);
    if (c) {
      if (!ok.includes(c)) ok.push(c);
    } else bad.push(p);
  }
  return { ok, bad };
}

/** Course codes seen for a programme (for suggestions), most common first. */
export async function courseSuggestions(programme: string | null) {
  const res = await db.execute<{ c: string }>(sql`
    select s.course_code c from assignment_submissions s left join roster r on r.enrollment_no = s.enrollment_no
    where ${programme ? sql`coalesce(r.programme, s.programme) = ${programme} or replace(coalesce(r.programme, ''), '_', '') = replace(${programme}, '_', '') or s.programme = replace(${programme}, '_', '')` : sql`true`}
    group by s.course_code order by count(*) desc, s.course_code limit 60`);
  return res.rows.map((r) => r.c);
}

/* ------------------------------- students ----------------------------- */

export async function lookupStudent(enrollmentNo: string) {
  const [r] = await db.select().from(schema.roster).where(eq(schema.roster.enrollmentNo, enrollmentNo));
  const [u] = await db
    .select({ id: schema.users.id, name: schema.users.name })
    .from(schema.users)
    .where(eq(schema.users.enrollmentNo, enrollmentNo));
  const prog = (await db.execute<{ p: string }>(sql`select programme p from assignment_submissions where enrollment_no = ${enrollmentNo} and programme is not null limit 1`)).rows[0]?.p ?? null;
  if (!r) return { found: false as const, programmeHint: prog };
  return {
    found: true as const,
    name: r.name ?? (u?.name && !isPlaceholderName(u.name) ? u.name : null),
    programme: r.programme,
    mobile: r.mobile,
    email: r.email,
    onApp: !!u,
  };
}

/** Courses already recorded for a student in a term (to avoid duplicates). */
export async function existingCourses(term: string, enrollmentNo: string) {
  const rows = await db
    .select({ c: schema.assignmentSubmissions.courseCode })
    .from(schema.assignmentSubmissions)
    .where(and(eq(schema.assignmentSubmissions.session, term), eq(schema.assignmentSubmissions.enrollmentNo, enrollmentNo)));
  return rows.map((r) => r.c);
}

/**
 * Record submissions as received (coordinator entry or an approved student request).
 * Skips courses already recorded for the term. Creates the receipt if needed.
 */
export async function recordSubmissions(opts: { term: string; enrollmentNo: string; programme: string | null; courses: string[]; submittedOn: string }) {
  const already = new Set(await existingCourses(opts.term, opts.enrollmentNo));
  const add = opts.courses.filter((c) => !already.has(c));
  if (add.length) {
    await db
      .insert(schema.assignmentSubmissions)
      .values(add.map((c) => ({ session: opts.term, enrollmentNo: opts.enrollmentNo, programme: opts.programme?.replace(/_/g, "") ?? null, courseCode: c, submittedOn: opts.submittedOn, status: "received" as const })))
      .onConflictDoNothing();
  }
  await ensureReceipts(db, opts.term);
  const [receipt] = await db
    .select({ id: schema.assignmentReceipts.id, receiptNo: schema.assignmentReceipts.receiptNo })
    .from(schema.assignmentReceipts)
    .where(and(eq(schema.assignmentReceipts.session, opts.term), eq(schema.assignmentReceipts.enrollmentNo, opts.enrollmentNo)));
  return { added: add, skipped: opts.courses.filter((c) => already.has(c)), receipt };
}

/* --------------------------------- PIN -------------------------------- */

export async function pinBlocked(userId: number) {
  const since = new Date(Date.now() - 30 * 60 * 1000);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.pinFailures)
    .where(and(eq(schema.pinFailures.userId, userId), gte(schema.pinFailures.at, since)));
  return n >= 5;
}

export async function checkPin(userId: number, given: string, pin: string) {
  const a = Buffer.from(given.padEnd(16).slice(0, 16));
  const b = Buffer.from(pin.padEnd(16).slice(0, 16));
  const ok = given.length === pin.length && timingSafeEqual(a, b);
  if (!ok) await db.insert(schema.pinFailures).values({ userId });
  return ok;
}

export async function pendingRequests() {
  return db.execute<{
    id: number; term: string; enrollment_no: string; courses: string[]; submitted_on: string; created_at: string;
    name: string | null; programme: string | null;
  }>(sql`
    select q.id, q.term, q.enrollment_no, q.courses, q.submitted_on, q.created_at,
           coalesce(r.name, (select student_name from assignment_receipts x where x.enrollment_no = q.enrollment_no and x.student_name is not null limit 1)) name, r.programme
    from assignment_requests q left join roster r on r.enrollment_no = q.enrollment_no
    where q.status = 'pending' order by q.created_at`);
}

/** Every course code the centre has seen, most common first (for type-ahead). */
export async function allCourseCodes() {
  const res = await db.execute<{ c: string }>(sql`select course_code c from assignment_submissions group by course_code order by count(*) desc, course_code`);
  return res.rows.map((r) => r.c);
}
