import "server-only";
import webpush from "web-push";
import { eq, inArray, and } from "drizzle-orm";
import { db, schema } from "@/db";

type Msg = { title: string; body: string; url?: string };

let vapidReady: boolean | null = null;
function ensureVapid() {
  if (vapidReady !== null) return vapidReady;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (vapidReady = false);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", pub, priv);
  return (vapidReady = true);
}

async function push(userIds: number[], msg: Msg) {
  if (!userIds.length || !ensureVapid()) return;
  const subs = await db
    .select()
    .from(schema.pushSubscriptions)
    .where(inArray(schema.pushSubscriptions.userId, userIds));
  const payload = JSON.stringify({ ...msg, url: msg.url || "/" });
  const dead: number[] = [];
  await Promise.allSettled(
    subs.map((s) =>
      webpush
        .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400 })
        .catch((err: { statusCode?: number }) => {
          if (err?.statusCode === 404 || err?.statusCode === 410) dead.push(s.id);
        }),
    ),
  );
  if (dead.length) await db.delete(schema.pushSubscriptions).where(inArray(schema.pushSubscriptions.id, dead));
}

/** Store an in-app notification for each user and send a push to their devices. */
export async function notifyUsers(userIds: number[], msg: Msg) {
  // Local testing against the live database: never message real people.
  if (process.env.NOTIFY_DRY_RUN === "1") return;
  const ids = [...new Set(userIds)];
  if (!ids.length) return;
  for (let i = 0; i < ids.length; i += 500) {
    await db.insert(schema.notifications).values(
      ids.slice(i, i + 500).map((userId) => ({ userId, title: msg.title, body: msg.body, url: msg.url ?? null })),
    );
  }
  await push(ids, msg);
}

export async function notifyAdmins(msg: Msg) {
  const admins = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.role, "admin"), eq(schema.users.isActive, true)));
  await notifyUsers(admins.map((a) => a.id), msg);
}

/** Notify all active students, optionally only those in a given programme. */
export async function notifyStudents(msg: Msg, programme?: string) {
  const conds = [eq(schema.users.role, "student"), eq(schema.users.isActive, true)];
  if (programme && programme !== "ALL") conds.push(eq(schema.users.programme, programme));
  const rows = await db.select({ id: schema.users.id }).from(schema.users).where(and(...conds));
  await notifyUsers(rows.map((r) => r.id), msg);
}
