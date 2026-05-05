import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readWorkOrderEvidence } from "@/lib/work-order-evidence";
import { listWorkOrderAttachments } from "@/lib/work-order-attachments";
import PrintButton from "@/components/PrintButton";

export default async function ServiceFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      asset: true,
      technician: true,
      partsUsed: { include: { part: true } },
      organization: { select: { name: true, phone: true, email: true, website: true } },
    },
  });
  if (!workOrder) notFound();

  const evidence    = await readWorkOrderEvidence(workOrder.organizationId, workOrder.id);
  const attachments = await listWorkOrderAttachments(workOrder.organizationId, workOrder.id);
  const totalParts  = workOrder.partsUsed.reduce((s: number, u: any) => s + ((u.part.price ?? 0) * u.quantity), 0);
  const total       = workOrder.laborCost + workOrder.serviceFee + totalParts;

  const fmt = (v?: string | null) => v ? new Date(v).toLocaleString("tr-TR", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";
  const money = (v: number) => new Intl.NumberFormat("tr-TR", { style:"currency", currency:"TRY", maximumFractionDigits:0 }).format((v ?? 0) / 100);

  const checklist  = (evidence.checklist ?? []) as string[];
  const allItems   = (evidence.checklistItems ?? checklist) as string[];

  const STATUS: Record<string, { label: string; color: string; bg: string }> = {
    DONE:        { label: "Tamamlandı",   color: "#166534", bg: "#f0fdf4" },
    IN_PROGRESS: { label: "Devam Ediyor", color: "#92400e", bg: "#fefce8" },
    PENDING:     { label: "Planlandı",    color: "#1d4ed8", bg: "#eff6ff" },
    CANCELED:    { label: "İptal",        color: "#6b7280", bg: "#f9fafb" },
  };
  const st = STATUS[workOrder.status] ?? STATUS.PENDING;

  const TYPE: Record<string, string> = {
    FAULT: "Arıza Müdahalesi",
    PERIODIC_MAINTENANCE: "Periyodik Bakım",
    ANNUAL_INSPECTION: "Yıllık Muayene",
    REVISION: "Revizyon",
  };

  const org = workOrder.organization;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .page { box-shadow: none; max-width: none; }
        }
        body { background: #f1f5f9; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      `}</style>

      {/* Print bar */}
      <div className="no-print" style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <PrintButton className="no-print" />
        <span style={{ fontSize: 13, color: "#6b7280" }}>Servis Formu · {workOrder.code}</span>
      </div>

      <div style={{ maxWidth: 860, margin: "32px auto", padding: "0 24px 48px" }}>
        <div className="page" style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}>

          {/* ── HEADER ── */}
          <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#2563eb 100%)", padding: "36px 40px", color: "#fff", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
            <div style={{ position: "absolute", top: 20, right: 40, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
                    SERVİS FORMU
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.05em", marginBottom: 8 }}>
                    {workOrder.code}
                  </div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                    {workOrder.customer.name}
                    {workOrder.asset?.name && <> · {workOrder.asset.name}</>}
                    {workOrder.asset?.buildingName && <> · {workOrder.asset.buildingName}</>}
                  </div>
                  {workOrder.customer.address && (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                      📍 {workOrder.customer.address}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: st.bg, borderRadius: 99, padding: "6px 14px", marginBottom: 12 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: st.color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: st.color }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                    {TYPE[workOrder.type] ?? workOrder.type}
                  </div>
                  {workOrder.scheduledAt && (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                      📅 {fmt(workOrder.scheduledAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: "32px 40px", display: "flex", flexDirection: "column", gap: 28 }}>

            {/* ── SERVICE SUMMARY ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Left: evidence details */}
              <div style={{ background: "#f8fafc", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 16 }}>Servis Detayları</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    ["Başlangıç",   fmt(evidence.startedAt)],
                    ["Bitiş",       fmt(evidence.endedAt)],
                    ["Teknisyen",   workOrder.technician?.name ?? "Atanmadı"],
                    ["Sonuç",       evidence.serviceOutcome ?? "—"],
                    ["Onaylayan",   evidence.signoffName ?? "—"],
                    ["Muhatap",     evidence.customerContact ?? "—"],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, gap: 12 }}>
                      <span style={{ color: "#64748b", flexShrink: 0 }}>{l}</span>
                      <span style={{ fontWeight: 600, color: "#111827", textAlign: "right" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: asset + customer info */}
              <div style={{ background: "#f8fafc", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 16 }}>Müşteri & Asansör</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    ["Müşteri",    workOrder.customer.name],
                    ["Telefon",    workOrder.customer.phone ?? "—"],
                    ["Adres",      workOrder.customer.address ?? "—"],
                    ["Asansör",    workOrder.asset?.name ?? "—"],
                    ["Cihaz No",   workOrder.asset?.elevatorIdNo ?? "—"],
                    ["Bina",       workOrder.asset?.buildingName ?? "—"],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, gap: 12 }}>
                      <span style={{ color: "#64748b", flexShrink: 0 }}>{l}</span>
                      <span style={{ fontWeight: 600, color: "#111827", textAlign: "right" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── SERVICE DESCRIPTION ── */}
            {(evidence.summary || workOrder.note) && (
              <div style={{ borderRadius: 16, border: "1px solid #e5e7eb", padding: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 12 }}>Servis Açıklaması</div>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>
                  {evidence.summary || workOrder.note}
                </p>
              </div>
            )}

            {/* ── CHECKLIST ── */}
            {allItems.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 14 }}>
                  Kontrol Listesi
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: "#6b7280", textTransform: "none" }}>
                    ({checklist.length}/{allItems.length} tamamlandı)
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {allItems.map((item: string) => {
                    const done = checklist.includes(item);
                    return (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: done ? "#f0fdf4" : "#f9fafb", borderRadius: 10, border: `1px solid ${done ? "#bbf7d0" : "#e5e7eb"}` }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: done ? "#22c55e" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {done && <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 13, color: done ? "#166534" : "#6b7280", fontWeight: done ? 600 : 400 }}>{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── PHOTOS ── */}
            {attachments.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 14 }}>
                  Fotoğraf Kanıtları ({attachments.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  {(attachments as any[]).slice(0, 9).map((a: any) => (
                    <div key={a.id} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", aspectRatio: "4/3" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.url} alt={a.originalName} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PARTS & COSTS ── */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 14 }}>Malzeme & Maliyet</div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Kalem", "Miktar", "Birim Fiyat", "Toplam"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "#374151", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {workOrder.partsUsed.map((u: any, i: number) => (
                      <tr key={u.id} style={{ borderBottom: i < workOrder.partsUsed.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                        <td style={{ padding: "12px 16px", color: "#111827", fontWeight: 500 }}>{u.part.name}</td>
                        <td style={{ padding: "12px 16px", color: "#6b7280" }}>{u.quantity} {u.part.unit ?? "Adet"}</td>
                        <td style={{ padding: "12px 16px", color: "#6b7280" }}>{u.part.price ? money(u.part.price) : "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#111827", fontWeight: 600 }}>{u.part.price ? money(u.part.price * u.quantity) : "—"}</td>
                      </tr>
                    ))}
                    <tr style={{ background: "#f8fafc", borderTop: "1px solid #e5e7eb" }}>
                      <td colSpan={3} style={{ padding: "10px 16px", fontWeight: 600, color: "#374151", fontSize: 12 }}>İşçilik</td>
                      <td style={{ padding: "10px 16px", fontWeight: 600, color: "#111827" }}>{money(workOrder.laborCost)}</td>
                    </tr>
                    <tr style={{ background: "#f8fafc" }}>
                      <td colSpan={3} style={{ padding: "10px 16px", fontWeight: 600, color: "#374151", fontSize: 12 }}>Servis Ücreti</td>
                      <td style={{ padding: "10px 16px", fontWeight: 600, color: "#111827" }}>{money(workOrder.serviceFee)}</td>
                    </tr>
                    <tr style={{ background: "#111827" }}>
                      <td colSpan={3} style={{ padding: "12px 16px", fontWeight: 800, color: "#fff", fontSize: 13 }}>GENEL TOPLAM</td>
                      <td style={{ padding: "12px 16px", fontWeight: 900, color: "#fff", fontSize: 16 }}>{money(total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── SIGNATURES ── */}
            {(evidence.signatureSvg || evidence.technicianSignatureSvg) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {([
                  { label: "Müşteri İmzası", svg: evidence.signatureSvg, color: "#3b82f6" },
                  { label: "Teknisyen İmzası", svg: evidence.technicianSignatureSvg, color: "#8b5cf6" },
                ] as { label: string; svg?: string | null; color: string }[]).map(sig => (
                  sig.svg ? (
                    <div key={sig.label} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>{sig.label}</div>
                      <svg viewBox="0 0 320 80" style={{ width: "100%", height: 80, background: "#f8fafc", borderRadius: 8 }}>
                        <path d={sig.svg} fill="none" stroke={sig.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ) : null
                ))}
              </div>
            )}

            {/* ── FOOTER ── */}
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{org.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.7 }}>
                  {org.phone && <div>📞 {org.phone}</div>}
                  {org.email && <div>✉️ {org.email}</div>}
                  {org.website && <div>🌐 {org.website}</div>}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  Oluşturulma: {fmt(workOrder.completedAt ?? (workOrder as any).createdAt)}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  Form No: {workOrder.code}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
