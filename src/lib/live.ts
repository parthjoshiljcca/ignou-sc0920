import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * A tiny fingerprint of everything this user can see (queries, replies, notices, classes, FAQs,
 * notifications and, for the coordinator, student counts). It changes whenever any of that changes.
 * The page is rendered with the fingerprint of its data, and the open app polls /api/live:
 * if the two differ, the page refreshes itself.
 */
export async function liveFingerprint(uid: number, role: "student" | "admin"): Promise<string> {
  const shared = sql`
    (select count(*) || ':' || coalesce(max(id), 0) || ':' || count(*) filter (where pinned) from announcements),
    (select md5(coalesce(string_agg(cs.id || '|' || cs.starts_at || '|' || cs.ends_at || '|' || cs.mode || '|' || coalesce(cs.venue, '') || '|' || coalesce(cs.meeting_link, '') || '|' || coalesce(cs.title, '') || '|' || cs.programme || '|' || cs.course_code, ',' order by cs.id), ''))
       from counselling_sessions cs where cs.ends_at > now() - interval '60 days'),
    (select count(*) || ':' || coalesce(max(updated_at)::text, '') || ':' || count(*) filter (where is_published) from faqs),
    (select count(*) || ':' || coalesce(max(id), 0) || ':' || count(*) filter (where not is_read) from notifications where user_id = ${uid})`;

  const personal =
    role === "admin"
      ? sql`
    (select count(*) || ':' || coalesce(max(updated_at)::text, '') from tickets),
    (select coalesce(max(id), 0)::text from ticket_messages),
    (select count(*) || ':' || count(*) filter (where not must_change_password) || ':' || count(*) filter (where is_active) from users where role = 'student'),
    (select count(*)::text from roster),
    (select count(*) || ':' || coalesce(max(status_updated_at)::text, '') from assignment_submissions),
    (select count(*) || ':' || coalesce(max(id), 0) || ':' || count(*) filter (where status = 'pending') from assignment_requests),
    (select coalesce(string_agg(key || '=' || value, ',' order by key), '') from app_settings where key <> 'submission_pin'),
    (select coalesce(string_agg(name || accepting::text, ',' order by id), '') from assignment_terms)`
      : sql`
    (select count(*) || ':' || coalesce(max(updated_at)::text, '') from tickets where student_id = ${uid}),
    (select coalesce(max(m.id), 0)::text from ticket_messages m join tickets t on t.id = m.ticket_id where t.student_id = ${uid}),
    (select programme from users where id = ${uid}),
    (select count(*) || ':' || coalesce(max(status_updated_at)::text, '') from assignment_submissions
       where enrollment_no = (select enrollment_no from users where id = ${uid})),
    (select count(*) || ':' || coalesce(max(coalesce(decided_at, created_at))::text, '') from assignment_requests
       where enrollment_no = (select enrollment_no from users where id = ${uid})),
    (select coalesce(string_agg(key || '=' || value, ',' order by key), '') from app_settings where key <> 'submission_pin'),
    (select coalesce(string_agg(name || accepting::text, ',' order by id), '') from assignment_terms)`;

  const r = await db.execute<{ v: string }>(sql`select md5(concat_ws('#', ${shared}, ${personal})) as v`);
  return r.rows[0]?.v ?? "";
}
