import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyAssetShareToken } from "@/lib/asset-share";
import { statusLabel, inspectionDueDate, daysBetween } from "@/lib/utils";

export default async function PublicAssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id }    = await params;
  const { token } = await searchParams;
  if (!token) notFound();

  const payload = verifyAssetShareToken(token);
  if (!payload || payload.assetId !== id) notFound();

  const asset = await prisma.asset.findFirst({
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

  if (!asset) notFound();

  type DocumentItem = { id: string; number: string; fileUrl: string; startDate?: Date | string | null };

  const latestInspection = asset.inspections[0];
  let labelDaysLeft: number | null = null;
  if (latestInspection) {
    const labelDue = inspectionDueDate(new Date(latestInspection.inspectionDate), latestInspection.label);
    labelDaysLeft  = daysBetween(labelDue, new Date());
  }

  const nextDue        = asset.maintenancePlans[0]?.nextDueAt ? new Date(asset.maintenancePlans[0].nextDueAt).toLocaleDateString("tr-TR") : "Plan yok";
  const inspectionLabel = asset.inspections[0]?.label ?? "Kayıt yok";
  const labelCountdown  = labelDaysLeft !== null ? `${labelDaysLeft} gün` : null;
  const supportPhone    = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? asset.customer.phone;

  const documents: DocumentItem[] = ((asset as any).contractAssets ?? [])
    .map((ca: any) => ca.contract)
    .filter((c: any) => c?.fileUrl)
    .map((c: any) => ({ id: c.id, number: c.contractNumber ?? "Belge", fileUrl: c.fileUrl as string, startDate: c.startDate }));

  /* ── Inline styles to avoid Tailwind class-scan issues on this server component ── */
  const glass = {
    background:    "rgba(255,255,255,0.10)",
    border:        "1px solid rgba(255,255,255,0.10)",
    backdropFilter:"blur(12px)",
  } as const;

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#06142d 0%,#0b2553 38%,#102d63 100%)", padding: "24px 16px", color: "#fff", fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* ── HERO CARD ── */}
        <section style={{ ...glass, borderRadius: 32, padding: "28px 24px", marginBottom: 20, position: "relative", overflow: "hidden", boxShadow: "0 32px 80px rgba(3,12,33,0.38)" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: "42%", height: "100%", background: "radial-gradient(circle at top right,rgba(255,255,255,0.18),transparent 58%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}>
            <div>
              <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.10)", borderRadius: 999, padding: "5px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.60)", marginBottom: 14 }}>
                QR ile servis görünümü
              </div>
              <h1 style={{ fontSize: "clamp(24px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1.05, margin: "0 0 10px" }}>{asset.name}</h1>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(255,255,255,0.60)", maxWidth: 540, margin: "0 0 18px" }}>
                {asset.customer.name} · {asset.buildingName || "Bina adı yok"}. Bu sayfa bina yöneticisi ve teknik ekip için son servis hareketlerini sade bir dille gösterir.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <Chip>{nextDue}</Chip>
                <Chip>{inspectionLabel}</Chip>
                {asset.customer.phone && <Chip>{asset.customer.phone}</Chip>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 160 }}>
              <HeroStat label="Sonraki bakım"  value={nextDue} />
              <HeroStat label="Son kontrol"    value={`${inspectionLabel}${labelCountdown ? ` · ${labelCountdown}` : ""}`} />
              <HeroStat label="İletişim"       value={supportPhone ?? "—"} />
            </div>
          </div>
        </section>

        {/* ── MAIN GRID ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
          {/* Work order timeline */}
          <section style={{ ...glass, borderRadius: 28, padding: "22px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em" }}>Servis zaman akışı</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", marginTop: 3 }}>Son servis kayıtları, teknisyen bilgisi ve özet açıklamalar</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: 999, padding: "5px 14px", fontSize: 12, fontWeight: 700 }}>
                {asset.workOrders.length} kayıt
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {asset.workOrders.length === 0 ? (
                <EmptyCard text="Henüz servis kaydı paylaşılmadı." />
              ) : (
                asset.workOrders.map((item) => (
                  <article key={item.id} style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.11),rgba(255,255,255,0.07))", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 22, padding: "18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.03em" }}>{item.code}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.54)", marginTop: 4 }}>
                          {new Date(item.createdAt).toLocaleDateString("tr-TR")} · {item.technician?.name || "Teknisyen bilgisi yok"}
                        </div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: 999, padding: "4px 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.80)", whiteSpace: "nowrap" }}>
                        {statusLabel(item.status)}
                      </div>
                    </div>
                    <div style={{ marginTop: 14, background: "rgba(255,255,255,0.07)", borderRadius: 16, padding: "12px 16px", fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.64)" }}>
                      {(item as any).note || "Servis özeti eklenmedi. Teknik detaylar iç operasyon sisteminde tutulur."}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          {/* Bottom 2-col */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
            {/* Building info */}
            <section style={{ ...glass, borderRadius: 28, padding: "22px 20px" }}>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 18 }}>Bina ve ekipman bilgisi</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <InfoRow label="Adres"            value={asset.customer.address || "Belirtilmedi"} />
                <InfoRow label="Konum notu"       value={asset.locationNote    || "Belirtilmedi"} />
                <InfoRow label="Asansör kimlik no" value={asset.elevatorIdNo  || "Belirtilmedi"} />
                <InfoRow label="Bina"             value={asset.buildingName    || "Belirtilmedi"} />
              </div>
            </section>

            {/* Inspections */}
            <section style={{ ...glass, borderRadius: 28, padding: "22px 20px" }}>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 18 }}>Kontrol ve bakım özeti</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {asset.inspections.length === 0 ? (
                  <EmptyCard text="Periyodik kontrol kaydı bulunmuyor." />
                ) : (
                  asset.inspections.map((ins) => (
                    <div key={ins.id} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 16, padding: "12px 15px", fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontWeight: 700 }}>{new Date(ins.inspectionDate).toLocaleDateString("tr-TR")}</span>
                        <span style={{ background: "rgba(255,255,255,0.10)", borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{ins.label || "Etiket yok"}</span>
                      </div>
                      {ins.note && <div style={{ marginTop: 7, color: "rgba(255,255,255,0.54)", fontSize: 12, lineHeight: 1.65 }}>{ins.note}</div>}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Documents */}
            {documents.length > 0 && (
              <section style={{ ...glass, borderRadius: 28, padding: "22px 20px" }}>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 18 }}>Belgeler ve sözleşmeler</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {documents.map(doc => (
                    <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.07)", borderRadius: 16, padding: "11px 15px" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.90)" }}>{doc.number}</div>
                        {doc.startDate && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{new Date(doc.startDate).toLocaleDateString("tr-TR")}</div>}
                      </div>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                        style={{ background: "#2563eb", color: "#fff", fontSize: 11, fontWeight: 700, padding: "7px 13px", borderRadius: 9, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(37,99,235,0.30)" }}>
                        Görüntüle
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Info card */}
            <section style={{ background: "rgba(255,255,255,0.96)", borderRadius: 28, padding: "22px 20px", color: "#111827" }}>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>Bu ekran neden var?</div>
              <p style={{ fontSize: 13, lineHeight: 1.75, color: "#6b7280", margin: "0 0 18px" }}>
                QR etiket okutulduğunda bina yöneticisi veya teknik ekip son servisleri, yaklaşan bakım tarihini ve iletişim bilgisini hızla görür. İç operasyon notları ve mali veriler burada paylaşılmaz.
              </p>
              {supportPhone && (
                <a href={`tel:${supportPhone}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 700, padding: "10px 18px", borderRadius: 10, textDecoration: "none", boxShadow: "0 3px 12px rgba(37,99,235,0.28)" }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.5 3.5a2 2 0 012-2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.91 8.13a16 16 0 006 6l.38-.38a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  Servis firmasını ara
                </a>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ── Sub-components (pure inline styles, zero Tailwind dependency) ── */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 999, padding: "5px 13px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.82)", backdropFilter: "blur(4px)" }}>
      {children}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 16, padding: "12px 14px" }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.2 }}>{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "11px 14px", fontSize: 13 }}>
      <span style={{ color: "rgba(255,255,255,0.46)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.88)", textAlign: "right" }}>{value}</span>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", fontSize: 13, color: "rgba(255,255,255,0.50)" }}>
      {text}
    </div>
  );
}
