import { desc, eq, or } from "drizzle-orm";
import { ExternalLink, Megaphone, Pin } from "lucide-react";
import { db, schema } from "@/db";
import { requireStudent } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { Card, EmptyState, PageHeader, Pill } from "@/components/ui";

export const metadata = { title: "Notices" };

export default async function Notices() {
  const u = await requireStudent();
  const rows = await db.select().from(schema.announcements)
    .where(or(eq(schema.announcements.audience, "ALL"), eq(schema.announcements.audience, u.programme ?? "")))
    .orderBy(desc(schema.announcements.pinned), desc(schema.announcements.createdAt)).limit(100);

  return (
    <>
      <PageHeader title="Notices" subtitle="Announcements from the study centre." />
      {rows.length === 0 ? (
        <EmptyState icon={<Megaphone className="size-6" />} title="No notices yet" />
      ) : (
        <div className="space-y-3">
          {rows.map((n) => (
            <Card key={n.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                {n.pinned && <Pill tone="accent"><Pin className="size-3" aria-hidden /> Pinned</Pill>}
                {n.audience !== "ALL" && <Pill tone="primary">{n.audience}</Pill>}
                <span className="text-xs text-muted">{fmtDate(n.createdAt)}</span>
              </div>
              <h2 className="mt-2 text-lg font-bold">{n.title}</h2>
              <p className="prose-msg mt-1 text-[15px] leading-relaxed text-muted">{n.body}</p>
              {n.link && (
                <a href={n.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                  Open link <ExternalLink className="size-4" aria-hidden />
                </a>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
