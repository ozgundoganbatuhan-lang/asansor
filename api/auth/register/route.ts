import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { z } from "zod";
import { Resend } from "resend";

const schema = z.object({
  organizationName: z.string().min(2),
  organizationSlug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/),
  vertical: z.literal("ELEVATOR").default("ELEVATOR"),
  name: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  marketingConsent: z.boolean().default(false),
});

// ── Self-healing columns ──────────────────────────────────────────────────────
async function ensureUserColumns(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User"
        ADD COLUMN IF NOT EXISTS "phone"             TEXT,
        ADD COLUMN IF NOT EXISTS "emailVerified"     BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "emailVerifyToken"  TEXT,
        ADD COLUMN IF NOT EXISTS "emailVerifyExpiry" TIMESTAMP(3)
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_emailVerifyToken_key"
        ON "User"("emailVerifyToken")
    `);
  } catch (err) {
    console.warn("ensureUserColumns (non-fatal):", err instanceof Error ? err.message : err);
  }
}

// ── Email verification via Resend SDK ─────────────────────────────────────────
async function sendVerifyEmail(
  email: string,
  name: string,
  orgName: string,
  token: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[register] RESEND_API_KEY not set — skipping verification email");
    return;
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const from = process.env.RESEND_FROM ?? "noreply@servisim.app";
  const verifyUrl = `${base}/auth/verify-email?token=${token}`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `Servisim <${from}>`,
    to: [email],
    subject: "E-posta adresinizi doğrulayın — Servisim",
    html: `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>E-posta Doğrulama</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;padding:0 16px;">
    <div style="background:#fff;border:1px solid #e4e8ee;border-radius:20px;overflow:hidden;">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1e40af 0%,#2563eb 60%,#0ea5e9 100%);padding:36px 40px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
          <div style="width:32px;height:32px;background:rgba(255,255,255,0.2);border-radius:9px;display:flex;align-items:center;justify-content:center;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          </div>
          <span style="font-size:16px;font-weight:800;color:#fff;letter-spacing:-0.03em;">servisim</span>
        </div>
        <h1 style="margin:0;font-size:24px;font-weight:900;color:#fff;line-height:1.2;letter-spacing:-0.03em;">
          E-posta adresinizi<br>doğrulayın
        </h1>
      </div>

      <!-- Body -->
      <div style="padding:36px 40px;">
        <p style="margin:0 0 24px;color:#4b5a6e;font-size:15px;line-height:1.7;">
          Merhaba <strong style="color:#0f1623;">${name}</strong>,<br><br>
          <strong style="color:#2563eb;">${orgName}</strong> için Servisim hesabınız başarıyla oluşturuldu.
          Hesabınıza erişmek için aşağıdaki butona tıklayarak e-posta adresinizi doğrulayın.
        </p>

        <!-- CTA Button -->
        <a href="${verifyUrl}"
          style="display:block;text-align:center;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;text-decoration:none;padding:16px 28px;border-radius:12px;font-size:15px;font-weight:800;letter-spacing:-0.01em;box-shadow:0 4px 16px rgba(37,99,235,0.3);">
          ✓ E-posta Adresimi Doğrula
        </a>

        <p style="margin:20px 0 0;color:#94a3b8;font-size:12.5px;text-align:center;line-height:1.7;">
          Bu bağlantı <strong>24 saat</strong> geçerlidir.<br>
          Eğer bu hesabı siz oluşturmadıysanız bu e-postayı görmezden gelebilirsiniz.
        </p>
      </div>

      <!-- Footer -->
      <div style="padding:16px 40px;border-top:1px solid #f0f2f5;background:#fafbfc;text-align:center;">
        <p style="margin:0;color:#c0c8d4;font-size:11.5px;">
          Servisim — Asansör Servis Yönetim Platformu<br>
          <a href="${base}/kvkk" style="color:#c0c8d4;">KVKK</a> ·
          <a href="${base}/privacy" style="color:#c0c8d4;">Gizlilik</a> ·
          <a href="${base}/terms" style="color:#c0c8d4;">Koşullar</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`,
  });

  if (error) {
    console.error("[register] Resend error:", error);
    throw new Error(`E-posta gönderilemedi: ${error.message}`);
  }
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz form" },
        { status: 400 }
      );
    }

    const { organizationName, organizationSlug, vertical, name, email, phone, password } = parsed.data;

    // Ensure DB columns exist
    await ensureUserColumns();

    // Duplicate checks
    const [existingSlug, existingEmail] = await Promise.all([
      prisma.organization.findUnique({ where: { slug: organizationSlug } }),
      prisma.user.findUnique({ where: { email } }),
    ]);
    if (existingSlug) return NextResponse.json({ error: "Bu kısa ad kullanımda, farklı bir isim deneyin." }, { status: 409 });
    if (existingEmail) return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı." }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    const displayName = name?.trim() || email.split("@")[0];
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");
    const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // When RESEND_API_KEY is set, require email verification; otherwise auto-verify
    const needsVerification = !!process.env.RESEND_API_KEY;

    // Create org
    const org = await prisma.organization.create({
      data: {
        name: organizationName,
        slug: organizationSlug,
        vertical: "ELEVATOR",
        planTier: "TRIAL",
      },
    });

    // Insert user via raw SQL — immune to missing-column errors
    const userId = `c${crypto.randomBytes(11).toString("hex")}`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "User"
         (id, "organizationId", name, email, phone, "passwordHash", role,
          "emailVerified", "emailVerifyToken", "emailVerifyExpiry", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
      userId,
      org.id,
      displayName,
      email,
      phone ?? null,
      passwordHash,
      "OWNER",
      !needsVerification,
      needsVerification ? emailVerifyToken : null,
      needsVerification ? emailVerifyExpiry : null,
    );

    // Send verification email (non-blocking — failure is logged but does not fail registration)
    if (needsVerification) {
      try {
        await sendVerifyEmail(email, displayName, organizationName, emailVerifyToken);
      } catch (emailErr) {
        console.error("[register] Email send failed (non-fatal):", emailErr);
        // Continue — user can resend via /api/auth/resend-verify
      }
    }

    const res = NextResponse.json({ ok: true, needsVerification }, { status: 201 });
    setSessionCookie(res, {
      userId,
      orgId: org.id,
      role: "OWNER",
      email,
      emailVerified: !needsVerification,
    });
    return res;

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Register error:", msg);
    return NextResponse.json({ error: "Kayıt başarısız: " + msg }, { status: 500 });
  }
}
