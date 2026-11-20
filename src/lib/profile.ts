import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

/** What the roster is missing for this student (re-registration exports have no name/address). */
export async function missingProfileFields(enrollmentNo: string | null) {
  if (!enrollmentNo) return { name: false, address: false };
  const [r] = await db
    .select({ name: schema.roster.name, address: schema.roster.address })
    .from(schema.roster)
    .where(eq(schema.roster.enrollmentNo, enrollmentNo));
  return { name: !r?.name, address: !r?.address };
}
