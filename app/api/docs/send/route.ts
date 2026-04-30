import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { sessionFromRequest, unauthorized } from "@/lib/auth";

/**
 * API route to send edited document templates via email. Supports two types:
 * 'teklif' (offer) and 'sozlesme' (contract). The request body should
 * include the recipient email, subject and html content. The relevant
 * template PDF is attached to the email.
 *
 * Example POST body:
 * { type: 'teklif', to: 'yonetici@example.com', subject: 'Asansör Bakım Teklifi', html: '<p>...your custom html...</p>' }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    const { type, to, subject, html } = body;
    if (!type || !to || !subject || !html) {
      return NextResponse.json({ error: "type, to, subject ve html alanları gereklidir" }, { status: 400 });
    }
    if (type !== "teklif" && type !== "sozlesme") {
      return NextResponse.json({ error: "type yalnızca 'teklif' veya 'sozlesme' olabilir" }, { status: 400 });
    }

    // Determine the currently authenticated user and organisation
    const session = sessionFromRequest(req);
    if (!session) return unauthorized();

    // Fetch user and organisation details for customizing sender
    const [user, org] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, email: true } }),
      prisma.organization.findUnique({ where: { id: session.orgId }, select: { name: true } }),
    ]);

    // Determine file path and filename based on type
    const fileName = type === "teklif" ? "teklif-sablonu.pdf" : "sozlesme-sablonu.pdf";
    const filePath = path.join(process.cwd(), "public", "docs", fileName);
    let attachment: string;
    try {
      const buf = fs.readFileSync(filePath);
      attachment = buf.toString("base64");
    } catch (e) {
      return NextResponse.json({ error: "Şablon dosyası okunamadı" }, { status: 500 });
    }
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "RESEND_API_KEY tanımlı değil" }, { status: 500 });
    }
    // Compose sender details. Use organisation and user name in display name.
    const fromAddress = process.env.RESEND_FROM ?? "noreply@servisim.app";
    const displayNameParts: string[] = [];
    if (org?.name) displayNameParts.push(org.name);
    if (user?.name) displayNameParts.push(user.name);
    // If no name available, fall back to user's email before @
    if (displayNameParts.length === 0 && user?.email) {
      const localPart = user.email.split("@")[0];
      displayNameParts.push(localPart);
    }
    const fromString = `${displayNameParts.join(" - ")} <${fromAddress}>`;
    const replyTo = user?.email ?? undefined;
    const resend = new Resend(apiKey);
    try {
      await resend.emails.send({
        from: fromString,
        to: [to],
        cc: replyTo ? [replyTo] : undefined,
        subject: subject,
        html: html,
        // Set reply-to so that the recipient replies directly to the manager's email
        replyTo: replyTo,
        attachments: [
          {
            content: attachment,
            filename: fileName,
          },
        ],
      });
    } catch (err: any) {
      console.error("[docs/send] Email send failed", err);
      return NextResponse.json({ error: "E-posta gönderilemedi" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[docs/send] Unexpected error", err);
    return NextResponse.json({ error: "Bilinmeyen hata" }, { status: 500 });
  }
}