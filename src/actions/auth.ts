"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { eq, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { createSession, destroySession, requireUser } from "@/lib/auth";
import { missingProfileFields } from "@/lib/profile";

export type FormState = { error?: string; ok?: string } | undefined;

const digits = (v: string) => v.replace(/\D/g, "");
/** Compare a typed mobile number with the roster one, ignoring +91, spaces and leading 0. */
const sameMobile = (typed: string, onFile: string | null) => !!onFile && digits(typed).slice(-10) === digits(onFile).slice(-10) && digits(typed).length >= 10;

/** Create the student's account from the roster on their first sign-in (password = registered mobile). */
async function firstLoginFromRoster(enrollmentNo: string, password: string) {
  const [r] = await db.select().from(schema.roster).where(eq(schema.roster.enrollmentNo, enrollmentNo)).limit(1);
  if (!r || !sameMobile(password, r.mobile)) return null;

  let email = r.email ?? `${r.enrollmentNo}@students.sc0920.local`;
  const [emailTaken] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (emailTaken) email = `${r.enrollmentNo}@students.sc0920.local`;

  const [u] = await db
    .insert(schema.users)
    .values({
      name: r.name ?? `Student ${r.enrollmentNo}`,
      enrollmentNo: r.enrollmentNo,
      programme: r.programme,
      email,
      phone: r.mobile,
      passwordHash: await bcrypt.hash(digits(r.mobile!).slice(-10), 10),
      mustChangePassword: true,
    })
    .onConflictDoNothing()
    .returning();
  if (!u) return null;
  await db.insert(schema.notifications).values({
    userId: u.id,
    title: "Welcome to SC 0920",
    body: "Raise a query any time from the Help Desk. Turn on notifications to hear about classes and replies.",
    url: "/dashboard",
  });
  return u;
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const id = String(fd.get("identifier") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "").trim();
  const next = String(fd.get("next") ?? "");
  if (!id || !password) return { error: "Enter your enrolment number and password" };

  let [u] = await db
    .select()
    .from(schema.users)
    .where(or(eq(schema.users.email, id), eq(schema.users.enrollmentNo, id)))
    .limit(1);

  if (!u) {
    const created = /^\d{9,10}$/.test(id) ? await firstLoginFromRoster(id, password) : null;
    if (!created) {
      return { error: "Incorrect enrolment number or password. First time? Your password is the mobile number you gave in your IGNOU admission form." };
    }
    u = created;
  } else {
    const ok = (await bcrypt.compare(password, u.passwordHash)) || (u.mustChangePassword && (await bcrypt.compare(digits(password).slice(-10), u.passwordHash)));
    if (!ok) return { error: "Incorrect enrolment number or password" };
  }
  if (!u.isActive) return { error: "This account has been deactivated. Please contact the study centre." };

  await createSession({ uid: u.id, role: u.role, mcp: u.mustChangePassword });
  if (u.mustChangePassword) redirect("/set-password");
  const home = u.role === "admin" ? "/admin" : "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "";
  const allowed = safeNext && (u.role === "admin" ? safeNext.startsWith("/admin") : !safeNext.startsWith("/admin"));
  redirect(allowed ? safeNext : home);
}

const SetPassword = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters").max(100),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match" });

/** Mandatory step after the first sign-in with the mobile-number password. */
export async function setFirstPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const parsed = SetPassword.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { password } = parsed.data;
  if (u.phone && digits(password).slice(-10) === digits(u.phone).slice(-10) && /^\+?\d+$/.test(password)) {
    return { error: "Choose a password that is different from your mobile number" };
  }

  // Students imported from a re-registration list must give their name and address once.
  const need = u.role === "student" ? await missingProfileFields(u.enrollmentNo) : { name: false, address: false };
  const fullName = String(fd.get("fullName") ?? "").trim().replace(/\s+/g, " ");
  const address = String(fd.get("address") ?? "").trim().replace(/\s+/g, " ");
  if (need.name && (fullName.length < 3 || fullName.length > 120 || !/^[\p{L} .'-]+$/u.test(fullName))) {
    return { error: "Enter your full name as on your IGNOU identity card (letters only)" };
  }
  if (need.address && (address.length < 10 || address.length > 500)) {
    return { error: "Enter your full postal address with city and PIN code" };
  }

  await db
    .update(schema.users)
    .set({
      passwordHash: await bcrypt.hash(password, 10),
      mustChangePassword: false,
      ...(need.name ? { name: fullName.toUpperCase() } : {}),
    })
    .where(eq(schema.users.id, u.id));
  if (u.enrollmentNo && (need.name || need.address)) {
    await db
      .update(schema.roster)
      .set({ ...(need.name ? { name: fullName.toUpperCase() } : {}), ...(need.address ? { address } : {}) })
      .where(eq(schema.roster.enrollmentNo, u.enrollmentNo));
  }
  await createSession({ uid: u.id, role: u.role, mcp: false });
  redirect(u.role === "admin" ? "/admin" : "/dashboard?welcome=1");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const ProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number").or(z.literal("")),
});

export async function updateProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const parsed = ProfileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db
    .update(schema.users)
    .set({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
    })
    .where(eq(schema.users.id, u.id));
  return { ok: "Profile saved" };
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next.length < 8) return { error: "New password must be at least 8 characters" };
  if (!(await bcrypt.compare(current, u.passwordHash))) return { error: "Current password is incorrect" };
  await db.update(schema.users).set({ passwordHash: await bcrypt.hash(next, 10) }).where(eq(schema.users.id, u.id));
  return { ok: "Password changed" };
}
