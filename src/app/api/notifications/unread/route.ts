import { NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.userId, u.id), eq(schema.notifications.isRead, false)));
  return NextResponse.json({ count: n }, { headers: { "Cache-Control": "no-store" } });
}
