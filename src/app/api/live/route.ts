import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { liveFingerprint } from "@/lib/live";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Returns the current live fingerprint for the signed-in user (see lib/live.ts). */
export async function GET() {
  const s = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  return NextResponse.json({ v: await liveFingerprint(s.uid, s.role) }, { headers: { "Cache-Control": "no-store" } });
}
