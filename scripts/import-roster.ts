import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { readFile } from "node:fs/promises";

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: npm run roster:import -- path/to/admission-export.xlsx");
  const { db } = await import("../src/db");
  const { parseRosterXlsx, upsertRoster } = await import("../src/lib/roster");
  const { rows, skipped } = await parseRosterXlsx(await readFile(file));
  const n = await upsertRoster(db, rows);
  console.log(`Imported ${n} students into the roster.`);
  if (skipped.length) console.log(`Skipped ${skipped.length}:\n  ${skipped.join("\n  ")}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e.message ?? e); process.exit(1); });
