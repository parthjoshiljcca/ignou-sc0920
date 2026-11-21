import ExcelJS from "exceljs";
import { randomBytes } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import { ASSIGNMENT_STATUSES, type AssignmentStatus } from "./assignment-status";

type DB = NeonHttpDatabase<typeof schema>;

export type ParsedAssignment = { enrollmentNo: string; programme: string | null; courseCode: string; submittedOn: string };

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    if ("text" in v && v.text != null) return String(v.text);
    if ("result" in v && v.result != null) return cellText(v.result as ExcelJS.CellValue);
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
  }
  return String(v);
}

function toIsoDate(v: ExcelJS.CellValue): string | null {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") return new Date(Math.round((v - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
  const s = cellText(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/); // DD/MM/YYYY or DD.MM.YY
  if (m) return `${m[3].length === 2 ? "20" + m[3] : m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

/**
 * Read an assignment submission sheet. Uses only Enrolment No, Date, Programme and Course.
 * The Name and Marks columns are never read, so marks can never reach the database.
 * Dates written once per student (merged/blank cells below) are carried down.
 */
export async function parseAssignmentsXlsx(buf: ArrayBuffer | Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as ArrayBuffer);
  const byKey = new Map<string, ParsedAssignment>();
  const skipped: string[] = [];
  let usable = 0;

  for (const ws of wb.worksheets) {
    const cols: Record<string, number> = {};
    ws.getRow(1).eachCell((cell, col) => {
      const h = norm(cellText(cell.value));
      if (h && !(h in cols)) cols[h] = col;
    });
    const pick = (...names: string[]) => names.map(norm).map((n) => cols[n]).find(Boolean);
    const c = {
      enrol: pick("Enrollment No", "Enrolment No", "Enrolment Number", "Enrollment Number"),
      course: pick("Course", "Course Code"),
      date: pick("Date", "Submission Date", "Date of Submission", "Received On"),
    };
    if (!c.enrol || !c.course) continue; // e.g. an evaluator allocation sheet
    usable++;
    const progCol = pick("Programme Title", "Programme", "Programme Code", "Program");
    let lastDate: string | null = null;
    let lastEnrol = "";

    ws.eachRow((row, i) => {
      if (i === 1) return;
      const get = (col?: number) => (col ? row.getCell(col).value : null);
      const enrollmentNo = cellText(get(c.enrol)).replace(/\D/g, "");
      const courseCode = cellText(get(c.course)).trim().toUpperCase().replace(/\s+/g, "");
      if (!enrollmentNo && !courseCode) return;
      const d = c.date ? toIsoDate(get(c.date)) : null;
      if (d) lastDate = d;
      else if (enrollmentNo !== lastEnrol && !lastDate) {
        skipped.push(`${ws.name} row ${i}: no submission date`);
        return;
      }
      lastEnrol = enrollmentNo;
      if (!/^\d{9,10}$/.test(enrollmentNo)) return skipped.push(`${ws.name} row ${i}: invalid enrolment number`);
      if (!courseCode) return skipped.push(`${ws.name} row ${i}: missing course`);
      const submittedOn = d ?? lastDate!;
      const programme = cellText(get(progCol)).trim().toUpperCase() || null;
      const key = `${enrollmentNo}|${courseCode}`;
      const prev = byKey.get(key);
      // Same course listed twice: keep the earliest submission date.
      if (!prev || submittedOn < prev.submittedOn) byKey.set(key, { enrollmentNo, programme: programme ?? prev?.programme ?? null, courseCode, submittedOn });
    });
  }
  if (!usable) throw new Error("No sheet with 'Enrollment No' and 'Course' columns was found.");
  return { rows: [...byKey.values()], skipped };
}

/** Short code used inside receipt numbers, e.g. "September 2026-27" → "SEP2627". */
export function sessionCode(session: string) {
  const mon = session.match(/[A-Za-z]{3}/)?.[0]?.toUpperCase() ?? "ASG";
  const years = (session.match(/\d{2,4}/g) ?? []).map((y) => y.slice(-2)).join("");
  return (mon + years).slice(0, 12) || "ASG";
}

/** Create receipts for students in a session who don't have one yet (numbered by first submission date). */
export async function ensureReceipts(db: DB, session: string) {
  const S = schema.assignmentSubmissions;
  const R = schema.assignmentReceipts;
  const missing = await db.execute<{ enrollment_no: string }>(sql`
    select s.enrollment_no from ${S} s
    where s.session = ${session}
      and not exists (select 1 from ${R} r where r.session = s.session and r.enrollment_no = s.enrollment_no)
    group by s.enrollment_no
    order by min(s.submitted_on), s.enrollment_no`);
  if (!missing.rows.length) return 0;
  const [{ n }] = (await db.execute<{ n: number }>(sql`select count(*)::int n from ${R} where session = ${session}`)).rows;
  const code = sessionCode(session);
  const values = missing.rows.map((m, i) => ({
    session,
    enrollmentNo: m.enrollment_no,
    receiptNo: `SC0920/${code}/${String(n + i + 1).padStart(4, "0")}`,
    verifyCode: randomBytes(9).toString("base64url"),
  }));
  for (let i = 0; i < values.length; i += 300) {
    await db.insert(R).values(values.slice(i, i + 300)).onConflictDoNothing();
  }
  return values.length;
}

/**
 * Save parsed submissions. New rows get `initialStatus`; rows already present keep their status
 * (re-uploading the same file never resets progress). Returns counts.
 */
export async function importAssignments(db: DB, session: string, rows: ParsedAssignment[], initialStatus: AssignmentStatus) {
  if (!ASSIGNMENT_STATUSES.some((s) => s.key === initialStatus)) throw new Error("Unknown status");
  const S = schema.assignmentSubmissions;
  const before = (await db.select({ n: sql<number>`count(*)::int` }).from(S).where(eq(S.session, session)))[0].n;
  for (let i = 0; i < rows.length; i += 300) {
    await db
      .insert(S)
      .values(rows.slice(i, i + 300).map((r) => ({ ...r, session, status: initialStatus })))
      .onConflictDoUpdate({
        target: [S.session, S.enrollmentNo, S.courseCode],
        set: { submittedOn: sql`least(${S.submittedOn}, excluded.submitted_on)`, programme: sql`coalesce(${S.programme}, excluded.programme)` },
      });
  }
  const after = (await db.select({ n: sql<number>`count(*)::int` }).from(S).where(eq(S.session, session)))[0].n;
  const receipts = await ensureReceipts(db, session);
  const students = new Set(rows.map((r) => r.enrollmentNo)).size;
  return { rows: rows.length, added: after - before, students, receipts };
}

/** Move submissions of a session (optionally one programme/course) to a new status. Returns affected enrolments. */
export async function setAssignmentStatus(
  db: DB,
  opts: { session: string; status: AssignmentStatus; programme?: string; courseCode?: string },
) {
  const S = schema.assignmentSubmissions;
  const conds = [eq(S.session, opts.session), sql`${S.status} <> ${opts.status}`];
  if (opts.courseCode) conds.push(eq(S.courseCode, opts.courseCode));
  if (opts.programme) {
    conds.push(sql`(${S.programme} = ${opts.programme} or ${S.enrollmentNo} in (select enrollment_no from roster where programme = ${opts.programme}))`);
  }
  const changed = await db
    .update(S)
    .set({ status: opts.status, statusUpdatedAt: new Date() })
    .where(and(...conds))
    .returning({ e: S.enrollmentNo });
  return [...new Set(changed.map((c) => c.e))];
}

export async function userIdsForEnrolments(db: DB, enrolments: string[]) {
  if (!enrolments.length) return [];
  const out: number[] = [];
  for (let i = 0; i < enrolments.length; i += 500) {
    const rows = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(and(inArray(schema.users.enrollmentNo, enrolments.slice(i, i + 500)), eq(schema.users.isActive, true)));
    out.push(...rows.map((r) => r.id));
  }
  return out;
}
