/**
 * Enforce CAPITALS in the database for identity/record fields, whatever code writes them,
 * and convert existing rows. Safe to run again (idempotent).
 *   npm run db:uppercase
 * Not changed on purpose: passwords, PINs, links, messages/notices/FAQs. Emails are stored lowercase.
 */
import { config } from "dotenv"; config({ path: ".env.local", quiet: true });
import { sql } from "drizzle-orm";

const TRIGGERS: Record<string, string> = {
  roster: `
    NEW.name := nullif(upper(btrim(regexp_replace(NEW.name, '\\s+', ' ', 'g'))), '');
    NEW.address := nullif(upper(btrim(regexp_replace(NEW.address, '\\s+', ' ', 'g'))), '');
    NEW.programme := upper(btrim(NEW.programme));
    NEW.email := lower(btrim(NEW.email));`,
  users: `
    NEW.name := upper(btrim(regexp_replace(NEW.name, '\\s+', ' ', 'g')));
    NEW.programme := upper(btrim(NEW.programme));
    NEW.email := lower(btrim(NEW.email));`,
  counselling_sessions: `
    NEW.course_code := upper(btrim(NEW.course_code));
    NEW.programme := upper(btrim(NEW.programme));
    NEW.title := nullif(upper(btrim(NEW.title)), '');
    NEW.counsellor := nullif(upper(btrim(NEW.counsellor)), '');
    NEW.venue := nullif(upper(btrim(NEW.venue)), '');`,
  assignment_submissions: `
    NEW.course_code := upper(btrim(NEW.course_code));
    NEW.programme := upper(btrim(NEW.programme));`,
  assignment_receipts: `
    NEW.student_name := nullif(upper(btrim(NEW.student_name)), '');`,
  assignment_requests: `
    NEW.courses := array(select upper(btrim(c)) from unnest(NEW.courses) with ordinality as t(c, i) order by i);`,
};

const BACKFILL: Record<string, string> = {
  roster: `name is distinct from upper(name) or address is distinct from upper(address) or programme is distinct from upper(programme) or email is distinct from lower(email)`,
  users: `name is distinct from upper(name) or programme is distinct from upper(programme) or email is distinct from lower(email)`,
  counselling_sessions: `course_code is distinct from upper(course_code) or programme is distinct from upper(programme) or title is distinct from upper(title) or counsellor is distinct from upper(counsellor) or venue is distinct from upper(venue)`,
  assignment_submissions: `course_code is distinct from upper(course_code) or programme is distinct from upper(programme)`,
  assignment_receipts: `student_name is distinct from upper(student_name)`,
  assignment_requests: `array_to_string(courses, ',') is distinct from upper(array_to_string(courses, ','))`,
};

(async () => {
  const { db } = await import("../src/db");
  for (const [table, body] of Object.entries(TRIGGERS)) {
    const fn = `sc_caps_${table}`;
    await db.execute(sql.raw(`create or replace function ${fn}() returns trigger language plpgsql as $$ begin ${body} return NEW; end $$;`));
    await db.execute(sql.raw(`drop trigger if exists ${fn} on ${table};`));
    await db.execute(sql.raw(`create trigger ${fn} before insert or update on ${table} for each row execute function ${fn}();`));
    // Touch only rows that are not yet in capitals; the trigger rewrites them.
    const r = await db.execute(sql.raw(`with u as (update ${table} set ${table === "users" ? "name = name" : table === "assignment_requests" ? "courses = courses" : table === "assignment_receipts" ? "student_name = student_name" : table === "roster" ? "name = name" : "course_code = course_code"} where ${BACKFILL[table]} returning 1) select count(*)::int n from u`));
    console.log(`${table.padEnd(24)} trigger on · rows converted: ${(r.rows[0] as { n: number }).n}`);
  }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
