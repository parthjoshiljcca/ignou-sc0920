import "server-only";
import { and, asc, eq, gte, inArray, lt, or, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import type { User } from "@/db/schema";

/** Sessions relevant to a student: their programme, "ALL", or any of their enrolled course codes. */
export function sessionsForStudent(u: User, opts: { upcoming: boolean; limit?: number }) {
  const s = schema.counsellingSessions;
  const match: SQL[] = [eq(s.programme, "ALL")];
  if (u.programme) match.push(eq(s.programme, u.programme));
  if (u.courses?.length) match.push(inArray(s.courseCode, u.courses));
  const now = new Date();
  const q = db
    .select()
    .from(s)
    .where(and(or(...match), opts.upcoming ? gte(s.endsAt, now) : lt(s.endsAt, now)))
    .orderBy(opts.upcoming ? asc(s.startsAt) : asc(s.startsAt));
  return opts.limit ? q.limit(opts.limit) : q;
}
