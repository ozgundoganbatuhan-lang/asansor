import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Decode JWT payload without verification (signature verified server-side in route handlers)
function decodeJwtPayload(token: string): { emailVerified?: boolean } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

// Public paths that never require authentication
const PUBLIC_PREFIXES = [
  "/_next",
  "/favicon",
  "/robots",
  "/sitemap",
  "/manifest",
  "/icon",
  "/offline",
  "/api/auth",
  "/api/public",
  "/auth",
  "/blog",
  "/kvkk",
  "/terms",
  "/privacy",
  "/public",
  "/service-forms",
  "/blog-covers",
  "/screenshots",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow root (landing page) and static/public paths
  if (
    pathname === "/" ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.next();
  }

  // Protected app routes
  if (pathname.startsWith("/app")) {
    const token = req.cookies.get("servisim_token")?.value;

    // Unauthenticated → redirect to login
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // Email not verified → redirect to check-email page
    const payload = decodeJwtPayload(token);
    const emailVerified = payload?.emailVerified !== false;
    if (!emailVerified) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/check-email";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.ico$).*)",
  ],
};
