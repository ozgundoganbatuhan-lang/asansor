import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

/**
 * Cron-like endpoint to send reminder emails for organizations nearing the end of
 * their trial. When invoked, this endpoint iterates over all TRIAL
 * organizations, calculates how many days remain until the trial expires,
 * and dispatches emails at specific thresholds (7, 5, 3 and 1 day before
 * expiration). Emails are sent via Resend if RESEND_API_KEY is configured.
 *
 * This route is intended to be triggered by a scheduled job or manual call
 * and is not authenticated; access should be restricted at deployment level.
 */
export async function GET(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not set" },
      { status: 500 },
    );
  }
  const from = process.env.RESEND_FROM ?? "noreply@servisim.app";
  // Fetch all trial organizations with their users
  const orgs = await prisma.organization.findMany({
    where: { planTier: "TRIAL" },
    include: {
      users: {
        select: { email: true, name: true },
      },
    },
  });
  const now = new Date();
  const resend = new Resend(apiKey);
  let totalSent = 0;
  for (const org of orgs) {
    const diff = org.trialEndsAt.getTime() - now.getTime();
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    let subject: string | null = null;
    let body: string | null = null;
    // Determine which template to send based on days remaining
    if (daysLeft === 7) {
      subject = `Denemenizin bitmesine 7 gün kaldı — Kısa anket`;
      body = `<!DOCTYPE html><html lang="tr"><body style="font-family:Arial,sans-serif;background:#f5f7fa;margin:0;padding:0;">
        <div style="max-width:560px;margin:40px auto;padding:0 20px;background:#fff;border-radius:12px;border:1px solid #e4e8ee;">
          <div style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:24px;border-top-left-radius:12px;border-top-right-radius:12px;">
            <h2 style="margin:0;color:#fff;font-size:20px;">Merhaba!</h2>
          </div>
          <div style="padding:24px;font-size:14px;color:#374151;line-height:1.6;">
            <p>Servisim'de ücretsiz denemenizin bitmesine <strong>7 gün</strong> kaldı.</p>
            <p>Kısa bir <a href="https://forms.gle/" style="color:#2563eb;">anket</a> doldurarak deneyiminizi bizimle paylaşmanızı rica ediyoruz. Görüşleriniz geliştirmelerimiz için çok kıymetli.</p>
            <p>Teşekkür eder, keyifli kullanımlar dileriz!</p>
          </div>
        </div></body></html>`;
    } else if (daysLeft === 5) {
      subject = `Denemenizin bitmesine 5 gün kaldı — Kullanım özeti`;
      body = `<!DOCTYPE html><html lang="tr"><body style="font-family:Arial,sans-serif;background:#f5f7fa;margin:0;padding:0;">
        <div style="max-width:560px;margin:40px auto;padding:0 20px;background:#fff;border-radius:12px;border:1px solid #e4e8ee;">
          <div style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:24px;border-top-left-radius:12px;border-top-right-radius:12px;">
            <h2 style="margin:0;color:#fff;font-size:20px;">Merhaba!</h2>
          </div>
          <div style="padding:24px;font-size:14px;color:#374151;line-height:1.6;">
            <p>Ücretsiz denemenizin bitmesine <strong>5 gün</strong> kaldı. Şimdiye kadar yaptığınız işlemleri gözden geçirebilir ve Servisim'i nasıl kullandığınızı inceleyebilirsiniz.</p>
            <p>Bu süre zarfında asansörleriniz için oluşturduğunuz iş emirleri ve bakım kayıtları sistemde saklanmaya devam edecek.</p>
          </div>
        </div></body></html>`;
    } else if (daysLeft === 3) {
      subject = `Denemenizin bitmesine 3 gün kaldı — İstatistikler`;
      body = `<!DOCTYPE html><html lang="tr"><body style="font-family:Arial,sans-serif;background:#f5f7fa;margin:0;padding:0;">
        <div style="max-width:560px;margin:40px auto;padding:0 20px;background:#fff;border-radius:12px;border:1px solid #e4e8ee;">
          <div style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:24px;border-top-left-radius:12px;border-top-right-radius:12px;">
            <h2 style="margin:0;color:#fff;font-size:20px;">Merhaba!</h2>
          </div>
          <div style="padding:24px;font-size:14px;color:#374151;line-height:1.6;">
            <p>Ücretsiz denemenizin bitmesine <strong>3 gün</strong> kaldı. Servisim'i nasıl kullandığınıza dair bazı istatistikleri sizinle paylaşıyoruz.</p>
            <p>Lütfen hesabınıza giriş yaparak detaylı raporları inceleyin.</p>
          </div>
        </div></body></html>`;
    } else if (daysLeft === 1) {
      subject = `Denemeniz yarın sona eriyor`;
      body = `<!DOCTYPE html><html lang="tr"><body style="font-family:Arial,sans-serif;background:#f5f7fa;margin:0;padding:0;">
        <div style="max-width:560px;margin:40px auto;padding:0 20px;background:#fff;border-radius:12px;border:1px solid #e4e8ee;">
          <div style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:24px;border-top-left-radius:12px;border-top-right-radius:12px;">
            <h2 style="margin:0;color:#fff;font-size:20px;">Merhaba!</h2>
          </div>
          <div style="padding:24px;font-size:14px;color:#374151;line-height:1.6;">
            <p>Servisim'deki ücretsiz denemeniz <strong>yarın sona eriyor</strong>.</p>
            <p>Hesabınızın kapanmaması için lütfen planınızı yükseltmeyi değerlendirin. Aksi halde erişiminiz kısıtlanacak ve verilerinize erişim sağlamanız mümkün olmayacaktır.</p>
          </div>
        </div></body></html>`;
    }
    if (!subject || !body) {
      continue;
    }
    // Send to each user in the organization
    for (const user of org.users) {
      try {
        await resend.emails.send({
          from: `Servisim <${from}>`,
          to: [user.email],
          subject,
          html: body,
        });
        totalSent++;
      } catch (err) {
        console.error("[trial-reminders] Email send failed", err);
      }
    }
  }
  return NextResponse.json({ ok: true, emailsSent: totalSent });
}