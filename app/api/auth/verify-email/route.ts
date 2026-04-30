import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login?error=invalid-token", req.url));
  }

  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } as any });

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login?error=invalid-token", req.url));
  }

  if ((user as any).emailVerifyExpiry && (user as any).emailVerifyExpiry < new Date()) {
    return NextResponse.redirect(new URL("/auth/check-email?error=expired", req.url));
  }

  // Mark verified
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpiry: null } as any,
  });

  // Set verified session cookie
  const res = NextResponse.redirect(new URL("/app/dashboard?welcome=1", req.url));
  setSessionCookie(res, {
    userId: user.id,
    orgId: user.organizationId,
    role: user.role,
    email: user.email,
    emailVerified: true,
  });
  return res;
}
