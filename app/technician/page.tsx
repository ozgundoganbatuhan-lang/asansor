"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
type Session = { userId: string; orgId: string; role: string; email: string };
type WO = {
  id: string; code: string; type: string; status: string; priority?: string | null;
  note?: string | null; scheduledAt?: string | null; createdAt: string;
  customer: { name: string; address?: string | null };
  asset?: { name: string; floor?: string | null; serialNumber?: string | null } | null;
  technician?: { name: string } | null;
};

// ─── Config ───────────────────────────────────────────────────────────────────
const TYPE_LABEL: Record<string, string> = {
  FAULT: "⚠️ Arıza", PERIODIC_MAINTENANCE: "🔧 Periyodik Bakım",
  ANNUAL_INSPECTION: "📋 Yıllık Kontrol", REVISION: "🔄 Revizyon", INSTALLATION: "🏗 Kurulum",
};
const STATUS_CFG: Record<string, { label: string; bg: string; color: string; next?: string; nextLabel?: string }> = {
  PENDING:     { label: "📅 Planlı",    bg: "#eff6ff", color: "#1d4ed8", next: "IN_PROGRESS", nextLabel: "Başlat" },
  IN_PROGRESS: { label: "🚗 Yolda",    bg: "#fffbeb", color: "#b45309", next: "DONE",        nextLabel: "Tamamla" },
  URGENT:      { label: "🚨 Acil",     bg: "#fef2f2", color: "#b91c1c", next: "IN_PROGRESS", nextLabel: "Başlat" },
  DONE:        { label: "✅ Tamam",    bg: "#f0fdf4", color: "#15803d" },
  CANCELED:    { label: "❌ İptal",    bg: "#f4f4f5", color: "#52525b" },
};
const PRIORITY_COLORS: Record<string, string> = { Acil: "#dc2626", Yüksek: "#d97706", Normal: "#059669" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ─── Compact Work Order Card ──────────────────────────────────────────────────
function WOCard({ wo, onStatusChange }: { wo: WO; onStatusChange: (id: string, status: string) => void }) {
  const cfg = STATUS_CFG[wo.status] ?? { label: wo.status, bg: "#f4f4f5", color: "#71717a" };
  const [updating, setUpdating] = useState(false);

  async function advance() {
    if (!cfg.next) return;
    setUpdating(true);
    try {
      await fetch(`/api/work-orders/${wo.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: cfg.next }),
      });
      onStatusChange(wo.id, cfg.next);
    } finally { setUpdating(false); }
  }

  return (
    <div style={{
      background: "#fff", border: "1px solid #e4e4e7", borderRadius: 18,
      overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      borderLeft: `4px solid ${cfg.color}`,
      transition: "transform 0.15s, box-shadow 0.15s",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 18px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#a1a1aa" }}>{wo.code}</span>
            <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}20`, borderRadius: 999, padding: "2px 10px", fontSize: 11.5, fontWeight: 700 }}>{cfg.label}</span>
            {wo.priority && wo.priority !== "Normal" && (
              <span style={{ background: `${PRIORITY_COLORS[wo.priority] ?? "#71717a"}15`, color: PRIORITY_COLORS[wo.priority] ?? "#71717a", borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                {wo.priority}
              </span>
            )}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0a0a0f", letterSpacing: "-0.02em", marginBottom: 4 }}>{wo.customer.name}</div>
          <div style={{ fontSize: 13, color: "#71717a" }}>{TYPE_LABEL[wo.type] ?? wo.type}</div>
        </div>
        {cfg.next && (
          <button onClick={advance} disabled={updating} style={{
            background: cfg.next === "DONE" ? "#059669" : "#2563eb",
            color: "#fff", border: "none", borderRadius: 10,
            padding: "9px 16px", fontSize: 12.5, fontWeight: 800,
            cursor: updating ? "not-allowed" : "pointer", whiteSpace: "nowrap",
            opacity: updating ? 0.7 : 1, fontFamily: "inherit", transition: "all 0.15s",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}>
            {updating ? "..." : (cfg.next === "DONE" ? "✅ " : "▶ ") + cfg.nextLabel}
          </button>
        )}
      </div>

      {/* Details */}
      <div style={{ padding: "0 18px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
        {wo.customer.address && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13 }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 0 }}>📍</span>
            <a href={`https://maps.google.com/?q=${encodeURIComponent(wo.customer.address)}`} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "underline", lineHeight: 1.4 }}>
              {wo.customer.address}
            </a>
          </div>
        )}
        {wo.asset && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#52525b" }}>
            <span style={{ fontSize: 15 }}>🛗</span>
            <span><b style={{ color: "#0a0a0f" }}>{wo.asset.name}</b>{wo.asset.floor ? ` · ${wo.asset.floor}` : ""}{wo.asset.serialNumber ? ` · S/N: ${wo.asset.serialNumber}` : ""}</span>
          </div>
        )}
        {wo.note && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: 9, padding: "8px 12px" }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>💬</span>
            <span style={{ color: "#92400e", lineHeight: 1.5 }}>{wo.note}</span>
          </div>
        )}
        {wo.scheduledAt && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#71717a" }}>
            <span>🕐</span> <span>Planlanan: <b style={{ color: "#0a0a0f" }}>{fmtDate(wo.scheduledAt)}</b></span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TechnicianPortalPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [workOrders, setWorkOrders] = useState<WO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"active" | "all" | "done">("active");
  const [refreshing, setRefreshing] = useState(false);
  const [time, setTime] = useState(new Date());

  // Clock
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 30000); return () => clearInterval(t); }, []);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [meRes, woRes] = await Promise.all([fetch("/api/me"), fetch("/api/work-orders")]);
      if (!meRes.ok) { router.push("/auth/login"); return; }
      const meJson = await meRes.json().catch(() => ({}));
      setSession(meJson.session);
      // Non-TECHNICIAN roles can still view but with a different message
      if (woRes.ok) {
        const woJson = await woRes.json().catch(() => ({}));
        setWorkOrders(woJson.items ?? []);
      }
    } catch { setErr("Bağlantı hatası. Sayfayı yenileyin."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  function handleStatusChange(id: string, newStatus: string) {
    setWorkOrders(prev => prev.map(w => w.id === id ? { ...w, status: newStatus } : w));
  }

  const filtered = workOrders.filter(w => {
    if (filter === "active") return ["PENDING", "IN_PROGRESS", "URGENT"].includes(w.status);
    if (filter === "done") return w.status === "DONE";
    return true;
  });

  const counts = {
    active: workOrders.filter(w => ["PENDING","IN_PROGRESS","URGENT"].includes(w.status)).length,
    done:   workOrders.filter(w => w.status === "DONE").length,
    all:    workOrders.length,
  };

  const today = time.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
  const timeStr = time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ minHeight: "100vh", background: "#f1f2f5", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* ── HEADER ── */}
      <header style={{ background: "#0a0a0f", color: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg,#2563eb,#7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0,
            }}>🛗</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: "-0.03em" }}>Servi<span style={{ color: "#60a5fa" }}>sim</span></div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>Teknisyen Portalı</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {refreshing && <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#60a5fa", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
            <button onClick={() => loadData(true)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "7px 13px", color: "rgba(255,255,255,0.7)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              🔄 Yenile
            </button>
            <Link href="/auth/logout" style={{ padding: "7px 13px", fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Çıkış</Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 20px 100px" }}>
        {/* ── GREETING ── */}
        <div style={{ background: "linear-gradient(135deg,#0a0a0f,#1a1d2e)", borderRadius: 20, padding: "24px", color: "#fff", marginBottom: 20, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "radial-gradient(circle,rgba(124,58,237,0.25),transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{today}</div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 4 }}>
              {session ? `Merhaba, ${session.email.split("@")[0]} 👋` : "Merhaba 👋"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 16 }}>
              Bugün <b style={{ color: "#60a5fa" }}>{counts.active}</b> aktif iş emrin var.
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Aktif", val: counts.active, color: "#60a5fa" },
                { label: "Tamamlanan", val: counts.done, color: "#34d399" },
                { label: "Toplam", val: counts.all, color: "rgba(255,255,255,0.5)" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "10px 16px", minWidth: 80 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: "-0.04em" }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
              <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "10px 16px" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "rgba(255,255,255,0.85)", letterSpacing: "-0.04em" }}>{timeStr}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2, fontWeight: 600 }}>Saat</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { icon: "📞", label: "Müşteri Ara", desc: "İş emrindeki numarayı çevir", href: "#" },
            { icon: "🗺", label: "Haritada Göster", desc: "Günlük rotanı görüntüle", href: "#" },
          ].map(a => (
            <Link key={a.label} href={a.href} style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 16, padding: "16px 18px", textDecoration: "none", display: "block", transition: "all 0.15s" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{a.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0f", marginBottom: 2 }}>{a.label}</div>
              <div style={{ fontSize: 12, color: "#71717a" }}>{a.desc}</div>
            </Link>
          ))}
        </div>

        {/* ── FILTER TABS ── */}
        <div style={{ display: "flex", gap: 4, background: "#e8e9ec", borderRadius: 12, padding: 4, marginBottom: 16 }}>
          {([
            { key: "active", label: `Aktif (${counts.active})` },
            { key: "done",   label: `Bitti (${counts.done})` },
            { key: "all",    label: `Tümü (${counts.all})` },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              flex: 1, padding: "9px 8px", borderRadius: 9, border: "none",
              background: filter === f.key ? "#fff" : "transparent",
              color: filter === f.key ? "#0a0a0f" : "#71717a",
              fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
              boxShadow: filter === f.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              fontFamily: "inherit",
            }}>{f.label}</button>
          ))}
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12, color: "#71717a", fontSize: 14 }}>
            <div style={{ width: 24, height: 24, border: "3px solid #e4e4e7", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            Yükleniyor...
          </div>
        ) : err ? (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, padding: "20px 24px", textAlign: "center", color: "#b91c1c", fontSize: 14 }}>
            ⚠️ {err}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 20, padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{filter === "done" ? "🎉" : "☀️"}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0a0a0f", marginBottom: 6 }}>
              {filter === "active" ? "Aktif iş emrin yok!" : filter === "done" ? "Henüz tamamlanan yok" : "Hiç iş emri yok"}
            </div>
            <div style={{ fontSize: 13, color: "#71717a" }}>
              {filter === "active" ? "Bugün planlanmış işlerin burada görünecek." : "Tamamlanan işler burada listelenir."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(wo => (
              <WOCard key={wo.id} wo={wo} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e4e4e7", display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 16px", height: 68, zIndex: 50, boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
        {[
          { icon: "📋", label: "İş Emirleri", active: true, action: () => setFilter("active") },
          { icon: "✅", label: "Tamamlananlar", active: false, action: () => setFilter("done") },
          { icon: "📞", label: "Ofis", active: false, action: () => {} },
          { icon: "👤", label: "Profil", active: false, action: () => {} },
        ].map(n => (
          <button key={n.label} onClick={n.action} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            background: "none", border: "none", cursor: "pointer", padding: "8px 12px",
            color: n.active ? "#2563eb" : "#a1a1aa", fontFamily: "inherit",
          }}>
            <span style={{ fontSize: 22 }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700 }}>{n.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        body { -webkit-font-smoothing: antialiased; margin: 0; }
        a:hover > div { box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important; transform: translateY(-2px); }
      `}</style>
    </div>
  );
}
