import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET ?? "change-me-in-production";
const COOKIE_NAME = "servisim_token";

export type Session = {
  userId: string;
  orgId: string;
  role: string;
  email: string;
};

export function signToken(payload: Session): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): Session | null {
  try {
    return jwt.verify(token, JWT_SECRET) as Session;
  } catch {
    return null;
  }
}

/** For use in Server Components and Server Actions */
export function readSession(): Session | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

/** For use in Route Handlers */
export function sessionFromRequest(req: NextRequest): Session | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Set session cookie in a Route Handler response */
export function setSessionCookie(res: NextResponse, session: Session): void {
  const token = signToken(session);
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

/** Clear session cookie */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/** Helper: return 401 JSON response */
export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
}
