import ExcelJS from "exceljs";
import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { TERM_RE } from "@/lib/assignment-status";

export const dynamic = "force-dynamic";

/**
 * Download a term's submissions in the study centre's assignment sheet format:
 * SR NO | Enrollment No | Date | Name | Programme Title | Course | Marks (left blank — never stored).
 * SR NO and Date are written on the first row of each student (Date again if it changes).
 */
export async function GET(req: Request) {
  const s = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s || s.role !== "admin") return new Response("Not allowed", { status: 403 });
  const term = new URL(req.url).searchParams.get("term") ?? "";
  if (!TERM_RE.test(term)) return new Response("Unknown term", { status: 400 });

  const rows = (
    await db.execute<{ enrollment_no: string; name: string | null; programme: string | null; course_code: string; submitted_on: string; serial: number }>(sql`
      select s.enrollment_no, coalesce(r.name, rc.student_name) name,
             coalesce(s.programme, replace(r.programme, '_', '')) programme,
             s.course_code, s.submitted_on::text submitted_on,
             coalesce(nullif(split_part(rc.receipt_no, '/', 3), '')::int, 99999) serial
      from assignment_submissions s
      left join roster r on r.enrollment_no = s.enrollment_no
      left join assignment_receipts rc on rc.session = s.session and rc.enrollment_no = s.enrollment_no
      where s.session = ${term}
      order by rc.file_order nulls last, serial, s.enrollment_no, s.submitted_on, s.course_code`)
  ).rows;

  const wb = new ExcelJS.Workbook();
  wb.creator = "IGNOU SC 0920 app";
  const ws = wb.addWorksheet("Sheet1");
  ws.columns = [
    { header: "SR NO", key: "sr", width: 4.9 },
    { header: "Enrollment No", key: "en", width: 14.7 },
    { header: "Date", key: "date", width: 10.6, style: { numFmt: "mm-dd-yy" } },
    { header: "Name", key: "name", width: 39 },
    { header: "Programme Title", key: "prog", width: 11.6 },
    { header: "Course", key: "course", width: 12.2 },
    { header: "Marks", key: "marks", width: 9.1 },
  ];
  const head = ws.getRow(1);
  head.font = { name: "Calibri", size: 11, bold: true };
  head.alignment = { horizontal: "center", vertical: "middle" };

  let sr = 0, lastEn = "", lastDate = "";
  for (const r of rows) {
    const first = r.enrollment_no !== lastEn;
    if (first) sr++;
    const showDate = first || r.submitted_on !== lastDate;
    const [y, m, d] = r.submitted_on.split("-").map(Number);
    ws.addRow({
      sr: first ? sr : null,
      en: Number(r.enrollment_no),
      date: showDate ? new Date(Date.UTC(y, m - 1, d)) : null,
      name: r.name ?? "",
      prog: r.programme ?? "",
      course: r.course_code,
      marks: null,
    });
    lastEn = r.enrollment_no;
    lastDate = r.submitted_on;
  }

  const buf = await wb.xlsx.writeBuffer();
  const file = `ASSIGNMENT - ${term.toUpperCase()}.xlsx`;
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
    },
  });
}
