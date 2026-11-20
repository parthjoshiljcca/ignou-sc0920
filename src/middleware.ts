import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const STUDENT = ["/dashboard", "/tickets", "/schedule", "/notices", "/notifications", "/profile"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const s = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const isAdminPath = pathname.startsWith("/admin");
  const isStudentPath = STUDENT.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAuthPath = pathname === "/login" || pathname === "/register" || pathname === "/";

  if ((isAdminPath || isStudentPath) && !s) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (s && isAdminPath && s.role !== "admin") return NextResponse.redirect(new URL("/dashboard", req.url));
  if (s && isStudentPath && s.role === "admin" && !pathname.startsWith("/profile"))
    return NextResponse.redirect(new URL("/admin", req.url));
  if (s && isAuthPath) return NextResponse.redirect(new URL(s.role === "admin" ? "/admin" : "/dashboard", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|icons|sw.js|manifest.webmanifest|favicon.ico|offline).*)"],
};
