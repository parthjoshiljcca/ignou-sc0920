import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

/**
 * Wakes the database. The free Neon database sleeps after a few idle minutes and the first query
 * then waits for it to start; the sign-in and landing pages call this as soon as they open, so the
 * database is awake by the time the user submits. Returns nothing.
 */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
  } catch {
    // waking is best-effort
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
