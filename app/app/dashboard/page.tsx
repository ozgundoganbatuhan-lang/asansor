"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, ErrorBanner, MetricCard, PageHeader, Pill, Spinner, StatLine, Button, Icon } from "@/components/ui";

type DashboardResponse = {
  stats: { customers: number; assets: number; workOrders: number; urgent: number; dueSoon: number; overdue: number; risky: number };
  recentWOs: Array<{ id: string; code: string; type: string; status: string; customer: { name: string }; technician?: { name: string } | null; asset?: { name: string } | null }>;
  overdueList: Array<{ id: string; nextDueAt: string; asset: { name: string; customer: { name: string } } }>;
  lowStockParts: Array<{ id: string; name: string; stock: number; minStock: number }>;
  invoiceSummary: { thisMonthTotal: number; thisMonthCount: number };
};

const STATUS_MAP: Record<string, { label: string; tone: "red" | "amber" | "green" | "gray" | "blue" }> = {
  URGENT:      { label: "Acil",       tone: "red"   },
  IN_PROGRESS: { label: "Devam",      tone: "amber" },
  DONE:        { label: "Tamamlandı", tone: "green" },
  PENDING:     { label: "Planlı",     tone: "gray"  },
  CANCELED:    { label: "İptal",      tone: "gray"  },
};
const TYPE_MAP: Record<string, string> = {
  FAULT: "Arıza", PERIODIC_MAINTENANCE: "Periyodik", ANNUAL_INSPECTION: "Yıllık", REVISION: "Revizyon", INSTALLATION: "Kurulum",
};
function money(v: number) { return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format((v ?? 0) / 100); }

function WorkOrderRow({ wo }: { wo: DashboardResponse["recentWOs"][0] }) {
  const st = STATUS_MAP[wo.status] ?? STATUS_MAP.PENDING;
  return (
    <Link href={`/app/work-orders/${wo.id}`} className="list-row" style={{ borderRadius: 0, padding: "12px 20px" }}>
      <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: "var(--primary-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4M9 5a2 2 0 012-2h2a2 2 0 012 2" size={15} color="var(--primary)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "monospace", fontSize: 11, background: "var(--gray-100)", padding: "1px 5px", borderRadius: 4, color: "var(--muted)" }}>{wo.code}</span>
          {wo.customer.name}
        </div>
        <div style={{ fontSize: 11, color: "var(--muted-2)", marginTop: 1 }}>
          {wo.asset?.name || "—"} · {wo.technician?.name || "Atanmadı"} · {TYPE_MAP[wo.type] ?? wo.type}
        </div>
      </div>
      <Pill tone={st.tone}>{st.label}</Pill>
    </Link>
  );
}

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res  = await fetch("/api/dashboard");
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Dashboard yüklenemedi."); setLoading(false); return; }
      setData(json); setLoading(false);
    })();
  }, []);

  const monthly = useMemo(() => data?.invoiceSummary.thisMonthTotal ? money(data.invoiceSummary.thisMonthTotal) : "₺0", [data]);

  if (loading) return <Spinner size={36} />;
  if (error || !data) return <ErrorBanner msg={error ?? "Veri alınamadı."} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeader
        title="Kontrol Merkezi"
        subtitle="Günlük operasyon özeti — acil işler, yaklaşan bakımlar ve ekip yükü."
        action={
          <Link href="/app/work-orders" className="btn btn-primary" style={{ textDecoration: "none" }}>
            <Icon d="M12 5v14M5 12h14" size={14} />
            Yeni İş Emri
          </Link>
        }
      />

      {/* KPI grid */}
      <div className="grid-4">
        <MetricCard label="Aktif İş Emri"    value={data.stats.workOrders}  note="Açık ve devam eden" href="/app/work-orders"       icon="📋" />
        <MetricCard label="Acil Müdahale"    value={data.stats.urgent}      note="Önce ele alın"      href="/app/work-orders"       icon="🚨" trend={data.stats.urgent > 0 ? "up" : "flat"} />
        <MetricCard label="Yaklaşan Bakım"   value={data.stats.dueSoon}     note="Bu hafta planlı"    href="/app/maintenance-plans" icon="📅" />
        <MetricCard label="Aylık Tahsilat"   value={monthly}                note={`${data.invoiceSummary.thisMonthCount} fatura`} href="/app/invoices" icon="💰" />
      </div>

      {/* Main 2-col */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="main-grid">

        {/* Blue summary card */}
        <div style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
          borderRadius: "var(--r-xl)", padding: 24, color: "#fff",
          boxShadow: "0 8px 32px rgba(37,99,235,0.25)",
          display: "flex", flexDirection: "column", gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Portföy özeti</div>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", marginTop: 6 }}>{data.stats.assets}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Kayıtlı asansör</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Müşteri", value: data.stats.customers },
              { label: "Riskli varlık", value: data.stats.risky },
              { label: "Geciken bakım", value: data.stats.overdue },
              { label: "Planlı bu hafta", value: data.stats.dueSoon },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.1)", borderRadius: "var(--r-md)", padding: "10px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
          <Link href="/app/assets" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff", fontSize: 12, fontWeight: 700, padding: "8px 14px",
            borderRadius: 999, textDecoration: "none", alignSelf: "flex-start",
          }}>
            <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" size={13} />
            Tüm asansörler
          </Link>
        </div>

        {/* Recent work orders */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Son İş Emirleri</h2>
              <p className="card-subtitle">Saha akışının canlı görünümü</p>
            </div>
            <Link href="/app/work-orders" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>Tümü</Link>
          </div>
          <div style={{ padding: 0 }}>
            {data.recentWOs.length === 0
              ? <div style={{ padding: 20 }}><p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>İş emri yok.</p></div>
              : data.recentWOs.slice(0, 5).map(wo => <WorkOrderRow key={wo.id} wo={wo} />)}
          </div>
        </div>
      </div>

      {/* Bottom 2-col */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="bottom-grid">
        {/* Overdue */}
        <Card title="Geciken Bakımlar" subtitle="Takvimi kaçan varlıklar">
          {data.overdueList.length === 0
            ? <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>✅ Geciken bakım yok.</p>
            : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.overdueList.slice(0, 5).map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--danger-soft)", borderRadius: "var(--r-md)", border: "1px solid #fecaca" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>{item.asset.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted-2)" }}>{item.asset.customer.name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--danger)" }}>{new Date(item.nextDueAt).toLocaleDateString("tr-TR")}</div>
                    </div>
                  </div>
                ))}
              </div>}
        </Card>

        {/* Low stock */}
        <Card title="Stok Uyarıları" subtitle="Minimum altında parçalar">
          {data.lowStockParts.length === 0
            ? <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>✅ Stok riski yok.</p>
            : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.lowStockParts.slice(0, 5).map(part => (
                  <div key={part.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="stat-row">
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{part.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted-2)" }}>Min: {part.minStock} adet</div>
                    </div>
                    <Pill tone={part.stock <= 0 ? "red" : "amber"}>{part.stock} adet</Pill>
                  </div>
                ))}
              </div>}
        </Card>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .main-grid, .bottom-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
