import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export type MissingFields = { name: boolean; address: boolean; email: boolean };
const NONE: MissingFields = { name: false, address: false, email: false };

/**
 * Details the admission/re-registration file did not give us for this student.
 * They are optional at import time but compulsory on the student's first sign-in.
 */
export async function missingProfileFields(enrollmentNo: string | null): Promise<MissingFields> {
  if (!enrollmentNo) return NONE;
  const [r] = await db
    .select({ name: schema.roster.name, address: schema.roster.address, email: schema.roster.email })
    .from(schema.roster)
    .where(eq(schema.roster.enrollmentNo, enrollmentNo));
  if (!r) return NONE;
  return { name: !r.name, address: !r.address, email: !r.email };
}

export const anyMissing = (m: MissingFields) => m.name || m.address || m.email;
