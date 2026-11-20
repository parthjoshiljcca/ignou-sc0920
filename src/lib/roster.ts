import ExcelJS from "exceljs";
import { sql } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

export type ParsedRosterRow = {
  enrollmentNo: string;
  name: string;
  programme: string;
  email: string | null;
  mobile: string | null;
  admissionYear: number | null;
  address: string | null;
};

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

function yearOf(v: ExcelJS.CellValue): number | null {
  if (v instanceof Date) return v.getUTCFullYear();
  const m = cellText(v).match(/\b(20\d{2})/);
  return m ? Number(m[1]) : null;
}

/**
 * Parse an IGNOU admission export (.xlsx). Reads only the columns needed for onboarding:
 * Enrolment Number, Name, Programme, year of admission, Mobile, Email, Address.
 * Every other column (Aadhaar, bank, DOB, category, religion, income, course codes, …) is ignored.
 */
export async function parseRosterXlsx(buf: ArrayBuffer | Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("The file has no sheets.");

  const header = ws.getRow(1);
  const cols: Record<string, number> = {};
  header.eachCell((cell, col) => {
    const h = norm(cellText(cell.value));
    if (!(h in cols)) cols[h] = col;
  });
  const pick = (...names: string[]) => names.map(norm).map((n) => cols[n]).find(Boolean);
  const c = {
    enrol: pick("Enrolment Number", "Enrollment Number", "Enrolment No", "Enrollment No"),
    name: pick("Name", "Student Name"),
    programme: pick("Programme", "Program"),
    email: pick("Email", "Email ID"),
    mobile: pick("Mobile", "Mobile Number"),
    status: pick("Admission Status"),
  };
  const yearCols = ["Adm Date", "Start Session", "Admission Year", "Year of Enrolment", "Payment Date", "Declaration Acceptance Date"]
    .map((n) => cols[norm(n)]).filter(Boolean);
  const addrCols = ["Address", "Address Line 1", "Address Line 2", "Address Line 3", "Address Line 4", "Address City", "Address District", "Address State", "Address Pincode"]
    .map((n) => cols[norm(n)]).filter(Boolean);
  const missing = Object.entries(c).filter(([k, v]) => !v && k !== "status").map(([k]) => k);
  if (missing.length) throw new Error(`Missing columns: ${missing.join(", ")}. Upload the standard admission export.`);

  const rows: ParsedRosterRow[] = [];
  const skipped: string[] = [];
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const get = (col?: number) => (col ? row.getCell(col).value : null);
    const enrollmentNo = cellText(get(c.enrol)).replace(/\D/g, "");
    const name = cellText(get(c.name)).trim().replace(/\s+/g, " ");
    if (!enrollmentNo && !name) return;
    if (c.status) {
      const st = cellText(get(c.status)).toLowerCase();
      if (st && !st.includes("confirm")) return skipped.push(`Row ${i}: admission not confirmed`);
    }
    const programme = cellText(get(c.programme)).trim().toUpperCase();
    if (!/^\d{9,10}$/.test(enrollmentNo)) return skipped.push(`Row ${i}: invalid enrolment number`);
    if (!name || !programme) return skipped.push(`Row ${i}: missing name or programme`);
    const admissionYear =
      yearCols.map((col) => yearOf(get(col))).find((y) => y !== null) ??
      (/^\d{2}/.test(enrollmentNo) ? 2000 + Number(enrollmentNo.slice(0, 2)) : null);
    const parts: string[] = [];
    for (const col of addrCols) {
      const t = cellText(get(col)).trim().replace(/\s+/g, " ").replace(/^,+|,+$/g, "").trim();
      if (t && !parts.some((p) => p.toLowerCase() === t.toLowerCase())) parts.push(t);
    }
    const address = parts.join(", ") || null;
    const mobile = cellText(get(c.mobile)).replace(/\D/g, "").slice(-10) || null;
    const email = cellText(get(c.email)).trim().toLowerCase() || null;
    rows.push({ enrollmentNo, name, programme, admissionYear, email, mobile, address });
  });
  return { rows, skipped };
}

/** Upsert parsed rows into the roster and refresh the details of already signed-in students. */
export async function upsertRoster(db: NeonHttpDatabase<typeof schema>, rows: ParsedRosterRow[]) {
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    await db
      .insert(schema.roster)
      .values(batch.map((r) => ({ ...r, importedAt: new Date() })))
      .onConflictDoUpdate({
        target: schema.roster.enrollmentNo,
        set: {
          name: sql`excluded.name`,
          programme: sql`excluded.programme`,
          email: sql`excluded.email`,
          mobile: sql`excluded.mobile`,
          admissionYear: sql`excluded.admission_year`,
          address: sql`excluded.address`,
          importedAt: sql`excluded.imported_at`,
        },
      });
  }
  await db.execute(sql`
    update users u set programme = r.programme, name = r.name
    from roster r where u.enrollment_no = r.enrollment_no and u.role = 'student'
  `);
  return rows.length;
}
