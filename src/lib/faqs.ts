import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { FAQ_CATEGORIES } from "./default-faqs";

export async function getPublishedFaqs() {
  return db
    .select({ id: schema.faqs.id, category: schema.faqs.category, question: schema.faqs.question, answer: schema.faqs.answer, link: schema.faqs.link })
    .from(schema.faqs)
    .where(eq(schema.faqs.isPublished, true))
    .orderBy(asc(schema.faqs.sortOrder), asc(schema.faqs.id));
}

/** Known categories first (in order), then any custom ones the coordinator added. */
export function orderedCategories(used: string[]) {
  const known = FAQ_CATEGORIES.filter((c) => used.includes(c)) as string[];
  return [...known, ...[...new Set(used)].filter((c) => !known.includes(c)).sort()];
}

/** Which FAQ categories help with each Help Desk query category. */
export const TICKET_TO_FAQ: Record<string, string[]> = {
  "Admission / Re-registration": ["Admission & Student Portal", "Re-registration"],
  Assignments: ["Assignments & Exams"],
  "Study Material": ["Study Material"],
  "Exam Form / Hall Ticket": ["Assignments & Exams"],
  "Result / Grade Card": ["Results & Grade Card"],
  "Counselling Classes": ["Counselling & Study Centre"],
  "Practicals / Lab": ["Counselling & Study Centre"],
  "Fee / Refund": ["Fee, Refund & Scholarships"],
  "Degree / Certificate": ["Certificates & Credit Transfer", "Changes & Corrections"],
  "ID Card": ["ID Card"],
};
