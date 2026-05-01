import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { z } from "zod";

// Allow mobile app requests (CORS)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

/**
 * Mobile login — returns JWT token in response body (not cookie).
 * Mobile app uses this token as "Authorization: Bearer <token>" header.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });

    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 400 });

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });

    const emailVerified = (user as any).emailVerified ?? true;

    const session = {
      userId: user.id,
      orgId: user.organizationId,
      role: user.role,
      email: user.email,
      emailVerified,
    };

    const token = signToken(session);

    return NextResponse.json({
      ok: true,
      token,
      session,
    });
  } catch (e: unknown) {
    console.error("Mobile login error:", e);
    return NextResponse.json({ error: "Giriş başarısız." }, { status: 500 });
  }
}
