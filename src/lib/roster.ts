import ExcelJS from "exceljs";
import { sql } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

export type ParsedRosterRow = {
  enrollmentNo: string;
  name: string | null;
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
 * Parse an IGNOU student list (.xlsx). Reads only the columns needed for onboarding:
 * Enrolment Number, Name, Programme, year of admission, Mobile, Email, Address.
 * Works with the fresh-admission export, the re-registration export and transfer lists (which may lack
 * Name/Address — those students enter them on first sign-in). Every sheet in the workbook is read;
 * rows for other study centres are skipped. Every other column (Aadhaar, bank, DOB, category, religion,
 * income, course codes, …) is ignored.
 */
export async function parseRosterXlsx(buf: ArrayBuffer | Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as ArrayBuffer);
  if (!wb.worksheets.length) throw new Error("The file has no sheets.");

  const byEnrol = new Map<string, ParsedRosterRow>();
  const skipped: string[] = [];
  let usableSheets = 0;
  let lastMissing: string[] = [];

  for (const ws of wb.worksheets) {
    const cols: Record<string, number> = {};
    ws.getRow(1).eachCell((cell, col) => {
      const h = norm(cellText(cell.value));
      if (h && !(h in cols)) cols[h] = col;
    });
    const pick = (...names: string[]) => names.map(norm).map((n) => cols[n]).find(Boolean);
    const c = {
      enrol: pick("Enrolment Number", "Enrollment Number", "Enrolment No", "Enrollment No"),
      programme: pick("Programme", "Programme Code", "Program"),
      mobile: pick("Mobile", "Mobile Number"),
    };
    const opt = {
      name: pick("Name", "Student Name"),
      email: pick("Email", "Email ID"),
      status: pick("Admission Status"),
      centre: pick("New SC", "New Study Centre", "Study Center", "Study Centre", "Ou ID"),
    };
    const yearCols = ["Year Of Enrolment", "Admission Year", "Adm Date", "Start Session", "Payment Date", "Declaration Acceptance Date"]
      .map((n) => cols[norm(n)]).filter(Boolean);
    const addrCols = ["Address", "Address Line 1", "Address Line 2", "Address Line 3", "Address Line 4", "Address City", "Address District", "Address State", "Address Pincode"]
      .map((n) => cols[norm(n)]).filter(Boolean);
    const missing = Object.entries(c).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length) {
      // Not a student list (e.g. a notes sheet) — skip it, but remember why in case no sheet works.
      if (ws.rowCount > 1) lastMissing = missing;
      continue;
    }
    usableSheets++;
    const where = wb.worksheets.length > 1 ? `${ws.name} row` : "Row";

    ws.eachRow((row, i) => {
      if (i === 1) return;
      const get = (col?: number) => (col ? row.getCell(col).value : null);
      const enrollmentNo = cellText(get(c.enrol)).replace(/\D/g, "");
      const name = cellText(get(opt.name)).trim().replace(/\s+/g, " ") || null;
      if (!enrollmentNo && !name) return;
      if (opt.status) {
        const st = cellText(get(opt.status)).toLowerCase();
        if (st && !st.includes("confirm")) return skipped.push(`${where} ${i}: admission not confirmed`);
      }
      if (opt.centre) {
        const centre = cellText(get(opt.centre)).replace(/\D/g, "");
        if (centre && centre !== "0920") return skipped.push(`${where} ${i}: belongs to study centre ${centre}`);
      }
      const programme = cellText(get(c.programme)).trim().toUpperCase();
      if (!/^\d{9,10}$/.test(enrollmentNo)) return skipped.push(`${where} ${i}: invalid enrolment number`);
      if (!programme) return skipped.push(`${where} ${i}: missing programme`);
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
      if (!mobile) return skipped.push(`${where} ${i}: missing mobile number (needed for first login)`);
      const email = cellText(get(opt.email)).trim().toLowerCase() || null;

      const next: ParsedRosterRow = { enrollmentNo, name, programme, admissionYear, email, mobile, address };
      const prev = byEnrol.get(enrollmentNo);
      // Same student on several sheets: keep the first value of each field, fill gaps from later sheets.
      byEnrol.set(enrollmentNo, prev ? {
        enrollmentNo,
        name: prev.name ?? next.name,
        programme: prev.programme || next.programme,
        admissionYear: prev.admissionYear ?? next.admissionYear,
        email: prev.email ?? next.email,
        mobile: prev.mobile ?? next.mobile,
        address: prev.address ?? next.address,
      } : next);
    });
  }

  if (!usableSheets) {
    throw new Error(`Missing columns: ${lastMissing.join(", ") || "enrolment number, programme, mobile"}. Upload an IGNOU admission, re-registration or transfer list.`);
  }
  return { rows: [...byEnrol.values()], skipped };
}

export type ImportMode = "update" | "fillBlanks";

/**
 * Save parsed rows into the roster.
 * - "fillBlanks" (default): add new students; for students already present only fill details that are empty.
 * - "update": also overwrite existing details with the file's values (a blank in the file never wipes data).
 */
export async function upsertRoster(db: NeonHttpDatabase<typeof schema>, rows: ParsedRosterRow[], mode: ImportMode = "fillBlanks") {
  const R = schema.roster;
  const keep = mode === "fillBlanks";
  const merge = (ex: ReturnType<typeof sql>, cur: typeof R.name | typeof R.email | typeof R.mobile | typeof R.admissionYear | typeof R.address) =>
    keep ? sql`coalesce(${cur}, ${ex})` : sql`coalesce(${ex}, ${cur})`;

  const before = new Set(
    (await db.select({ e: R.enrollmentNo }).from(R)).map((r) => r.e),
  );
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    await db
      .insert(R)
      .values(batch.map((r) => ({ ...r, importedAt: new Date() })))
      .onConflictDoUpdate({
        target: R.enrollmentNo,
        set: {
          name: merge(sql`excluded.name`, R.name),
          programme: keep ? sql`${R.programme}` : sql`excluded.programme`,
          email: merge(sql`excluded.email`, R.email),
          mobile: merge(sql`excluded.mobile`, R.mobile),
          admissionYear: merge(sql`excluded.admission_year`, R.admissionYear),
          address: merge(sql`excluded.address`, R.address),
          importedAt: keep ? sql`${R.importedAt}` : sql`excluded.imported_at`,
        },
      });
  }
  await db.execute(sql`
    update users u set programme = r.programme, name = coalesce(r.name, u.name)
    from roster r where u.enrollment_no = r.enrollment_no and u.role = 'student'
  `);
  const added = rows.filter((r) => !before.has(r.enrollmentNo)).length;
  return { total: rows.length, added, existing: rows.length - added };
}
