import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for Neon Auth / Better Auth session cookies
  const hasSession =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token") ||
    request.cookies.get("neon_auth_session");

  // Protect dashboard routes for unauthenticated browser navigation
  if (
    !hasSession &&
    pathname.startsWith("/dashboard") &&
    request.headers.get("accept")?.includes("text/html")
  ) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
