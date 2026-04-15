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
  emailVerified: boolean;
};

export function signToken(payload: Session): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): Session | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Session;
    // Back-compat: old tokens without emailVerified
    if (decoded.emailVerified === undefined) decoded.emailVerified = true;
    return decoded;
  } catch {
    return null;
  }
}

export async function readSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function sessionFromRequest(req: NextRequest): Session | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setSessionCookie(res: NextResponse, session: Session): void {
  const token = signToken(session);
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
}
