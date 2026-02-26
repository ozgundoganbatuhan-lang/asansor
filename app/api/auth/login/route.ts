import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  orgSlug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz form" }, { status: 400 });
  }

  const { email, password, orgSlug } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });

  if (!user) {
    return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
  }

  if (orgSlug && user.organization.slug !== orgSlug) {
    return NextResponse.json({ error: "Bu firma slug'ı ile eşleşen hesap bulunamadı." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, {
    userId: user.id,
    orgId: user.organizationId,
    role: user.role,
    email: user.email,
  });
  return res;
}
