import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic login gate: visitors without a session cookie are sent to /login.
 * This only checks that a cookie exists. Every API route that costs money or touches
 * user data checks the real session itself (see requireSession in src/lib/session.ts).
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except the login page, the auth API, the dev-only login link, Next.js internals
  // and static files.
  matcher: [
    "/((?!login|api/auth|api/dev/login-link|_next/static|_next/image|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
