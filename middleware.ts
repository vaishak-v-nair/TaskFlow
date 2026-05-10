import { NextRequest, NextResponse } from "next/server";
import { isPublicApiPath, isPublicPagePath } from "@/middleware/publicPaths";
import { requireAuth } from "@/middleware/requireAuth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");

  // Allow static assets
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Allow public auth and health APIs without a session
  if (isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  const authResponse = requireAuth(req);

  // Login and signup stay public, but authenticated users should not land there.
  if (isPublicPagePath(pathname)) {
    if (!authResponse) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }

  if (authResponse) {
    if (isApiRoute) {
      return authResponse;
    }

    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
