import { config } from "dotenv";
config({ path: ".env.local" });
config();

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
  const { db, schema } = await import("../src/db");
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Assistant Coordinator";
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local");
  if (password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters");

  const passwordHash = await bcrypt.hash(password, 10);
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  const reset = process.argv.includes("--reset-admin");
  if (existing && !reset) {
    // Never touch a live coordinator's password unless explicitly asked.
    console.log(`Coordinator account exists: ${email} (password unchanged; use --reset-admin to reset it)`);
  } else if (existing) {
    await db
      .update(schema.users)
      .set({ role: "admin", name, passwordHash, isActive: true, mustChangePassword: true })
      .where(eq(schema.users.id, existing.id));
    console.log(`Reset coordinator password to ADMIN_PASSWORD: ${email}`);
  } else {
    await db.insert(schema.users).values({ role: "admin", name, email, passwordHash, mustChangePassword: true });
    console.log(`Created coordinator account: ${email}`);
  }

  // Default FAQs (from IGNOU's official FAQ document); only missing ones are added.
  const { DEFAULT_FAQS } = await import("../src/lib/default-faqs");
  const existingQ = new Set((await db.select({ q: schema.faqs.question }).from(schema.faqs)).map((r) => r.q.trim().toLowerCase()));
  const missing = DEFAULT_FAQS.map((f, i) => ({ ...f, link: f.link ?? null, sortOrder: i * 10 })).filter((f) => !existingQ.has(f.question.toLowerCase()));
  if (missing.length) await db.insert(schema.faqs).values(missing);
  console.log(`FAQs: added ${missing.length}, already present ${DEFAULT_FAQS.length - missing.length}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
