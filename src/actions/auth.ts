"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { eq, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { createSession, destroySession, requireUser } from "@/lib/auth";

export type FormState = { error?: string; ok?: string } | undefined;

const ActivateSchema = z.object({
  enrollmentNo: z.string().trim().regex(/^\d{9,10}$/, "Enrolment number must be 9 or 10 digits"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter your date of birth"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

/** Student onboarding: verify enrolment number + DOB against the admission roster, then set a password. */
export async function activateAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = ActivateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const [r] = await db.select().from(schema.roster).where(eq(schema.roster.enrollmentNo, d.enrollmentNo)).limit(1);
  if (!r || r.dob !== d.dob) {
    return { error: "We couldn't match this enrolment number and date of birth with the Study Centre 0920 admission list. Check both, or raise it with the centre." };
  }

  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.enrollmentNo, r.enrollmentNo))
    .limit(1);
  if (existing) return { error: "This account is already activated. Please sign in." };

  // The roster email is used for login when free; otherwise the student signs in with their enrolment number.
  let email = r.email ?? `${r.enrollmentNo}@students.sc0920.local`;
  const [emailTaken] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (emailTaken) email = `${r.enrollmentNo}@students.sc0920.local`;

  const passwordHash = await bcrypt.hash(d.password, 10);
  const [u] = await db
    .insert(schema.users)
    .values({
      name: r.name,
      enrollmentNo: r.enrollmentNo,
      programme: r.programme,
      courses: r.courses,
      email,
      phone: r.mobile,
      passwordHash,
    })
    .returning({ id: schema.users.id });

  await db.insert(schema.notifications).values({
    userId: u.id,
    title: "Welcome to SC 0920",
    body: "Raise a query any time from the Help Desk. Turn on notifications to hear about classes and replies.",
    url: "/dashboard",
  });

  await createSession({ uid: u.id, role: "student" });
  redirect("/dashboard?welcome=1");
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const id = String(fd.get("identifier") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const next = String(fd.get("next") ?? "");
  if (!id || !password) return { error: "Enter your email or enrollment number and password" };

  const [u] = await db
    .select()
    .from(schema.users)
    .where(or(eq(schema.users.email, id), eq(schema.users.enrollmentNo, id)))
    .limit(1);
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) return { error: "Incorrect login details" };
  if (!u.isActive) return { error: "This account has been deactivated. Please contact the study centre." };

  await createSession({ uid: u.id, role: u.role });
  const home = u.role === "admin" ? "/admin" : "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "";
  const allowed = safeNext && (u.role === "admin" ? safeNext.startsWith("/admin") : !safeNext.startsWith("/admin"));
  redirect(allowed ? safeNext : home);
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
