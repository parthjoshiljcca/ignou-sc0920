import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "sc0920_session";
export const SESSION_DAYS = 30;

export type SessionPayload = { uid: number; role: "student" | "admin" };

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw new Error("AUTH_SECRET must be set (at least 16 characters).");
  return new TextEncoder().encode(secret);
}

export async function signSession(p: SessionPayload) {
  return new SignJWT(p)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    if (typeof payload.uid !== "number" || (payload.role !== "student" && payload.role !== "admin")) return null;
    return { uid: payload.uid, role: payload.role };
  } catch {
    return null;
  }
}
