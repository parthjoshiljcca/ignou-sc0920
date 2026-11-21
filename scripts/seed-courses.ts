/** Load src/data/programme-courses.json into the programme_courses table (safe to re-run). */
import { config } from "dotenv"; config({ path: ".env.local", quiet: true });
import { readFile } from "node:fs/promises";
import { sql } from "drizzle-orm";

(async () => {
  const { db, schema } = await import("../src/db");
  const { courses } = JSON.parse(await readFile("src/data/programme-courses.json", "utf8")) as {
    courses: { programme: string; code: string; title: string | null; credits: number | null; term: string | null; source: string }[];
  };
  for (let i = 0; i < courses.length; i += 300) {
    await db
      .insert(schema.programmeCourses)
      .values(courses.slice(i, i + 300).map((c) => ({ programme: c.programme, courseCode: c.code, title: c.title, credits: c.credits, term: c.term, source: c.source })))
      .onConflictDoUpdate({
        target: [schema.programmeCourses.programme, schema.programmeCourses.courseCode],
        set: { title: sql`coalesce(excluded.title, ${schema.programmeCourses.title})`, credits: sql`coalesce(excluded.credits, ${schema.programmeCourses.credits})`, term: sql`coalesce(excluded.term, ${schema.programmeCourses.term})`, source: sql`excluded.source` },
      });
  }
  const [r] = (await db.execute(sql`select count(*)::int n, count(distinct programme)::int p, count(distinct course_code)::int c from programme_courses`)).rows as { n: number; p: number; c: number }[];
  console.log(`programme_courses: ${r.n} rows · ${r.p} programmes · ${r.c} distinct courses`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
