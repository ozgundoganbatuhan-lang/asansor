import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: session.userId },
    data: { emailVerifyToken: token, emailVerifyExpiry: expiry } as any,
  });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const verifyUrl = `${siteUrl}/auth/verify-email?token=${token}`;
    const fromEmail = process.env.RESEND_FROM ?? "noreply@servisim.app";
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: `Servisim <${fromEmail}>`,
        to: [user.email],
        subject: "E-posta doğrulama bağlantısı — Servisim",
        html: `<p>Doğrulama bağlantısı: <a href="${verifyUrl}">${verifyUrl}</a> (24 saat geçerli)</p>`,
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
