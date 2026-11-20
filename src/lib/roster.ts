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
  dob: string; // YYYY-MM-DD
  courses: string[];
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

function toIsoDate(v: ExcelJS.CellValue): string | null {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") return new Date(Math.round((v - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
  const s = cellText(v).trim();
  let m = s.match(/^(\d{4})-?(\d{2})-?(\d{2})(?:$|T|\s)/); // YYYY-MM-DD or YYYYMMDD
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/); // DD/MM/YYYY
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

/**
 * Parse an IGNOU admission export (.xlsx). Reads only the columns needed for onboarding:
 * Enrolment Number, Name, Programme, Email, Mobile, Date of Birth, CRS1..CRSn.
 * Every other column (Aadhaar, bank, category, income, address, …) is ignored.
 */
export async function parseRosterXlsx(buf: ArrayBuffer | Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("The file has no sheets.");

  const header = ws.getRow(1);
  const cols: Record<string, number> = {};
  const courseCols: number[] = [];
  header.eachCell((cell, col) => {
    const h = norm(cellText(cell.value));
    if (/^crs\d+$/.test(h)) courseCols.push(col);
    else if (!(h in cols)) cols[h] = col;
  });
  const pick = (...names: string[]) => names.map(norm).map((n) => cols[n]).find(Boolean);
  const c = {
    enrol: pick("Enrolment Number", "Enrollment Number", "Enrolment No", "Enrollment No"),
    name: pick("Name", "Student Name"),
    programme: pick("Programme", "Program"),
    email: pick("Email", "Email ID"),
    mobile: pick("Mobile", "Mobile Number"),
    dob: pick("Date of Birth", "DOB"),
    status: pick("Admission Status"),
  };
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
    const dob = toIsoDate(get(c.dob));
    const programme = cellText(get(c.programme)).trim().toUpperCase();
    if (!/^\d{9,10}$/.test(enrollmentNo)) return skipped.push(`Row ${i}: invalid enrolment number`);
    if (!name || !programme || !dob) return skipped.push(`Row ${i}: missing name, programme or date of birth`);
    const mobile = cellText(get(c.mobile)).replace(/\D/g, "").slice(-10) || null;
    const email = cellText(get(c.email)).trim().toLowerCase() || null;
    const courses = [
      ...new Set(courseCols.map((col) => cellText(row.getCell(col).value).trim().toUpperCase()).filter(Boolean)),
    ];
    rows.push({ enrollmentNo, name, programme, email, mobile, dob, courses });
  });
  return { rows, skipped };
}

/** Upsert parsed rows into the roster and refresh programme/courses of already-activated students. */
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
          dob: sql`excluded.dob`,
          courses: sql`excluded.courses`,
          importedAt: sql`excluded.imported_at`,
        },
      });
  }
  await db.execute(sql`
    update users u set programme = r.programme, courses = r.courses
    from roster r where u.enrollment_no = r.enrollment_no and u.role = 'student'
  `);
  return rows.length;
}
