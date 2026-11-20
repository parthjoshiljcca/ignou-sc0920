import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const STUDENT = ["/dashboard", "/tickets", "/schedule", "/notices", "/notifications", "/profile"];
const SET_PASSWORD = "/set-password";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const s = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const isAdminPath = pathname.startsWith("/admin");
  const isStudentPath = STUDENT.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAuthPath = pathname === "/login" || pathname === "/";

  if ((isAdminPath || isStudentPath || pathname === SET_PASSWORD) && !s) {
    const url = new URL("/login", req.url);
    if (pathname !== SET_PASSWORD) url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (!s) return NextResponse.next();

  // First login with the mobile-number password: nothing else is reachable until a new password is set.
  if (s.mcp && pathname !== SET_PASSWORD) return NextResponse.redirect(new URL(SET_PASSWORD, req.url));
  if (!s.mcp && pathname === SET_PASSWORD) return NextResponse.redirect(new URL(s.role === "admin" ? "/admin" : "/dashboard", req.url));

  if (isAdminPath && s.role !== "admin") return NextResponse.redirect(new URL("/dashboard", req.url));
  if (isStudentPath && s.role === "admin" && !pathname.startsWith("/profile")) return NextResponse.redirect(new URL("/admin", req.url));
  if (isAuthPath) return NextResponse.redirect(new URL(s.role === "admin" ? "/admin" : "/dashboard", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|icons|brand|sw.js|manifest.webmanifest|favicon.ico|icon.png|offline).*)"],
};
