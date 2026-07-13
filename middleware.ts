// ============================================================
// middleware.ts — Route protection
// Runs on the Edge Runtime before every request
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_KEYS } from "@/lib/constants";

// Routes that DON'T require authentication
const PUBLIC_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and Next.js internals
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico";

  if (isPublic) return NextResponse.next();

  const session = request.cookies.get(COOKIE_KEYS.SESSION)?.value;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png).*)"],
};
