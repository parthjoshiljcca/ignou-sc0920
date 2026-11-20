"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_FAQS } from "@/lib/default-faqs";
import type { FormState } from "./auth";

const FaqSchema = z.object({
  category: z.string().trim().min(2, "Choose a category").max(60),
  question: z.string().trim().min(5, "Question is too short").max(500),
  answer: z.string().trim().min(5, "Write the answer").max(5000),
  link: z.union([z.url("Link must be a full URL"), z.literal("")]).optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

function refresh() {
  revalidatePath("/admin/faqs");
  revalidatePath("/faqs");
}

export async function saveFaqAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = FaqSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const id = Number(fd.get("id") || 0);
  const values = { category: d.category, question: d.question, answer: d.answer, link: d.link || null, updatedAt: new Date() };
  if (id) {
    await db.update(schema.faqs).set({ ...values, ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}) }).where(eq(schema.faqs.id, id));
  } else {
    await db.insert(schema.faqs).values({ ...values, sortOrder: d.sortOrder ?? 999 });
  }
  refresh();
  return { ok: id ? "FAQ updated" : "FAQ added" };
}

export async function deleteFaqAction(fd: FormData) {
  await requireAdmin();
  await db.delete(schema.faqs).where(eq(schema.faqs.id, Number(fd.get("id"))));
  refresh();
}

export async function toggleFaqAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const [f] = await db.select().from(schema.faqs).where(eq(schema.faqs.id, id));
  if (f) await db.update(schema.faqs).set({ isPublished: !f.isPublished }).where(eq(schema.faqs.id, id));
  refresh();
}

/** Add any default IGNOU FAQs that are missing (matched by question text). Never overwrites edits. */
export async function restoreDefaultFaqsAction(_: FormState): Promise<FormState> {
  await requireAdmin();
  const n = await insertMissingDefaultFaqs();
  refresh();
  return { ok: n ? `Added ${n} FAQ${n === 1 ? "" : "s"}` : "All default FAQs are already present" };
}

export async function insertMissingDefaultFaqs() {
  const existing = new Set((await db.select({ q: schema.faqs.question }).from(schema.faqs)).map((r) => r.q.trim().toLowerCase()));
  const missing = DEFAULT_FAQS.map((f, i) => ({ ...f, link: f.link ?? null, sortOrder: i * 10 })).filter(
    (f) => !existing.has(f.question.trim().toLowerCase()),
  );
  if (missing.length) await db.insert(schema.faqs).values(missing);
  return missing.length;
}
