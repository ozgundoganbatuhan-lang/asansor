"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";

type WO = { id: string; code: string; type: string; status: string; createdAt: string; customer: { name: string }; technician?: { name: string } | null; asset?: { name: string } | null };
type OD = { id: string; nextDueAt: string; asset: { name: string; customer: { name: string } } };
type LS = { id: string; name: string; stock: number; minStock: number };
type Resp = { stats: { customers: number; assets: number; workOrders: number; urgent: number; dueSoon: number; overdue: number; risky: number }; recentWOs: WO[]; overdueList: OD[]; lowStockParts: LS[]; invoiceSummary: { thisMonthTotal: number; thisMonthCount: number; trend: Array<{ month: string; total: number }> } };

const I = ({ d, size = 16, stroke = "currentColor", sw = 1.75 }: { d: string; size?: number; stroke?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

const money = (v: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format((v ?? 0) / 100);

const WOS: Record<string, { label: string; bg: string; color: string; border: string; dot: string }> = {
  PENDING:     { label: "Planlı",     bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", dot: "#2563eb" },
  IN_PROGRESS: { label: "Yolda",      bg: "#fffbeb", color: "#b45309", border: "#fcd34d", dot: "#d97706" },
  URGENT:      { label: "Acil",       bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", dot: "#dc2626" },
  DONE:        { label: "Tamamlandı", bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", dot: "#059669" },
  CANCELED:    { label: "İptal",      bg: "#f4f4f5", color: "#52525b", border: "#d4d4d8", dot: "#71717a" },
};

/* ── Sparkline ──────────────────────────────────────────────────────────── */
function Sparkline({ data, color = "#2563eb", width = 56, height = 22 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * width, height - ((v - min) / range) * (height - 6) - 3]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = path + ` L${width},${height} L0,${height} Z`;
  const last = pts[pts.length - 1];
  const id = `sg${color.replace("#", "")}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ overflow: "visible" }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.25"/><stop offset="100%" stopColor={color} stopOpacity="0"/>
      </linearGradient></defs>
      <path d={area} fill={`url(#${id})`}/>
      <path d={path} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color}/>
    </svg>
  );
}

/* ── PulseDot ───────────────────────────────────────────────────────────── */
function PulseDot({ color = "#dc2626", size = 8 }: { color?: string; size?: number }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, flexShrink: 0 }}>
      <span style={{ position: "absolute", width: size * 2, height: size * 2, borderRadius: "50%", background: color, opacity: 0.25, animation: "pulse-ring 1.6s ease-out infinite" }}/>
      <span style={{ position: "relative", width: size, height: size, borderRadius: "50%", background: color, display: "block" }}/>
    </span>
  );
}

/* ── LiveClock ──────────────────────────────────────────────────────────── */
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const ss = String(time.getSeconds()).padStart(2, "0");
  return (
    <div style={{ fontFamily: "ui-monospace,monospace", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em" }}>
      {hh}<span style={{ opacity: 0.5, animation: "blink 1s step-end infinite" }}>:</span>{mm}<span style={{ opacity: 0.5, animation: "blink 1s step-end infinite" }}>:</span>{ss}
    </div>
  );
}

/* ── Animated counter ───────────────────────────────────────────────────── */
function useAnimCounter(target: number, duration = 1200, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number, start: number | null = null;
    const timeout = setTimeout(() => {
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(eased * target));
        if (p < 1) raf = requestAnimationFrame(step); else setVal(target);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return val;
}

/* ── KpiCard ────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, color = "#0a0a0f", iconBg = "#f4f4f5", icon, trend, trendUp, onClick, sparkData, sparkColor, delay = 0 }: {
  label: string; value: number | string; color?: string; iconBg?: string; icon?: string;
  trend?: string; trendUp?: boolean; onClick?: () => void; sparkData?: number[]; sparkColor?: string; delay?: number;
}) {
  const isNum = typeof value === "number";
  const animated = useAnimCounter(isNum ? (value as number) : 0, 1200, delay);
  const [hov, setHov] = useState(false);
  const displayVal = isNum ? animated : value;
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff", border: `1px solid ${hov ? "#c7d2fe" : "#e4e4e7"}`, borderRadius: 16, padding: "20px 22px",
        cursor: onClick ? "pointer" : "default", transition: "all 0.2s cubic-bezier(.16,1,.3,1)",
        transform: hov && onClick ? "translateY(-3px)" : "none",
        boxShadow: hov && onClick ? "0 12px 32px rgba(37,99,235,0.12)" : "0 1px 2px rgba(0,0,0,0.03)",
        position: "relative", overflow: "hidden",
      }}>
      {hov && onClick && <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: `${color}08`, pointerEvents: "none" }}/>}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon && <I d={icon} size={16} stroke={color}/>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          {trend !== undefined && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: trendUp ? "#dcfce7" : "#fee2e2", color: trendUp ? "#15803d" : "#b91c1c" }}>
              {trendUp ? "▲" : "▼"} {trend}
            </span>
          )}
          {sparkData && <Sparkline data={sparkData} color={sparkColor || color} width={52} height={20}/>}
        </div>
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#a1a1aa", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: "2.1rem", fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 1, color }}>{displayVal}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const [feed, setFeed] = useState([
    { id: 1, msg: "IE-2024-0048 acil durumuna alındı", time: "2dk önce", color: "#dc2626", icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" },
    { id: 2, msg: "Fatih Arslan IE-2024-0042'yi tamamladı", time: "8dk önce", color: "#059669", icon: "M5 13l4 4L19 7" },
    { id: 3, msg: "Yeni asansör eklendi: C Blok Asansör", time: "14dk önce", color: "#2563eb", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
    { id: 4, msg: "Tahrik Motoru stok uyarısı: 2 adet", time: "22dk önce", color: "#d97706", icon: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" },
    { id: 5, msg: "F-2024-0086 faturası ödendi", time: "35dk önce", color: "#7c3aed", icon: "M9 12l2 2 4-4" },
  ]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/dashboard"); const j = await r.json();
        if (!r.ok) setError(j.error ?? "Yüklenemedi"); else setData(j);
      } catch { setError("Bağlantı hatası"); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => { const t = setTimeout(() => setChartReady(true), 300); return () => clearTimeout(t); }, []);

  // Live feed simulation
  useEffect(() => {
    const MSGS = [
      { msg: "Mehmet Demir IE-2024-0047'ye başladı", color: "#d97706", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4" },
      { msg: "Kule A Asansör 2 muayene tarihi yaklaşıyor", color: "#dc2626", icon: "M8 2v4M16 2v4M3 10h18" },
      { msg: "Yeni iş emri: Otel Ana Asansör bakım", color: "#2563eb", icon: "M12 5v14M5 12h14" },
    ];
    let idx = 0;
    const t = setInterval(() => {
      const item = MSGS[idx % MSGS.length];
      setFeed(prev => [{ id: Date.now(), msg: item.msg, time: "Az önce", color: item.color, icon: item.icon }, ...prev.slice(0, 6)]);
      idx++;
    }, 15000);
    return () => clearInterval(t);
  }, []);

  const monthlyTotal = useMemo(() => data?.invoiceSummary.thisMonthTotal ? money(data.invoiceSummary.thisMonthTotal) : "₺0", [data]);
  const today = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #e4e4e7", borderTopColor: "#2563eb", borderRadius: "50%", animation: "srv-spin 0.7s linear infinite" }}/>
    </div>
  );
  if (error || !data) return <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "14px 18px", borderRadius: 12, fontSize: 13 }}>{error ?? "Veri alınamadı."}</div>;

  const trendMax = Math.max(...(data.invoiceSummary.trend?.map(t => t.total) ?? [1]), 1);
  const woSparkData = [5, 7, 6, 9, 8, 12, data.stats.workOrders];
  const urgSparkData = [1, 2, 1, 3, 2, 4, data.stats.urgent];
  const revSparkData = data.invoiceSummary.trend?.map(t => t.total) ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg,#0a0a0f 0%,#111827 50%,#1a1d2e 100%)", borderRadius: 20, padding: "28px 32px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -60, width: 320, height: 320, background: "radial-gradient(circle,rgba(124,58,237,0.22),transparent 65%)", animation: "orb-drift 8s ease-in-out infinite", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", bottom: -100, left: 160, width: 280, height: 280, background: "radial-gradient(circle,rgba(37,99,235,0.16),transparent 65%)", animation: "orb-drift2 10s ease-in-out infinite", pointerEvents: "none" }}/>
        <div style={{ position: "relative", display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)" }}>{today}</div>
              <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.15)" }}/>
              <LiveClock/>
              {data.stats.urgent > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 999, padding: "3px 10px" }}>
                  <PulseDot color="#ef4444" size={6}/>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fca5a5" }}>{data.stats.urgent} Acil</span>
                </div>
              )}
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, margin: "0 0 8px" }}>Günün özeti</h1>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.65, maxWidth: 440 }}>
              Bakım ritmi, acil işler, tahsilat ve stok riski — tek bakışta.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/app/work-orders" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 700, padding: "10px 18px", borderRadius: 10, textDecoration: "none", backdropFilter: "blur(12px)" }}>
              İş emirleri →
            </Link>
            <Link href="/app/work-orders" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", color: "#0a0a0f", fontSize: 13, fontWeight: 700, padding: "10px 18px", borderRadius: 10, textDecoration: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
              <I d="M12 5v14M5 12h14" size={13} stroke="#0a0a0f"/> Yeni iş emri
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ─────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
        <KpiCard label="Aktif İş Emirleri" value={data.stats.workOrders} color="#2563eb" iconBg="#eff6ff"
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4M9 12h6M9 16h4"
          trend="+3 bu hafta" trendUp sparkData={woSparkData} sparkColor="#2563eb" delay={0}
          onClick={() => window.location.href = "/app/work-orders"}/>
        <KpiCard label="Acil Müdahale" value={data.stats.urgent} color="#dc2626" iconBg="#fef2f2"
          icon="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"
          trend="Öncelikli" trendUp={false} sparkData={urgSparkData} sparkColor="#dc2626" delay={100}
          onClick={() => window.location.href = "/app/work-orders"}/>
        <KpiCard label="Yaklaşan Bakım" value={data.stats.dueSoon} color="#059669" iconBg="#f0fdf4"
          icon="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
          trend="30 gün içinde" trendUp sparkData={[2,3,4,3,5,4,data.stats.dueSoon]} sparkColor="#059669" delay={200}
          onClick={() => window.location.href = "/app/maintenance-plans"}/>
        <KpiCard label="Aylık Tahsilat" value={monthlyTotal} color="#7c3aed" iconBg="#f5f3ff"
          icon="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
          trend={`${data.invoiceSummary.thisMonthCount} fatura`} trendUp sparkData={revSparkData} sparkColor="#7c3aed" delay={300}
          onClick={() => window.location.href = "/app/invoices"}/>
      </div>

      {/* ── CHART + FLEET ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: 16 }} className="g1">
        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#a1a1aa" }}>Gelir Trendi</div>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.05em", color: "#0a0a0f", lineHeight: 1, marginTop: 6 }}>{monthlyTotal}</div>
              <div style={{ fontSize: 12.5, color: "#71717a", marginTop: 5, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d", background: "#dcfce7", padding: "2px 6px", borderRadius: 4 }}>▲ 33%</span>
                geçen aya göre
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}>Son 6 ay</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
            {data.invoiceSummary.trend?.map((t, i) => {
              const h = Math.max(6, (t.total / trendMax) * 100);
              const isLast = i === data.invoiceSummary.trend.length - 1;
              const isSecondLast = i === data.invoiceSummary.trend.length - 2;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 9.5, color: isLast ? "#7c3aed" : "transparent", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {isLast ? money(t.total) : "_"}
                  </div>
                  <div title={`${t.month}: ${money(t.total)}`} style={{
                    width: "100%", height: chartReady ? `${h}%` : "4px",
                    background: isLast ? "linear-gradient(180deg,#7c3aed,#2563eb)" : isSecondLast ? "linear-gradient(180deg,#c4b5fd,#a5b4fc)" : "linear-gradient(180deg,#e4e4e7,#efefef)",
                    borderRadius: "6px 6px 3px 3px", transition: `height ${0.4 + i * 0.07}s cubic-bezier(.16,1,.3,1)`, position: "relative",
                  }}>
                    {isLast && <div style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: "#fff", boxShadow: "0 0 0 2px #7c3aed" }}/>}
                  </div>
                  <div style={{ fontSize: 10.5, color: isLast ? "#7c3aed" : "#a1a1aa", fontWeight: isLast ? 700 : 500 }}>{t.month}</div>
                </div>
              );
            }) ?? <div style={{ color: "#a1a1aa", fontSize: 13, flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>Veri yok</div>}
          </div>
        </div>

        <div style={{ background: "linear-gradient(145deg,#0f172a 0%,#1e3a8a 100%)", borderRadius: 16, padding: "22px 24px", color: "#fff", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, background: "radial-gradient(circle,rgba(167,139,250,0.22),transparent 65%)", animation: "orb-drift 9s ease-in-out infinite" }}/>
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Toplam Filo</div>
            <div style={{ fontSize: "3.2rem", fontWeight: 900, letterSpacing: "-0.07em", lineHeight: 1, marginTop: 6 }}>{data.stats.assets}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>Kayıtlı asansör · {data.stats.customers} müşteri</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 18 }}>
              {[
                { k: "Riskli", v: data.stats.risky, bg: "rgba(220,38,38,0.18)", border: "rgba(220,38,38,0.28)", vc: "#fca5a5" },
                { k: "Geciken", v: data.stats.overdue, bg: "rgba(245,158,11,0.18)", border: "rgba(245,158,11,0.28)", vc: "#fcd34d" },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, borderRadius: 10, padding: "11px 13px", border: `1px solid ${s.border}` }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>{s.k}</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 900, color: s.vc }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTIVE WOs + LIVE FEED ────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: 16 }} className="g1">
        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid #f4f4f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0f", letterSpacing: "-0.02em" }}>Aktif İş Emirleri</div>
              <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{data.stats.workOrders} açık · <span style={{ color: "#dc2626", fontWeight: 700 }}>{data.stats.urgent} acil</span></div>
            </div>
            <Link href="/app/work-orders" style={{ fontSize: 12, color: "#7c3aed", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              Tümü <I d="M9 18l6-6-6-6" size={12} stroke="#7c3aed"/>
            </Link>
          </div>
          <div>
            {data.recentWOs.length === 0 ? (
              <p style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center", padding: 30 }}>Aktif iş emri yok.</p>
            ) : data.recentWOs.filter(w => w.status !== "DONE" && w.status !== "CANCELED").slice(0, 6).map((wo, i, arr) => {
              const sc = WOS[wo.status] ?? WOS.PENDING;
              return (
                <Link key={wo.id} href={`/app/work-orders/${wo.id}`}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 22px", borderBottom: i < arr.length - 1 ? "1px solid #f4f4f5" : "none", textDecoration: "none", color: "inherit", transition: "background .1s", position: "relative" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {wo.status === "URGENT"
                      ? <PulseDot color="#dc2626" size={8}/>
                      : <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc.dot }}/>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 11, fontWeight: 700, color: "#2563eb" }}>{wo.code}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wo.asset?.name ?? "Asansör atanmadı"}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#71717a" }}>{wo.customer.name} · {wo.technician?.name ?? "Atanmadı"}</div>
                  </div>
                  <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {sc.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid #f4f4f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0f", letterSpacing: "-0.02em" }}>Canlı Akış</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <PulseDot color="#059669" size={6}/>
              <span style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>Canlı</span>
            </div>
          </div>
          <div style={{ padding: "8px 0" }}>
            {feed.map((item, i) => (
              <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 18px", borderBottom: i < feed.length - 1 ? "1px solid #f9f9fb" : "none", animation: i === 0 ? "feedIn .3s cubic-bezier(.16,1,.3,1)" : "none" }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: `${item.color}15`, border: `1px solid ${item.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <I d={item.icon} size={13} stroke={item.color}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.4, fontWeight: 500 }}>{item.msg}</div>
                  <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 3 }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── QUICK STATS ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
        {[
          { k: "Müşteri",   v: data.stats.customers, c: "#2563eb", bg: "linear-gradient(135deg,#eff6ff,#dbeafe)", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z", href: "/app/customers" },
          { k: "Asansör",   v: data.stats.assets,    c: "#7c3aed", bg: "linear-gradient(135deg,#f5f3ff,#ede9fe)", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10", href: "/app/assets" },
          { k: "Yaklaşan",  v: data.stats.dueSoon,   c: "#059669", bg: "linear-gradient(135deg,#f0fdf4,#dcfce7)", icon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z", href: "/app/maintenance-plans" },
          { k: "Riskli",    v: data.stats.risky,     c: "#d97706", bg: "linear-gradient(135deg,#fffbeb,#fef3c7)", icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z", href: "/app/assets" },
          { k: "Geciken",   v: data.stats.overdue,   c: "#dc2626", bg: "linear-gradient(135deg,#fef2f2,#fee2e2)", icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01", href: "/app/maintenance-plans" },
          { k: "Raporlar",  v: "→",                  c: "#374151", bg: "linear-gradient(135deg,#f9fafb,#f3f4f6)", icon: "M3 3v18h18M9 17V9M14 17V5M19 17v-7", href: "/app/reports" },
        ].map((r, i) => (
          <Link key={i} href={r.href} style={{ textDecoration: "none", background: r.bg, borderRadius: 14, padding: "14px 16px", display: "block", border: "1px solid transparent", transition: "all .18s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 20px ${r.c}18`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <I d={r.icon} size={14} stroke={r.c}/>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: `${r.c}cc`, marginBottom: 4 }}>{r.k}</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.04em", color: r.c }}>{r.v}</div>
          </Link>
        ))}
      </div>

      {/* ── OVERDUE + LOW STOCK ───────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="g2">
        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid #f4f4f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0f" }}>Geciken Bakımlar</div>
              <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>Tarih geçmiş asansörler</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {data.overdueList.length > 0 && <PulseDot color="#dc2626" size={6}/>}
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "#dc2626", padding: "2px 8px", borderRadius: 999 }}>{data.overdueList.length}</span>
            </div>
          </div>
          <div style={{ padding: "8px 0" }}>
            {data.overdueList.length === 0 ? (
              <p style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center", padding: 30 }}>Geciken bakım yok ✓</p>
            ) : data.overdueList.slice(0, 5).map((it, i) => {
              const days = Math.floor((Date.now() - new Date(it.nextDueAt).getTime()) / 86400000);
              return (
                <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 22px", borderBottom: i < 4 ? "1px solid #f9f9fb" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: days > 30 ? "#ef4444" : "#f59e0b", flexShrink: 0, boxShadow: `0 0 0 3px ${days > 30 ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)"}` }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.asset.name}</div>
                    <div style={{ fontSize: 11.5, color: "#a1a1aa", marginTop: 1 }}>{it.asset.customer.name}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 7, background: days > 30 ? "#fef2f2" : "#fffbeb", color: days > 30 ? "#b91c1c" : "#b45309" }}>+{days}g</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid #f4f4f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0f" }}>Stok Uyarıları</div>
              <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>Minimum altındaki parçalar</div>
            </div>
            <Link href="/app/stock" style={{ fontSize: 12, color: "#7c3aed", fontWeight: 700, textDecoration: "none" }}>Stok →</Link>
          </div>
          <div style={{ padding: "8px 0" }}>
            {data.lowStockParts.length === 0 ? (
              <p style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center", padding: 30 }}>Stok riski yok ✓</p>
            ) : data.lowStockParts.slice(0, 5).map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 22px", borderBottom: i < 4 ? "1px solid #f9f9fb" : "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: p.stock <= 0 ? "#fef2f2" : "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                  <I d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" size={14} stroke={p.stock <= 0 ? "#dc2626" : "#d97706"}/>
                  {p.stock <= 0 && <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "#dc2626", border: "1.5px solid #fff" }}/>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0f" }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: "#a1a1aa", marginTop: 1 }}>Min: {p.minStock}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: p.stock <= 0 ? "#b91c1c" : "#b45309" }}>{p.stock}</div>
                  {p.stock <= 0 && <div style={{ fontSize: 9.5, fontWeight: 700, color: "#fff", background: "#dc2626", padding: "1px 5px", borderRadius: 3, marginTop: 2 }}>TÜKENDİ</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) { .g1, .g2 { grid-template-columns: 1fr !important; } }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:.6} 70%{transform:scale(2.2);opacity:0} 100%{transform:scale(2.2);opacity:0} }
        @keyframes orb-drift  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,15px) scale(1.1)} }
        @keyframes orb-drift2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(15px,-10px) scale(1.08)} }
        @keyframes feedIn     { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
        @keyframes blink      { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes srv-spin   { to { transform: rotate(360deg); } }
      `}}/>
    </div>
  );
}
