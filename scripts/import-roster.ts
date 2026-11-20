import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { readFile } from "node:fs/promises";

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: npm run roster:import -- path/to/list.xlsx [--update-existing]");
  const { db } = await import("../src/db");
  const { parseRosterXlsx, upsertRoster } = await import("../src/lib/roster");
  const mode = process.argv.includes("--update-existing") ? "update" : "fillBlanks";
  const { rows, skipped } = await parseRosterXlsx(await readFile(file));
  const r = await upsertRoster(db, rows, mode);
  console.log(`Read ${r.total} students: ${r.added} added, ${r.existing} already present (${mode === "update" ? "details updated" : "only empty details filled"}).`);
  if (skipped.length) console.log(`Skipped ${skipped.length}:\n  ${skipped.join("\n  ")}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e.message ?? e); process.exit(1); });
