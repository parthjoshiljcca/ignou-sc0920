import { config } from "dotenv"; config({ path: ".env.local", quiet: true });
import { readFile } from "node:fs/promises";
(async () => {
  const { db } = await import("../src/db");
  const { parseAssignmentsXlsx, importAssignments } = await import("../src/lib/assignments");
  const [file, session, status] = process.argv.slice(2);
  const { rows, skipped } = await parseAssignmentsXlsx(await readFile(file));
  const r = await importAssignments(db, session, rows, status as never);
  console.log(`Imported ${r.rows} course submissions for ${r.students} students: ${r.added} new; ${r.receipts} receipts created; skipped ${skipped.length}. Marks not read.`);
  process.exit(0);
})();
