import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  organizationName: z.string().min(2),
  organizationSlug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/, "Sadece a-z, 0-9 ve -"),
  vertical: z.enum(["ELEVATOR", "WHITE_GOODS"]).default("ELEVATOR"),
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz form" }, { status: 400 });
  }

  const { organizationName, organizationSlug, vertical, name, email, password } = parsed.data;

  const existingSlug = await prisma.organization.findUnique({ where: { slug: organizationSlug } });
  if (existingSlug) {
    return NextResponse.json({ error: "Bu slug kullanımda, farklı bir slug deneyin." }, { status: 409 });
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json({ error: "Bu e-posta zaten kayıtlı." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const org = await prisma.organization.create({
    data: {
      name: organizationName,
      slug: organizationSlug,
      vertical: vertical as any,
      planTier: "TRIAL",
    },
  });

  const user = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: name ?? email.split("@")[0],
      email,
      passwordHash,
      role: "OWNER",
    },
  });

  const res = NextResponse.json({ ok: true }, { status: 201 });
  setSessionCookie(res, { userId: user.id, orgId: org.id, role: user.role, email: user.email });
  return res;
}
