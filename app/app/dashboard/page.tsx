"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  ErrorBanner,
  MetricCard,
  PageHeader,
  Pill,
  Spinner,
  StatLine,
} from "@/components/ui";

/* ─────────────────────────── Types ─────────────────────────── */
type WorkOrder = {
  id: string;
  code: string;
  type: string;
  status: string;
  customer: { name: string };
  technician?: { name: string } | null;
  asset?: { name: string } | null;
};

type OverdueItem = {
  id: string;
  nextDueAt: string;
  asset: { name: string; customer: { name: string } };
};

type LowStockPart = {
  id: string;
  name: string;
  stock: number;
  minStock: number;
};

type DashboardResponse = {
  stats: {
    customers: number;
    assets: number;
    workOrders: number;
    urgent: number;
    dueSoon: number;
    overdue: number;
    risky: number;
  };
  recentWOs: WorkOrder[];
  overdueList: OverdueItem[];
  lowStockParts: LowStockPart[];
  invoiceSummary: {
    thisMonthTotal: number;
    thisMonthCount: number;
    trend: Array<{ month: string; total: number }>;
  };
};

/* ─────────────────────── Helpers ─────────────────────────── */
const STATUS_TONE: Record<string, "neutral" | "amber" | "red" | "green" | "blue"> = {
  PENDING:     "neutral",
  IN_PROGRESS: "amber",
  URGENT:      "red",
  DONE:        "green",
  CANCELED:    "neutral",
};

function money(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format((value ?? 0) / 100);
}

/* ─────────────────────── Component ─────────────────────────── */
export default function DashboardPage() {
  const [data,    setData]    = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch("/api/dashboard");
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Dashboard yüklenemedi.");
        } else {
          setData(json);
        }
      } catch {
        setError("Bağlantı hatası. Lütfen sayfayı yenileyin.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const monthlyTotal = useMemo(
    () => (data?.invoiceSummary.thisMonthTotal ? money(data.invoiceSummary.thisMonthTotal) : "₺0"),
    [data]
  );

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "50vh", alignItems: "center", justifyContent: "center" }}>
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorBanner msg={error ?? "Veri alınamadı."} />;
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Kontrol merkezi"
        subtitle="Bakım ritmini, acil işleri, tahsilat görünürlüğünü ve stok riskini tek bakışta yönetin. Ekran çok konuşmasın, doğru sinyali versin."
        action={
          <Link
            href="/app/work-orders"
            className="rounded-[20px] bg-[color:var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)]"
          >
            İş emirlerine git
          </Link>
        }
      />

      {/* ── KPI Metrics ── */}
      <section className="grid gap-4 lg:grid-cols-4">
        {[
          { label: "Aktif İş Emirleri", value: data.stats.workOrders, color: "#2563eb", accent: "blue", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4", iconBg: "#eff6ff", delta: "+3 dünden fazla", deltaUp: true, href: "/app/work-orders" },
          { label: "Acil / Bekleyen", value: data.stats.urgent, color: "#dc2626", accent: "red", icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01", iconBg: "#fef2f2", delta: "Öncelikli müdahale", deltaUp: false, href: "/app/work-orders" },
          { label: "Bu Ay Bakım", value: data.stats.dueSoon, color: "#059669", accent: "green", icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z", iconBg: "#f0fdf4", delta: "Takvime bağlı", deltaUp: true, href: "/app/maintenance-plans" },
          { label: "Aylık Gelir", value: monthlyTotal, color: "#7c3aed", accent: "purple", icon: "M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6", iconBg: "#f5f3ff", delta: `${data.invoiceSummary.thisMonthCount} fatura`, deltaUp: true, href: "/app/invoices" },
        ].map((kpi, i) => (
          <Link key={i} href={kpi.href} style={{ textDecoration: "none" }}>
            <div className="kpi-card panel-soft" style={{ padding: "20px 22px", cursor: "pointer", borderRadius: 18, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 18, right: 18, width: 36, height: 36, borderRadius: 10, background: kpi.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={kpi.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={kpi.icon} /></svg>
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#a1a1aa", marginBottom: 12 }}>{kpi.label}</div>
              <div style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 1, marginBottom: 10, color: kpi.color }}>{kpi.value}</div>
              <div style={{ fontSize: 12, color: "#a1a1aa", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: kpi.deltaUp ? "#dcfce7" : "#fee2e2", color: kpi.deltaUp ? "#15803d" : "#b91c1c" }}>{kpi.delta}</span>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {/* ── Main Grid ── */}
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        {/* Fleet overview */}
        <Card tone="soft" className="overflow-hidden">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[28px] bg-[linear-gradient(135deg,#07152d,#1456f0)] p-6 text-white shadow-[var(--shadow-soft)]">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/50">
                Bugünün resmi
              </div>
              <div className="mt-4 text-[2.6rem] font-black tracking-[-0.06em]">
                {data.stats.assets}
              </div>
              <div className="mt-2 text-sm text-white/75">Kayıtlı asansör</div>
              <div className="mt-6 space-y-3">
                <div className="rounded-[20px] bg-white/10 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em] text-white/50">Riskli varlık</div>
                  <div className="mt-1 text-xl font-black">{data.stats.risky}</div>
                </div>
                <div className="rounded-[20px] bg-white/10 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em] text-white/50">Geciken plan</div>
                  <div className="mt-1 text-xl font-black">{data.stats.overdue}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="card-caption">Öncelikli aksiyonlar</div>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[color:var(--foreground)]">
                  Ekip neye odaklanmalı?
                </h2>
                <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  Bu kart, sabah toplantısında ilk bakılan yer olmalı. Gürültü değil, net aksiyon gösterir.
                </p>
              </div>
              <StatLine label="Müşteri portföyü"    value={`${data.stats.customers} müşteri`} />
              <StatLine label="Aktif iş akışı"      value={`${data.stats.workOrders} açık iş`} />
              <StatLine label="Acil müdahale yükü"  value={`${data.stats.urgent} kayıt`} />
              <StatLine label="Yaklaşan bakım hacmi" value={`${data.stats.dueSoon} plan`} />
            </div>
          </div>
        </Card>

        {/* Recent work orders */}
        <Card
          title="Son iş emirleri"
          subtitle="Saha, müşteri ve durum görünürlüğü tek blokta."
        >
          <div className="space-y-3">
            {data.recentWOs.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">Son iş emri bulunamadı.</p>
            ) : (
              data.recentWOs.map(item => (
                <Link
                  key={item.id}
                  href={`/app/work-orders/${item.id}`}
                  className="flex items-center justify-between gap-4 rounded-[22px] border border-[color:var(--border)] bg-white px-4 py-4 transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-soft-2)]"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[color:var(--foreground)]">{item.code}</div>
                    <div className="mt-1 truncate text-sm text-[color:var(--muted)]">
                      {item.customer.name} · {item.asset?.name ?? "Asansör atanmadı"}
                    </div>
                    <div className="mt-1 text-xs text-[color:var(--muted-2)]">
                      {item.technician?.name ?? "Teknisyen atanmadı"} · {item.type}
                    </div>
                  </div>
                  <Pill tone={STATUS_TONE[item.status] ?? "neutral"}>{item.status}</Pill>
                </Link>
              ))
            )}
          </div>
        </Card>
      </section>

      {/* ── Bottom Grid ── */}
      <section className="grid gap-6 xl:grid-cols-2">
        {/* Overdue maintenance */}
        <Card
          title="Geciken bakım listesi"
          subtitle="Tarih kaçırılan varlıklar için odak listesi."
        >
          <div className="space-y-3">
            {data.overdueList.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">Geciken bakım görünmüyor.</p>
            ) : (
              data.overdueList.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-[22px] bg-[color:var(--surface-soft-2)] px-4 py-4"
                >
                  <div>
                    <div className="font-bold text-[color:var(--foreground)]">{item.asset.name}</div>
                    <div className="mt-1 text-sm text-[color:var(--muted)]">{item.asset.customer.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[color:var(--muted-2)]">
                      Son tarih
                    </div>
                    <div className="mt-1 text-sm font-bold text-[color:var(--foreground)]">
                      {new Date(item.nextDueAt).toLocaleDateString("tr-TR")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Low stock */}
        <Card
          title="Stok uyarıları"
          subtitle="Minimum seviyenin altındaki parçalar."
        >
          <div className="space-y-3">
            {data.lowStockParts.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">Stok riski görünmüyor.</p>
            ) : (
              data.lowStockParts.map(part => (
                <div
                  key={part.id}
                  className="flex items-center justify-between gap-4 rounded-[22px] bg-[color:var(--surface-soft-2)] px-4 py-4"
                >
                  <div>
                    <div className="font-bold text-[color:var(--foreground)]">{part.name}</div>
                    <div className="mt-1 text-sm text-[color:var(--muted)]">Minimum seviye: {part.minStock}</div>
                  </div>
                  <Pill tone={part.stock <= 0 ? "red" : "amber"}>{part.stock} adet</Pill>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
