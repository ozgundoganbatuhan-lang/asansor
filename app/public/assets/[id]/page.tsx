import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyAssetShareToken } from "@/lib/asset-share";
import { statusLabel, inspectionDueDate, daysBetween } from "@/lib/utils";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "asansor@teknix.tech";
const SUPPORT_PHONE_DISPLAY = process.env.NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY ?? "+49 155 6619 6266";
const SUPPORT_PHONE_RAW = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "+4915566196266";
const SUPPORT_WA = `https://wa.me/${SUPPORT_PHONE_RAW.replace(/\D/g,"")}?text=Servis%20bilgisi%20almak%20istiyorum`;

export default async function PublicAssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id }    = await params;
  const { token } = await searchParams;

  // ── Token validation ──────────────────────────────────────
  if (!token) {
    return <ErrorPage title="QR bağlantısı geçersiz" desc="Bu sayfa yalnızca geçerli bir QR kod tarandığında açılır. Lütfen asansör üzerindeki QR etiketi tekrar okutun." />;
  }

  let payload: { assetId: string; orgId: string } | null = null;
  try {
    payload = verifyAssetShareToken(token);
  } catch {
    // token verify throws → invalid
  }

  if (!payload || payload.assetId !== id) {
    return <ErrorPage title="Bağlantı süresi dolmuş" desc="QR kodunun bağlantı süresi dolmuş veya geçersiz. Servis firmasıyla iletişime geçin." />;
  }

  // ── Data fetch ────────────────────────────────────────────
  let asset: any = null;
  try {
    asset = await prisma.asset.findFirst({
      where: { id, organizationId: payload.orgId },
      include: {
        customer: { select: { name: true, address: true, phone: true } },
        workOrders: {
          orderBy: { createdAt: "desc" },
          take: 8,
          include: { technician: { select: { name: true } } },
        },
        maintenancePlans: { orderBy: { nextDueAt: "asc" }, take: 2 },
        inspections: { orderBy: { inspectionDate: "desc" }, take: 3 },
        contractAssets: {
          include: {
            contract: {
              select: { id: true, contractNumber: true, fileUrl: true, startDate: true, endDate: true, status: true },
            },
          },
        },
      },
    });
  } catch (err) {
    console.error("[PublicAssetPage] Prisma error:", err);
    return <ErrorPage title="Geçici hata" desc="Veriler yüklenirken bir sorun oluştu. Lütfen birkaç dakika sonra tekrar deneyin." />;
  }

  if (!asset) {
    return <ErrorPage title="Asansör bulunamadı" desc="Bu QR koda ait asansör kaydı sistemde mevcut değil. Servis firmasıyla iletişime geçin." />;
  }

  // ── Computed values ───────────────────────────────────────
  const latestInspection = asset.inspections[0];
  let labelDaysLeft: number | null = null;
  if (latestInspection) {
    try {
      const labelDue = inspectionDueDate(new Date(latestInspection.inspectionDate), latestInspection.label);
      labelDaysLeft  = daysBetween(labelDue, new Date());
    } catch {}
  }

  const nextDue         = asset.maintenancePlans[0]?.nextDueAt
    ? new Date(asset.maintenancePlans[0].nextDueAt).toLocaleDateString("tr-TR")
    : "Plan yok";
  const inspectionLabel = asset.inspections[0]?.label ?? "Kayıt yok";
  const labelCountdown  = labelDaysLeft !== null ? `${labelDaysLeft} gün` : null;
  const supportPhone    = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? asset.customer?.phone ?? SUPPORT_PHONE_RAW;

  type DocumentItem = { id: string; number: string; fileUrl: string; startDate?: Date | string | null };
  const documents: DocumentItem[] = (asset.contractAssets ?? [])
    .map((ca: any) => ca.contract)
    .filter((c: any) => c?.fileUrl)
    .map((c: any) => ({ id: c.id, number: c.contractNumber ?? "Belge", fileUrl: c.fileUrl as string, startDate: c.startDate }));

  const glass = {
    background:    "rgba(255,255,255,0.10)",
    border:        "1px solid rgba(255,255,255,0.10)",
    backdropFilter:"blur(12px)",
  } as const;

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#06142d 0%,#0b2553 38%,#102d63 100%)", padding: "24px 16px 40px", color: "#fff", fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* ── HERO CARD ── */}
        <section style={{ ...glass, borderRadius: 28, padding: "28px 24px", marginBottom: 20, position: "relative", overflow: "hidden", boxShadow: "0 32px 80px rgba(3,12,33,0.38)" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: "42%", height: "100%", background: "radial-gradient(circle at top right,rgba(255,255,255,0.18),transparent 58%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "5px 13px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              QR ile servis görünümü
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "start" }}>
              <div>
                <h1 style={{ fontSize: "clamp(22px,4vw,38px)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1.05, margin: "0 0 8px" }}>{asset.name}</h1>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.55)", margin: "0 0 16px", maxWidth: 480 }}>
                  {asset.customer?.name} · {asset.buildingName || "Bina adı yok"}. Bu sayfa son servis hareketlerini sade bir dille gösterir.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <Chip>📅 {nextDue}</Chip>
                  <Chip>🏷️ {inspectionLabel}</Chip>
                  {labelCountdown && <Chip>⏳ {labelCountdown} kaldı</Chip>}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 148 }}>
                <HeroStat label="Sonraki bakım"  value={nextDue} />
                <HeroStat label="Son kontrol"    value={`${inspectionLabel}${labelCountdown ? ` · ${labelCountdown}` : ""}`} />
              </div>
            </div>
          </div>
        </section>

        {/* ── MAIN GRID ── */}
        <div style={{ display: "grid", gap: 16 }}>

          {/* Work order timeline */}
          <section style={{ ...glass, borderRadius: 24, padding: "22px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em" }}>Servis zaman akışı</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>Son servis kayıtları, teknisyen bilgisi ve özet açıklamalar</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: 999, padding: "5px 14px", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {asset.workOrders.length} kayıt
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {asset.workOrders.length === 0 ? (
                <EmptyCard text="Henüz servis kaydı paylaşılmadı." />
              ) : (
                asset.workOrders.map((item: any) => (
                  <article key={item.id} style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.11),rgba(255,255,255,0.06))", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 18, padding: "16px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.03em" }}>{item.code}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", marginTop: 3 }}>
                          {new Date(item.createdAt).toLocaleDateString("tr-TR")} · {item.technician?.name || "Teknisyen bilgisi yok"}
                        </div>
                      </div>
                      <StatusBadge status={statusLabel(item.status)} />
                    </div>
                    <div style={{ marginTop: 12, background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "11px 14px", fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.60)" }}>
                      {(item as any).note || "Servis özeti eklenmedi. Teknik detaylar iç operasyon sisteminde tutulur."}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          {/* 2-col grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>

            {/* Building info */}
            <section style={{ ...glass, borderRadius: 24, padding: "20px 18px" }}>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>Bina ve ekipman bilgisi</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <InfoRow label="Adres"            value={asset.customer?.address || "Belirtilmedi"} />
                <InfoRow label="Konum notu"       value={asset.locationNote    || "Belirtilmedi"} />
                <InfoRow label="Asansör kimlik no" value={asset.elevatorIdNo  || "Belirtilmedi"} />
                <InfoRow label="Bina"             value={asset.buildingName    || "Belirtilmedi"} />
              </div>
            </section>

            {/* Inspections */}
            <section style={{ ...glass, borderRadius: 24, padding: "20px 18px" }}>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>Kontrol ve bakım özeti</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {asset.inspections.length === 0 ? (
                  <EmptyCard text="Periyodik kontrol kaydı bulunmuyor." />
                ) : (
                  asset.inspections.map((ins: any) => (
                    <div key={ins.id} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 14, padding: "11px 14px", fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontWeight: 700 }}>{new Date(ins.inspectionDate).toLocaleDateString("tr-TR")}</span>
                        <span style={{ background: "rgba(255,255,255,0.10)", borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{ins.label || "Etiket yok"}</span>
                      </div>
                      {ins.note && <div style={{ marginTop: 6, color: "rgba(255,255,255,0.50)", fontSize: 12, lineHeight: 1.6 }}>{ins.note}</div>}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Documents */}
            {documents.length > 0 && (
              <section style={{ ...glass, borderRadius: 24, padding: "20px 18px" }}>
                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>Belgeler ve sözleşmeler</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {documents.map(doc => (
                    <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.07)", borderRadius: 14, padding: "11px 14px" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.90)" }}>{doc.number}</div>
                        {doc.startDate && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", marginTop: 2 }}>{new Date(doc.startDate).toLocaleDateString("tr-TR")}</div>}
                      </div>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                        style={{ background: "#2563eb", color: "#fff", fontSize: 11, fontWeight: 700, padding: "7px 13px", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(37,99,235,0.30)" }}>
                        Görüntüle
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Contact card */}
            <section style={{ background: "rgba(255,255,255,0.97)", borderRadius: 24, padding: "20px 18px", color: "#111827" }}>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 10 }}>Bu ekran neden var?</div>
              <p style={{ fontSize: 13, lineHeight: 1.75, color: "#6b7280", margin: "0 0 16px" }}>
                QR etiket okutulduğunda bina yöneticisi veya teknik ekip son servisleri, yaklaşan bakım tarihini ve iletişim bilgisini hızla görür. İç operasyon notları ve mali veriler burada paylaşılmaz.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <a href={`tel:${supportPhone}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 700, padding: "11px 16px", borderRadius: 10, textDecoration: "none", boxShadow: "0 3px 12px rgba(37,99,235,0.28)" }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.5 3.5a2 2 0 012-2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.91 8.13a16 16 0 006 6l.38-.38a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  {SUPPORT_PHONE_DISPLAY}
                </a>
                <a href={`mailto:${SUPPORT_EMAIL}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f3f4f6", color: "#374151", fontSize: 13, fontWeight: 600, padding: "11px 16px", borderRadius: 10, textDecoration: "none" }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  {SUPPORT_EMAIL}
                </a>
                <a href={SUPPORT_WA} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25d366", color: "#fff", fontSize: 13, fontWeight: 700, padding: "11px 16px", borderRadius: 10, textDecoration: "none", boxShadow: "0 3px 12px rgba(37,211,102,0.25)" }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  WhatsApp ile yazın
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ── Error page ─────────────────────────────────────────── */
function ErrorPage({ title, desc }: { title: string; desc: string }) {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#06142d 0%,#0b2553 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif" }}>
      <div style={{ maxWidth: 440, width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 24, padding: "36px 32px", textAlign: "center", color: "#fff" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24 }}>⚠️</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 10px" }}>{title}</h1>
        <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(255,255,255,0.55)", margin: "0 0 24px" }}>{desc}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a href="tel:+4915566196266"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 700, padding: "12px 20px", borderRadius: 10, textDecoration: "none", boxShadow: "0 4px 14px rgba(37,99,235,0.30)" }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.5 3.5a2 2 0 012-2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.91 8.13a16 16 0 006 6l.38-.38a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            +49 155 6619 6266
          </a>
          <a href="mailto:asansor@teknix.tech"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.80)", fontSize: 13, fontWeight: 600, padding: "12px 20px", borderRadius: 10, textDecoration: "none" }}>
            asansor@teknix.tech
          </a>
        </div>
      </div>
    </main>
  );
}

/* ── Sub-components ─────────────────────────────────────── */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 999, padding: "5px 13px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.82)" }}>
      {children}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 14, padding: "11px 13px" }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.40)", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "-0.02em", color: "#fff", lineHeight: 1.2 }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    "Tamamlandı": { bg: "rgba(5,150,105,0.20)", color: "#6ee7b7" },
    "Yolda":      { bg: "rgba(217,119,6,0.20)",  color: "#fcd34d" },
    "Atandı":     { bg: "rgba(37,99,235,0.20)",   color: "#93c5fd" },
    "Bekliyor":   { bg: "rgba(220,38,38,0.20)",   color: "#fca5a5" },
  };
  const s = map[status] ?? { bg: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.80)" };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "4px 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 13px", fontSize: 13 }}>
      <span style={{ color: "rgba(255,255,255,0.42)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.86)", textAlign: "right" }}>{value}</span>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 15px", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
      {text}
    </div>
  );
}
