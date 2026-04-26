"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* ── Types ── */
type WorkOrder = {
  id: string; code: string; type: string; status: string;
  customer: { name: string };
  technician?: { name: string } | null;
  asset?: { name: string } | null;
};
type OverdueItem = {
  id: string; nextDueAt: string;
  asset: { name: string; customer: { name: string } };
};
type LowStockPart = { id: string; name: string; stock: number; minStock: number };
type DashboardResponse = {
  stats: { customers: number; assets: number; workOrders: number; urgent: number; dueSoon: number; overdue: number; risky: number };
  recentWOs: WorkOrder[];
  overdueList: OverdueItem[];
  lowStockParts: LowStockPart[];
  invoiceSummary: { thisMonthTotal: number; thisMonthCount: number; trend: Array<{ month: string; total: number }> };
};

const money = (v: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format((v ?? 0) / 100);

const STATUS_CHIP: Record<string, { label: string; bg: string; color: string; border: string }> = {
  PENDING:     { label: "BEKLİYOR",   bg: "#f4f4f5", color: "#52525b", border: "#d4d4d8" },
  IN_PROGRESS: { label: "YOLDA",      bg: "#fffbeb", color: "#b45309", border: "#fcd34d" },
  URGENT:      { label: "ACİL",       bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
  DONE:        { label: "TAMAM",      bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  CANCELED:    { label: "İPTAL",      bg: "#f4f4f5", color: "#52525b", border: "#d4d4d8" },
};

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (!res.ok) setError(json.error ?? "Dashboard yüklenemedi.");
        else setData(json);
      } catch { setError("Bağlantı hatası. Lütfen sayfayı yenileyin."); }
      finally { setLoading(false); }
    })();
  }, []);

  const monthlyTotal = useMemo(
    () => data?.invoiceSummary.thisMonthTotal ? money(data.invoiceSummary.thisMonthTotal) : "₺0",
    [data]
  );

  if (loading) return (
    <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #e4e4e7", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </div>
  );
  if (error || !data) return (
    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "14px 18px", borderRadius: 12, fontSize: 14 }}>
      {error ?? "Veri alınamadı."}
    </div>
  );

  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Page header ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 14, marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: "#a1a1aa", marginBottom: 6 }}>Servisim Dashboard</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.04em", color: "#0a0a0f", lineHeight: 1.05 }}>Günün özeti</h1>
          <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.65, color: "#71717a", maxWidth: 560 }}>
            Bakım ritmi, acil işler, tahsilat ve stok riski tek bakışta.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#a1a1aa", background: "#fff", border: "1px solid #e4e4e7", padding: "6px 12px", borderRadius: 8, fontWeight: 500 }}>{today}</span>
          <Link href="/app/work-orders" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 700,
            padding: "9px 18px", borderRadius: 10, textDecoration: "none",
            boxShadow: "0 4px 16px rgba(37,99,235,0.3)", transition: "all 0.18s",
          }}>
            İş emirlerine git
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {[
          { label: "Aktif İş Emirleri", value: data.stats.workOrders, color: "#2563eb", iconBg: "#eff6ff", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4", note: "Açık ve devam eden", noteColor: "#15803d", noteBg: "#dcfce7", href: "/app/work-orders", accent: "linear-gradient(90deg,#2563eb,#60a5fa)" },
          { label: "Acil / Bekleyen", value: data.stats.urgent, color: "#dc2626", iconBg: "#fef2f2", icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01", note: "Öncelikli müdahale", noteColor: "#b91c1c", noteBg: "#fee2e2", href: "/app/work-orders", accent: "linear-gradient(90deg,#dc2626,#f87171)" },
          { label: "Yaklaşan Bakım", value: data.stats.dueSoon, color: "#059669", iconBg: "#f0fdf4", icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z", note: "Takvime bağlı", noteColor: "#15803d", noteBg: "#dcfce7", href: "/app/maintenance-plans", accent: "linear-gradient(90deg,#059669,#34d399)" },
          { label: "Aylık Gelir", value: monthlyTotal, color: "#7c3aed", iconBg: "#f5f3ff", icon: "M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6", note: `${data.invoiceSummary.thisMonthCount} fatura`, noteColor: "#5b21b6", noteBg: "#ede9fe", href: "/app/invoices", accent: "linear-gradient(90deg,#7c3aed,#a78bfa)" },
        ].map((k, i) => (
          <Link key={i} href={k.href} className="kpi" style={{
            background: "#fff", border: "1px solid #e4e4e7", borderRadius: 18,
            padding: "20px 22px", textDecoration: "none", color: "inherit",
            position: "relative", overflow: "hidden", transition: "all 0.18s",
            display: "block",
          }}>
            <div style={{ position: "absolute", top: 18, right: 18, width: 36, height: 36, borderRadius: 10, background: k.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={k.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={k.icon} /></svg>
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#a1a1aa", marginBottom: 12 }}>{k.label}</div>
            <div style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 1, marginBottom: 10, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "#a1a1aa", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: k.noteBg, color: k.noteColor }}>{k.note}</span>
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: k.accent, borderRadius: "0 0 18px 18px", opacity: 0, transition: "opacity 0.2s" }} className="kpi-accent" />
          </Link>
        ))}
      </div>

      {/* ── Main Grid: Work Orders + Fleet+Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)", gap: 16, alignItems: "start" }} className="dash-main-grid">
        {/* Active work orders */}
        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0f", letterSpacing: "-0.02em" }}>Aktif İş Emirleri</div>
              <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 2 }}>{data.stats.workOrders} açık · {data.stats.urgent} acil</div>
            </div>
            <Link href="/app/work-orders" style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>Tümünü gör →</Link>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            {data.recentWOs.length === 0 ? (
              <p style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center", padding: 24 }}>Aktif iş emri yok.</p>
            ) : data.recentWOs.slice(0, 6).map(wo => {
              const chip = STATUS_CHIP[wo.status] ?? STATUS_CHIP.PENDING;
              const iconBg = wo.status === "URGENT" ? "#fee2e2" : wo.status === "IN_PROGRESS" ? "#dbeafe" : wo.status === "DONE" ? "#f0fdf4" : "#f5f3ff";
              const iconColor = wo.status === "URGENT" ? "#b91c1c" : wo.status === "IN_PROGRESS" ? "#1d4ed8" : wo.status === "DONE" ? "#15803d" : "#7c3aed";
              const iconPath = wo.status === "DONE" ? "M20 6L9 17l-5-5" : wo.status === "URGENT" ? "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" : "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z";
              return (
                <Link key={wo.id} href={`/app/work-orders/${wo.id}`} className="wo-row" style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", border: "1px solid #e4e4e7", borderRadius: 12,
                  textDecoration: "none", color: "inherit", transition: "all 0.12s",
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={iconPath} /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0f", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {wo.code} — {wo.asset?.name ?? wo.customer.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#a1a1aa", marginTop: 2 }}>
                      {wo.type} · {wo.technician?.name ?? "Atanmadı"}
                    </div>
                  </div>
                  <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: chip.bg, color: chip.color, border: `1px solid ${chip.border}`, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {chip.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right column: Fleet + Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Fleet dark card */}
          <div style={{ background: "linear-gradient(140deg,#06102a,#1a56f0)", borderRadius: 16, padding: 20, color: "#fff" }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>Toplam Filo</div>
            <div style={{ fontSize: "3rem", fontWeight: 900, letterSpacing: "-0.07em", lineHeight: 1 }}>{data.stats.assets}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Kayıtlı asansör</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 14px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Riskli</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff" }}>{data.stats.risky}</div>
              </div>
              <div style={{ background: "rgba(220,38,38,0.18)", borderRadius: 12, padding: "10px 14px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,150,150,0.6)", marginBottom: 4 }}>Geciken</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fca5a5" }}>{data.stats.overdue}</div>
              </div>
            </div>
          </div>
          {/* Weekly summary */}
          <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0f", letterSpacing: "-0.02em" }}>Bu haftaki özet</div>
            </div>
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { k: "Müşteri portföyü",  v: `${data.stats.customers} müşteri` },
                { k: "Aktif iş akışı",     v: `${data.stats.workOrders} açık iş` },
                { k: "Acil müdahale",      v: `${data.stats.urgent} kayıt`, vc: data.stats.urgent > 0 ? "#dc2626" : undefined },
                { k: "Yaklaşan bakım",     v: `${data.stats.dueSoon} plan`, vc: data.stats.dueSoon > 0 ? "#d97706" : undefined },
              ].map(r => (
                <div key={r.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "#f9f9fb", borderRadius: 10, padding: "9px 13px", fontSize: 13 }}>
                  <span style={{ color: "#71717a", fontWeight: 500 }}>{r.k}</span>
                  <span style={{ fontWeight: 700, color: r.vc || "#0a0a0f" }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Grid: Overdue + Low Stock ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="dash-bottom-grid">
        {/* Overdue */}
        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0f", letterSpacing: "-0.02em" }}>Geciken Bakımlar</div>
              <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 2 }}>Tarih kaçırılan asansörler</div>
            </div>
            {data.overdueList.length > 0 && (
              <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 700 }}>{data.overdueList.length} kayıt</span>
            )}
          </div>
          <div style={{ padding: "16px 20px" }}>
            {data.overdueList.length === 0 ? (
              <p style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center", padding: 16 }}>Geciken bakım yok.</p>
            ) : data.overdueList.slice(0, 5).map(item => {
              const days = Math.floor((Date.now() - new Date(item.nextDueAt).getTime()) / 86400000);
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #e4e4e7" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: days > 30 ? "#ef4444" : "#f59e0b", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0f", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.asset.name}</div>
                    <div style={{ fontSize: 11.5, color: "#a1a1aa", marginTop: 1 }}>{item.asset.customer.name}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: days > 30 ? "#fee2e2" : "#fffbeb", color: days > 30 ? "#b91c1c" : "#b45309" }}>+{days} gün</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low stock */}
        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0f", letterSpacing: "-0.02em" }}>Stok Uyarıları</div>
            <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 2 }}>Minimum seviyenin altındaki parçalar</div>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            {data.lowStockParts.length === 0 ? (
              <p style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center", padding: 16 }}>Stok riski yok.</p>
            ) : data.lowStockParts.slice(0, 5).map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 14px", background: "#f9f9fb", borderRadius: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0f" }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: "#a1a1aa", marginTop: 1 }}>Min seviye: {p.minStock}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: p.stock <= 0 ? "#fef2f2" : "#fffbeb", color: p.stock <= 0 ? "#b91c1c" : "#b45309", border: `1px solid ${p.stock <= 0 ? "#fecaca" : "#fcd34d"}` }}>
                  {p.stock} adet
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        .kpi:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.07); }
        .kpi:hover .kpi-accent { opacity: 1; }
        .wo-row:hover { border-color: #bfdbfe !important; background: #fafbff; }
        @media (max-width: 900px) { .dash-main-grid { grid-template-columns: 1fr !important; } .dash-bottom-grid { grid-template-columns: 1fr !important; } }
      `}} />
    </div>
  );
}
