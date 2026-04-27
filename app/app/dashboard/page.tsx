"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type WO = { id: string; code: string; type: string; status: string; createdAt: string; customer: { name: string }; technician?: { name: string } | null; asset?: { name: string } | null };
type OD = { id: string; nextDueAt: string; asset: { name: string; customer: { name: string } } };
type LS = { id: string; name: string; stock: number; minStock: number };
type Resp = { stats: { customers: number; assets: number; workOrders: number; urgent: number; dueSoon: number; overdue: number; risky: number }; recentWOs: WO[]; overdueList: OD[]; lowStockParts: LS[]; invoiceSummary: { thisMonthTotal: number; thisMonthCount: number; trend: Array<{ month: string; total: number }> } };

const money = (v: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format((v ?? 0) / 100);

const STATUS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  PENDING:     { label: "Planlı",    bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  IN_PROGRESS: { label: "Yolda",     bg: "#fffbeb", color: "#b45309", border: "#fcd34d" },
  URGENT:      { label: "Acil",      bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
  DONE:        { label: "Tamamlandı",bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  CANCELED:    { label: "İptal",     bg: "#f4f4f5", color: "#52525b", border: "#d4d4d8" },
};

export default function DashboardPage() {
  const [data, setData]       = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/dashboard"); const j = await r.json();
        if (!r.ok) setError(j.error ?? "Yüklenemedi"); else setData(j);
      } catch { setError("Bağlantı hatası"); }
      finally { setLoading(false); }
    })();
  }, []);

  const monthlyTotal = useMemo(() => data?.invoiceSummary.thisMonthTotal ? money(data.invoiceSummary.thisMonthTotal) : "₺0", [data]);

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spin" />
      <style>{`.spin{width:32px;height:32px;border:3px solid #e4e4e7;border-top-color:#7c3aed;border-radius:50%;animation:s 0.7s linear infinite}@keyframes s{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (error || !data) return <ErrorBanner msg={error ?? "Veri alınamadı."} />;

  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" });

  // Trend max for chart scaling
  const trendMax = Math.max(...(data.invoiceSummary.trend?.map(t => t.total) ?? [1]), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── HERO HEADER ── */}
      <div style={{ background: "linear-gradient(135deg,#0a0a0f 0%,#1a1d2e 100%)", borderRadius: 20, padding: "28px 32px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, background: "radial-gradient(circle, rgba(124,58,237,0.18), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: 200, width: 300, height: 300, background: "radial-gradient(circle, rgba(37,99,235,0.12), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 18 }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>{today}</div>
            <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1 }}>Günün özeti</h1>
            <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.55)", maxWidth: 480 }}>
              Bakım ritmi, acil işler, tahsilat ve stok riski — tek bakışta.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/app/work-orders" style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff", fontSize: 13, fontWeight: 700,
              padding: "10px 18px", borderRadius: 10, textDecoration: "none",
              backdropFilter: "blur(10px)", transition: "all 0.15s",
            }}>
              İş emirleri →
            </Link>
            <Link href="/app/work-orders" style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "#fff", color: "#0a0a0f",
              fontSize: 13, fontWeight: 700,
              padding: "10px 18px", borderRadius: 10, textDecoration: "none",
              boxShadow: "0 4px 16px rgba(0,0,0,0.18)", transition: "all 0.15s",
            }}>
              + Yeni iş emri
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
        {[
          { label: "Aktif İş Emirleri", value: data.stats.workOrders, color: "#2563eb", iconBg: "#eff6ff", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4", trend: "+3 dünden", trendUp: true, href: "/app/work-orders" },
          { label: "Acil Müdahale",     value: data.stats.urgent, color: "#dc2626", iconBg: "#fef2f2", icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01", trend: "Öncelikli", trendUp: false, href: "/app/work-orders" },
          { label: "Yaklaşan Bakım",    value: data.stats.dueSoon, color: "#059669", iconBg: "#f0fdf4", icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z", trend: "Takvime bağlı", trendUp: true, href: "/app/maintenance-plans" },
          { label: "Aylık Gelir",       value: monthlyTotal, color: "#7c3aed", iconBg: "#f5f3ff", icon: "M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6", trend: `${data.invoiceSummary.thisMonthCount} fatura`, trendUp: true, href: "/app/invoices" },
        ].map((k, i) => (
          <Link key={i} href={k.href} className="kc" style={{
            background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16,
            padding: "20px 22px", textDecoration: "none", color: "inherit",
            position: "relative", overflow: "hidden", transition: "all 0.18s",
            display: "block",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: k.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={k.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={k.icon} /></svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: k.trendUp ? "#dcfce7" : "#fee2e2", color: k.trendUp ? "#15803d" : "#b91c1c", display: "flex", alignItems: "center", gap: 3 }}>
                <svg width={9} height={9} viewBox="0 0 12 12" fill="none"><path d={k.trendUp ? "M2 8l4-4 4 4" : "M2 4l4 4 4-4"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                {k.trend}
              </span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#a1a1aa", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: "2.3rem", fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 1, color: "#0a0a0f" }}>{k.value}</div>
          </Link>
        ))}
      </div>

      {/* ── REVENUE CHART + FLEET CARD ── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 16 }} className="g1">
        {/* Revenue chart */}
        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#a1a1aa", marginBottom: 6 }}>Gelir Trendi</div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.05em", color: "#0a0a0f", lineHeight: 1 }}>{monthlyTotal}</div>
              <div style={{ fontSize: 12.5, color: "#71717a", marginTop: 5 }}>Bu ay · {data.invoiceSummary.thisMonthCount} fatura</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "#dcfce7", color: "#15803d" }}>Son 6 ay</span>
          </div>
          {data.invoiceSummary.trend && data.invoiceSummary.trend.length > 0 ? (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
              {data.invoiceSummary.trend.map((t, i) => {
                const h = Math.max(8, (t.total / trendMax) * 100);
                const isLast = i === data.invoiceSummary.trend.length - 1;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div className="bar" style={{
                      width: "100%",
                      height: `${h}%`,
                      background: isLast ? "linear-gradient(180deg,#7c3aed,#2563eb)" : "linear-gradient(180deg,#e4e4e7,#f4f4f5)",
                      borderRadius: "6px 6px 2px 2px",
                      transition: "all 0.3s",
                    }} title={`${t.month}: ${money(t.total)}`} />
                    <div style={{ fontSize: 10.5, color: "#a1a1aa", fontWeight: 600 }}>{t.month}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#a1a1aa", fontSize: 13 }}>Henüz veri yok</div>
          )}
        </div>

        {/* Fleet card */}
        <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)", borderRadius: 16, padding: "22px 24px", color: "#fff", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -80, right: -80, width: 240, height: 240, background: "radial-gradient(circle, rgba(167,139,250,0.25), transparent 70%)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>Toplam Filo</div>
            <div style={{ fontSize: "3rem", fontWeight: 900, letterSpacing: "-0.07em", lineHeight: 1 }}>{data.stats.assets}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>Kayıtlı asansör</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 18 }}>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Riskli</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>{data.stats.risky}</div>
              </div>
              <div style={{ background: "rgba(220,38,38,0.18)", borderRadius: 10, padding: "11px 14px", border: "1px solid rgba(220,38,38,0.25)" }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,150,150,0.6)", marginBottom: 4 }}>Geciken</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fca5a5" }}>{data.stats.overdue}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTIVE WO + STATS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 16 }} className="g1">
        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid #f4f4f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0f", letterSpacing: "-0.02em" }}>Aktif İş Emirleri</div>
              <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{data.stats.workOrders} açık · {data.stats.urgent} acil</div>
            </div>
            <Link href="/app/work-orders" style={{ fontSize: 12, color: "#7c3aed", fontWeight: 700, textDecoration: "none" }}>Tümü →</Link>
          </div>
          <div>
            {data.recentWOs.length === 0 ? (
              <p style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center", padding: 30 }}>Aktif iş emri yok.</p>
            ) : data.recentWOs.slice(0, 5).map((wo, i) => {
              const sc = STATUS[wo.status] ?? STATUS.PENDING;
              return (
                <Link key={wo.id} href={`/app/work-orders/${wo.id}`} className="wo" style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "13px 22px",
                  borderBottom: i < data.recentWOs.length - 1 ? "1px solid #f4f4f5" : "none",
                  textDecoration: "none", color: "inherit", transition: "all 0.12s",
                }}>
                  <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11.5, fontWeight: 700, color: "#7c3aed", width: 50, flexShrink: 0 }}>{wo.code}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {wo.asset?.name ?? wo.customer.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#a1a1aa", marginTop: 2 }}>
                      {wo.customer.name} · {wo.technician?.name ?? "Atanmadı"}
                    </div>
                  </div>
                  <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {sc.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, padding: "22px 24px" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0f", letterSpacing: "-0.02em", marginBottom: 14 }}>Bu hafta</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { k: "Müşteri portföyü", v: `${data.stats.customers}`, ic: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z", c: "#2563eb", bg: "#eff6ff" },
              { k: "Aktif iş akışı",   v: `${data.stats.workOrders}`, ic: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4", c: "#7c3aed", bg: "#f5f3ff" },
              { k: "Acil müdahale",    v: `${data.stats.urgent}`, ic: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01", c: "#dc2626", bg: "#fef2f2" },
              { k: "Yaklaşan bakım",   v: `${data.stats.dueSoon}`, ic: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z", c: "#d97706", bg: "#fffbeb" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", background: "#fafbfc", borderRadius: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={r.c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={r.ic} /></svg>
                </div>
                <div style={{ flex: 1, fontSize: 13, color: "#374151", fontWeight: 500 }}>{r.k}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: r.c }}>{r.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── OVERDUE + LOW STOCK ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="g2">
        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid #f4f4f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0f", letterSpacing: "-0.02em" }}>Geciken Bakımlar</div>
              <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>Tarih kaçırılan asansörler</div>
            </div>
            {data.overdueList.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "#dc2626", padding: "3px 8px", borderRadius: 999 }}>{data.overdueList.length}</span>
            )}
          </div>
          <div style={{ padding: "8px 14px" }}>
            {data.overdueList.length === 0 ? (
              <p style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center", padding: 24 }}>Geciken bakım yok ✓</p>
            ) : data.overdueList.slice(0, 5).map((it, i) => {
              const days = Math.floor((Date.now() - new Date(it.nextDueAt).getTime()) / 86400000);
              return (
                <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 8px", borderBottom: i < 4 ? "1px solid #f4f4f5" : "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: days > 30 ? "#ef4444" : "#f59e0b", flexShrink: 0, boxShadow: `0 0 0 3px ${days > 30 ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)"}` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.asset.name}</div>
                    <div style={{ fontSize: 11.5, color: "#a1a1aa", marginTop: 1 }}>{it.asset.customer.name}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: days > 30 ? "#fef2f2" : "#fffbeb", color: days > 30 ? "#b91c1c" : "#b45309" }}>+{days}g</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid #f4f4f5" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0f", letterSpacing: "-0.02em" }}>Stok Uyarıları</div>
            <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>Minimum seviyenin altındaki parçalar</div>
          </div>
          <div style={{ padding: "8px 14px" }}>
            {data.lowStockParts.length === 0 ? (
              <p style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center", padding: 24 }}>Stok riski yok ✓</p>
            ) : data.lowStockParts.slice(0, 5).map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 8px", borderBottom: i < 4 ? "1px solid #f4f4f5" : "none" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: p.stock <= 0 ? "#fef2f2" : "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={p.stock <= 0 ? "#dc2626" : "#d97706"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0f" }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: "#a1a1aa", marginTop: 1 }}>Min: {p.minStock}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: p.stock <= 0 ? "#b91c1c" : "#b45309" }}>{p.stock}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .kc:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.07); border-color: #c7d2fe !important; }
        .wo:hover { background: #fafbfc; }
        .bar:hover { transform: scaleY(1.02); }
        @media (max-width: 900px) { .g1, .g2 { grid-template-columns: 1fr !important; } }
      `}} />
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "14px 18px", borderRadius: 12, fontSize: 13 }}>{msg}</div>;
}
