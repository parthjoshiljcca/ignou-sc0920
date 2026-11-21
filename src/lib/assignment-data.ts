import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { db, schema } from "@/db";

export type ReceiptData = {
  receipt: typeof schema.assignmentReceipts.$inferSelect;
  rows: (typeof schema.assignmentSubmissions.$inferSelect)[];
  student: { name: string | null; enrollmentNo: string; programme: string | null };
};

/** All assignment sessions for one student, newest first, each with its receipt and course rows. */
export async function studentAssignments(enrollmentNo: string) {
  const S = schema.assignmentSubmissions;
  const R = schema.assignmentReceipts;
  const [rows, receipts] = await Promise.all([
    db.select().from(S).where(eq(S.enrollmentNo, enrollmentNo)).orderBy(asc(S.submittedOn), asc(S.courseCode)),
    db.select().from(R).where(eq(R.enrollmentNo, enrollmentNo)).orderBy(desc(R.createdAt)),
  ]);
  return receipts.map((receipt) => ({ receipt, rows: rows.filter((r) => r.session === receipt.session) }));
}

async function load(where: ReturnType<typeof eq>): Promise<ReceiptData | null> {
  const R = schema.assignmentReceipts;
  const S = schema.assignmentSubmissions;
  const [receipt] = await db.select().from(R).where(where).limit(1);
  if (!receipt) return null;
  const [rows, [ro], [u]] = await Promise.all([
    db.select().from(S).where(eq(S.session, receipt.session)).then((all) => all.filter((r) => r.enrollmentNo === receipt.enrollmentNo).sort((a, b) => a.submittedOn.localeCompare(b.submittedOn) || a.courseCode.localeCompare(b.courseCode))),
    db.select({ name: schema.roster.name, programme: schema.roster.programme }).from(schema.roster).where(eq(schema.roster.enrollmentNo, receipt.enrollmentNo)),
    db.select({ name: schema.users.name, programme: schema.users.programme }).from(schema.users).where(eq(schema.users.enrollmentNo, receipt.enrollmentNo)),
  ]);
  const name = ro?.name ?? (u?.name && !u.name.startsWith("Student ") ? u.name : null);
  return { receipt, rows, student: { name, enrollmentNo: receipt.enrollmentNo, programme: ro?.programme ?? u?.programme ?? rows[0]?.programme ?? null } };
}

export const receiptById = (id: number) => load(eq(schema.assignmentReceipts.id, id));
export const receiptByVerifyCode = (code: string) => load(eq(schema.assignmentReceipts.verifyCode, code));

export async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "sc0920.edumark.app";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function qrSvg(text: string) {
  return QRCode.toString(text, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#111827", light: "#ffffff" } });
}

