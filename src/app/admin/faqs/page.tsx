import { asc } from "drizzle-orm";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import clsx from "clsx";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { orderedCategories } from "@/lib/faqs";
import { FAQ_CATEGORIES } from "@/lib/default-faqs";
import { deleteFaqAction, toggleFaqAction } from "@/actions/faqs";
import { Card, PageHeader, Pill, btnClass } from "@/components/ui";
import { ConfirmSubmit } from "@/components/form-bits";
import { FaqForm, RestoreDefaults } from "@/components/admin/faq-forms";
import type { Faq } from "@/db/schema";

export const metadata = { title: "FAQs" };

export default async function AdminFaqs() {
  await requireAdmin();
  const rows = await db.select().from(schema.faqs).orderBy(asc(schema.faqs.sortOrder), asc(schema.faqs.id));
  const cats = orderedCategories(rows.map((r) => r.category));
  const allCats = [...new Set([...FAQ_CATEGORIES, ...cats])];
  const groups = new Map<string, Faq[]>();
  for (const r of rows) groups.set(r.category, [...(groups.get(r.category) ?? []), r]);
  const published = rows.filter((r) => r.isPublished).length;

  return (
    <>
      <PageHeader title="FAQs" subtitle={`${published} published of ${rows.length}. Students see these under FAQs and as suggestions while raising a query.`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <Card className="p-4 sm:p-6">
            <h2 className="mb-4 font-bold">Add a question</h2>
            <FaqForm categories={allCats} />
          </Card>
          <Card className="p-4 sm:p-5">
            <p className="text-sm text-muted">The default answers come from IGNOU&apos;s official FAQ document. Deleted one by mistake? This adds back any that are missing, without touching your edits.</p>
            <div className="mt-3"><RestoreDefaults /></div>
          </Card>
        </div>
        <div className="space-y-6">
          {cats.map((c) => (
            <section key={c}>
              <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{c}</h2>
              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                {groups.get(c)!.map((f) => (
                  <details key={f.id} className="group">
                    <summary className={clsx("flex cursor-pointer list-none items-start gap-2 px-4 py-3 hover:bg-surface-2 [&::-webkit-details-marker]:hidden", !f.isPublished && "opacity-60")}>
                      <span className="flex-1 text-sm font-semibold">{f.question}</span>
                      {!f.isPublished && <Pill>Hidden</Pill>}
                    </summary>
                    <div className="space-y-3 border-t border-border bg-bg/40 p-4">
                      <FaqForm faq={f} categories={allCats} />
                      <div className="flex gap-2 border-t border-border pt-3">
                        <form action={toggleFaqAction}>
                          <input type="hidden" name="id" value={f.id} />
                          <button className={btnClass("secondary", "min-h-9 px-3")}>
                            {f.isPublished ? <><EyeOff className="size-4" aria-hidden /> Hide</> : <><Eye className="size-4" aria-hidden /> Publish</>}
                          </button>
                        </form>
                        <form action={deleteFaqAction}>
                          <input type="hidden" name="id" value={f.id} />
                          <ConfirmSubmit message="Delete this FAQ?" className={btnClass("danger", "min-h-9 px-3")}><Trash2 className="size-4" aria-hidden /> Delete</ConfirmSubmit>
                        </form>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
          {rows.length === 0 && <Card className="p-5 text-sm text-muted">No FAQs yet. Use “Restore missing IGNOU FAQs” to load the defaults.</Card>}
        </div>
      </div>
    </>
  );
}
