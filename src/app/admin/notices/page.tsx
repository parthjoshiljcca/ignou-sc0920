import { desc } from "drizzle-orm";
import { Pin, PinOff, Trash2 } from "lucide-react";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { getProgrammes } from "@/lib/programmes";
import { deleteNoticeAction, togglePinAction } from "@/actions/admin";
import { Card, PageHeader, Pill, btnClass } from "@/components/ui";
import { ConfirmSubmit } from "@/components/form-bits";
import { NoticeForm } from "@/components/admin/notice-form";

export const metadata = { title: "Notices" };

export default async function AdminNotices() {
  await requireAdmin();
  const [rows, programmes] = await Promise.all([
    db.select().from(schema.announcements).orderBy(desc(schema.announcements.pinned), desc(schema.announcements.createdAt)).limit(200),
    getProgrammes(),
  ]);
  return (
    <>
      <PageHeader title="Notices & notifications" subtitle="Post an announcement. Students get an in-app notification and a push alert on their phones." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="p-4 sm:p-6 lg:sticky lg:top-8 lg:self-start">
          <h2 className="mb-4 font-bold">New notice</h2>
          <NoticeForm programmes={programmes} />
        </Card>
        <section className="space-y-3">
          <h2 className="font-bold">Published ({rows.length})</h2>
          {rows.length === 0 && <Card className="p-5 text-sm text-muted">Nothing published yet.</Card>}
          {rows.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                {n.pinned && <Pill tone="accent">Pinned</Pill>}
                <Pill tone="primary">{n.audience === "ALL" ? "All students" : n.audience}</Pill>
                <span className="text-xs text-muted">{fmtDateTime(n.createdAt)}</span>
              </div>
              <p className="mt-2 font-semibold">{n.title}</p>
              <p className="prose-msg mt-1 line-clamp-4 text-sm text-muted">{n.body}</p>
              <div className="mt-3 flex gap-2">
                <form action={togglePinAction}>
                  <input type="hidden" name="id" value={n.id} />
                  <button className={btnClass("secondary", "min-h-9 px-3")}>{n.pinned ? <><PinOff className="size-4" aria-hidden /> Unpin</> : <><Pin className="size-4" aria-hidden /> Pin</>}</button>
                </form>
                <form action={deleteNoticeAction}>
                  <input type="hidden" name="id" value={n.id} />
                  <ConfirmSubmit message="Delete this notice?" className={btnClass("danger", "min-h-9 px-3")}><Trash2 className="size-4" aria-hidden /> Delete</ConfirmSubmit>
                </form>
              </div>
            </Card>
          ))}
        </section>
      </div>
    </>
  );
}
