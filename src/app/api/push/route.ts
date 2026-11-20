import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";

const Sub = z.object({
  endpoint: z.url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const parsed = Sub.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  await db
    .insert(schema.pushSubscriptions)
    .values({ userId: u.id, endpoint, p256dh: keys.p256dh, auth: keys.auth })
    .onConflictDoUpdate({
      target: schema.pushSubscriptions.endpoint,
      set: { userId: u.id, p256dh: keys.p256dh, auth: keys.auth },
    });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (body?.endpoint) await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.endpoint, body.endpoint));
  return NextResponse.json({ ok: true });
}
