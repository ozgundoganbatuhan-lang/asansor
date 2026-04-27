import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

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

    const res = NextResponse.json({ ok: true, emailVerified });
    setSessionCookie(res, {
      userId: user.id,
      orgId: user.organizationId,
      role: user.role,
      email: user.email,
      emailVerified,
    });
    return res;
  } catch (e: unknown) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Giriş başarısız." }, { status: 500 });
  }
}
