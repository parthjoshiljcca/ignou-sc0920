import { NextResponse } from "next/server";

/**
 * Receives crash reports from students' browsers and writes them to the server log
 * (Vercel → Logs), so a "client-side exception" can be diagnosed without guessing.
 * No personal data is stored: only the error text, page path and browser string.
 */
export async function POST(req: Request) {
  try {
    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const clip = (v: unknown, n: number) => String(v ?? "").slice(0, n);
    console.error(
      "[client-error]",
      JSON.stringify({
        message: clip(b.message, 500),
        digest: clip(b.digest, 100),
        path: clip(b.path, 200),
        kind: clip(b.kind, 40),
        ua: clip(req.headers.get("user-agent"), 300),
        stack: clip(b.stack, 1500),
      }),
    );
  } catch {}
  return new NextResponse(null, { status: 204 });
}
