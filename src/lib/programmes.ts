import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/** Programme codes currently on the roster or held by registered students. */
export async function getProgrammes(): Promise<string[]> {
  const res = await db.execute<{ p: string }>(sql`
    select distinct programme as p from roster
    union select distinct programme from users where programme is not null
    order by 1
  `);
  return res.rows.map((r) => r.p);
}

/** Course codes already used in the schedule, for quick re-entry. */
export async function getCourseCodes(): Promise<string[]> {
  const res = await db.execute<{ c: string }>(sql`select distinct course_code as c from counselling_sessions order by 1`);
  return res.rows.map((r) => r.c);
}
