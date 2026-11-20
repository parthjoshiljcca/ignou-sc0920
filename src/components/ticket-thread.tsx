import clsx from "clsx";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { fmtDateTime } from "@/lib/format";

export async function TicketThread({ ticketId, viewerId }: { ticketId: number; viewerId: number }) {
  const msgs = await db
    .select({
      id: schema.ticketMessages.id,
      body: schema.ticketMessages.body,
      createdAt: schema.ticketMessages.createdAt,
      authorId: schema.ticketMessages.authorId,
      authorName: schema.users.name,
      authorRole: schema.users.role,
    })
    .from(schema.ticketMessages)
    .innerJoin(schema.users, eq(schema.users.id, schema.ticketMessages.authorId))
    .where(eq(schema.ticketMessages.ticketId, ticketId))
    .orderBy(asc(schema.ticketMessages.createdAt));

  return (
    <ol className="space-y-4">
      {msgs.map((m) => {
        const mine = m.authorId === viewerId;
        const staff = m.authorRole === "admin";
        return (
          <li key={m.id} className={clsx("flex", mine ? "justify-end" : "justify-start")}>
            <div className={clsx("max-w-[88%] sm:max-w-[75%]")}>
              <p className={clsx("mb-1 text-xs text-muted", mine && "text-right")}>
                <b className="font-semibold text-text">{mine ? "You" : m.authorName}</b>
                {staff && !mine && " · Study Centre"} · {fmtDateTime(m.createdAt)}
              </p>
              <div
                className={clsx(
                  "prose-msg rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                  mine ? "rounded-tr-md bg-primary text-on-primary" : staff ? "rounded-tl-md border border-border bg-accent-soft" : "rounded-tl-md border border-border bg-surface",
                )}
              >
                {m.body}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
