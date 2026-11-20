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
  if (existing) {
    await db
      .update(schema.users)
      .set({ role: "admin", name, passwordHash, isActive: true, mustChangePassword: true })
      .where(eq(schema.users.id, existing.id));
    console.log(`Updated coordinator account: ${email}`);
  } else {
    await db.insert(schema.users).values({ role: "admin", name, email, passwordHash, mustChangePassword: true });
    console.log(`Created coordinator account: ${email}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
