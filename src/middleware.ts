import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const publicPaths = ["/", "/api/auth"];

function isPublicPath(pathname: string): boolean {
  // Remove locale prefix (e.g., /de or /en)
  const pathWithoutLocale = pathname.replace(/^\/(de|en)/, "") || "/";
  return publicPaths.some(
    (path) => pathWithoutLocale === path || pathWithoutLocale.startsWith(path + "/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API auth routes and public paths
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const locale = pathname.match(/^\/(de|en)/)?.[1] || "en";
    const loginUrl = new URL(`/${locale}`, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
