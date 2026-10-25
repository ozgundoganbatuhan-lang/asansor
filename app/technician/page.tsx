"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InstallApp from "@/components/InstallApp";

type WO = {
  id: string; code: string; type: string; status: string; priority?: string | null;
  note?: string | null; scheduledAt?: string | null; createdAt: string;
  customer: { name: string; address?: string | null; phone?: string | null };
  asset?: { name: string } | null;
  technician?: { name: string } | null;
};

const TYPE_LABEL: Record<string, string> = {
  FAULT: "Arıza", PERIODIC_MAINTENANCE: "Aylık bakım", ANNUAL_INSPECTION: "Yıllık kontrol", REVISION: "Revizyon", INSTALLATION: "Kurulum",
};
const STATUS: Record<string, { label: string; bg: string; color: string; bar: string; next?: string; nextLabel?: string }> = {
  URGENT:      { label: "Acil",       bg: "#FCECE8", color: "#A8301A", bar: "#C0311A", next: "IN_PROGRESS", nextLabel: "Yola çıktım" },
  PENDING:     { label: "Planlı",     bg: "#E4EFF9", color: "#1A4F80", bar: "#1A5C96", next: "IN_PROGRESS", nextLabel: "Yola çıktım" },
  IN_PROGRESS: { label: "Sahada",     bg: "#FFF3DC", color: "#8A5500", bar: "#C87800", next: "DONE",        nextLabel: "İşi tamamla" },
  DONE:        { label: "Tamamlandı", bg: "#E8F5EE", color: "#226440", bar: "#2E7D4F" },
  CANCELED:    { label: "İptal",      bg: "#F0EDE6", color: "#6E6455", bar: "#9C9080" },
};
const ORDER: Record<string, number> = { URGENT: 0, IN_PROGRESS: 1, PENDING: 2, DONE: 3, CANCELED: 4 };
const Ic = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);
const I = {
  pin: "M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  phone: "M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z",
  doc: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h4",
  refresh: "M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5",
  out: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  lift: "M6 2h12a1 1 0 011 1v18a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1zM12 2v20",
  clock: "M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};
function when(wo: WO) {
  const d = wo.scheduledAt ?? wo.createdAt;
  const dt = new Date(d), now = new Date();
  const sameDay = dt.toDateString() === now.toDateString();
  const t = dt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return sameDay ? `Bugün ${t}` : dt.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) + ` ${t}`;
}

function JobCard({ wo, i, onStatusChange }: { wo: WO; i: number; onStatusChange: (id: string, status: string) => void }) {
  const cfg = STATUS[wo.status] ?? STATUS.PENDING;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function advance() {
    if (!cfg.next) return;
    setBusy(true); setError(false);
    try {
      const r = await fetch(`/api/work-orders/${wo.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: cfg.next }) });
      if (!r.ok) throw new Error();
      if ("vibrate" in navigator) navigator.vibrate?.(15);
      onStatusChange(wo.id, cfg.next);
    } catch { setError(true); } finally { setBusy(false); }
  }

  return (
    <article className="tj" style={{ ["--bar" as string]: cfg.bar, animationDelay: `${Math.min(i, 8) * 40}ms` }}>
      <div className="tj-top">
        <span className="st" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
        <span className="tj-type">{TYPE_LABEL[wo.type] ?? wo.type}</span>
        <span className="tj-when"><Ic d={I.clock} size={12} />{when(wo)}</span>
      </div>
      <h3>{wo.customer.name}</h3>
      <p className="tj-asset"><Ic d={I.lift} size={13} />{wo.asset?.name ?? "Asansör belirtilmedi"} <span className="code">{wo.code}</span></p>
      {wo.note && <p className="tj-note">{wo.note}</p>}
      <div className="tj-links">
        {wo.customer.address && <a href={`https://maps.google.com/?q=${encodeURIComponent(wo.customer.address)}`} target="_blank" rel="noopener noreferrer"><Ic d={I.pin} size={14} />Yol tarifi</a>}
        {wo.customer.phone && <a href={`tel:${wo.customer.phone.replace(/\s/g, "")}`}><Ic d={I.phone} size={14} />Ara</a>}
        <Link href={`/app/work-orders/${wo.id}`}><Ic d={I.doc} size={14} />Servis formu</Link>
      </div>
      {cfg.next && (
        <button className={`tj-go${wo.status === "IN_PROGRESS" ? " done" : ""}`} onClick={advance} disabled={busy}>
          {busy ? "Kaydediliyor…" : cfg.nextLabel}
        </button>
      )}
      {error && <p className="tj-err" role="alert">Kaydedilemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.</p>}
    </article>
  );
}

export default function TechnicianPortal() {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [workOrders, setWorkOrders] = useState<WO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"active" | "done" | "all">("active");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const [meRes, woRes] = await Promise.all([fetch("/api/me"), fetch("/api/work-orders")]);
      if (!meRes.ok) { router.push("/auth/login"); return; }
      const me = await meRes.json().catch(() => ({}));
      setName((me.name || me.email || "").split(/[\s@]/)[0]);
      if (woRes.ok) { const j = await woRes.json().catch(() => ({})); setWorkOrders(j.items ?? []); }
      setErr(null);
    } catch { setErr("Bağlantı kurulamadı. İnternetinizi kontrol edip yenileyin."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  const isActive = (w: WO) => ["PENDING", "IN_PROGRESS", "URGENT"].includes(w.status);
  const list = workOrders
    .filter(w => filter === "all" ? true : filter === "done" ? w.status === "DONE" : isActive(w))
    .sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9) || +new Date(a.scheduledAt ?? a.createdAt) - +new Date(b.scheduledAt ?? b.createdAt));
  const counts = { active: workOrders.filter(isActive).length, done: workOrders.filter(w => w.status === "DONE").length, all: workOrders.length };
  const urgent = workOrders.filter(w => w.status === "URGENT").length;
  const hour = new Date().getHours();
  const greet = hour < 11 ? "Günaydın" : hour < 18 ? "İyi çalışmalar" : "İyi akşamlar";
  const today = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="tp">
      <style>{TP_CSS}</style>
      <header className="tp-head">
        <div className="tp-bar">
          <span className="tp-logo" aria-hidden>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="5" y="2.5" width="14" height="19" rx="2.5" stroke="#F5F2EC" strokeWidth="1.8" /><path d="M9 8.5l3-3 3 3M9 15.5l3 3 3-3" stroke="#F0C060" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <b>Saha ekranı</b>
          <button className="tp-ic" onClick={() => loadData(true)} aria-label="Yenile" disabled={refreshing}><span className={refreshing ? "spin" : ""}><Ic d={I.refresh} size={17} /></span></button>
          <button className="tp-ic" onClick={logout} aria-label="Çıkış yap"><Ic d={I.out} size={17} /></button>
        </div>
        <div className="tp-hello">
          <small>{today}</small>
          <h1>{greet}{name ? `, ${name}` : ""}</h1>
          <p>{loading ? "İşleriniz yükleniyor…" : counts.active === 0 ? "Bekleyen işiniz yok." : `${counts.active} açık iş${urgent ? `, ${urgent} tanesi acil` : ""}.`}</p>
        </div>
        <div className="tp-seg" role="tablist">
          {([["active", "Açık", counts.active], ["done", "Biten", counts.done], ["all", "Tümü", counts.all]] as const).map(([k, l, n]) => (
            <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{l} <em>{n}</em></button>
          ))}
        </div>
      </header>

      <main className="tp-list">
        {err && <div className="alert" role="alert">{err}</div>}
        {loading ? [0, 1, 2].map(i => <div key={i} className="skel" style={{ height: 150, borderRadius: 16 }} />)
          : list.length === 0 ? (
            <div className="empty2">
              <Ic d="M5 12l5 5L20 7" size={28} />
              <b>{filter === "active" ? "Açık iş yok" : "Kayıt yok"}</b>
              <p>{filter === "active" ? "Yeni iş atandığında burada görünecek." : "Farklı bir sekme seçin."}</p>
            </div>
          ) : list.map((wo, i) => <JobCard key={wo.id} wo={wo} i={i} onStatusChange={(id, s) => setWorkOrders(p => p.map(w => w.id === id ? { ...w, status: s } : w))} />)}
        <div className="tp-install"><InstallApp className="b b-line" label="Servisim'i telefona yükle" /></div>
      </main>
    </div>
  );
}

const TP_CSS = `
.tp{min-height:100dvh;background:var(--background);padding-bottom:calc(24px + env(safe-area-inset-bottom))}
.tp-head{background:var(--sidebar-bg);color:#F5F2EC;padding:calc(10px + env(safe-area-inset-top)) 16px 14px;position:relative;overflow:hidden}
.tp-head::after{content:"";position:absolute;right:-60px;top:-80px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(240,192,96,.16),transparent 65%);pointer-events:none}
.tp-bar{display:flex;align-items:center;gap:8px;max-width:640px;margin:0 auto}
.tp-bar b{font-size:14px;font-weight:750;flex:1}
.tp-logo{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
.tp-ic{width:36px;height:36px;border-radius:10px;border:0;background:rgba(255,255,255,.07);color:#F5F2EC;display:grid;place-items:center}
.tp-ic .spin{display:inline-flex;animation:spin .8s linear infinite}
.tp-hello{max-width:640px;margin:16px auto 14px;position:relative;z-index:1}
.tp-hello small{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(245,242,236,.5);font-weight:700}
.tp-hello h1{margin:4px 0 2px;font-size:24px;font-weight:800;letter-spacing:-.03em}
.tp-hello p{margin:0;font-size:14px;color:rgba(245,242,236,.7)}
.tp-seg{max-width:640px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;border-radius:12px;background:rgba(255,255,255,.07);position:relative;z-index:1}
.tp-seg button{height:36px;border:0;border-radius:9px;background:transparent;color:rgba(245,242,236,.65);font:inherit;font-size:13px;font-weight:650;transition:background .2s,color .2s}
.tp-seg button.on{background:#F5F2EC;color:#1B1F2B}
.tp-seg em{font-style:normal;opacity:.55;margin-left:3px}
.tp-list{max-width:640px;margin:0 auto;padding:14px 12px;display:grid;gap:10px}
.tj{position:relative;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:14px 14px 14px 18px;display:grid;gap:6px;overflow:hidden;animation:fadeUp .4s var(--ease-out) both}
.tj::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--bar)}
.tj-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.tj-type{font-size:12px;font-weight:650;color:var(--muted)}
.tj-when{margin-left:auto;display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--muted-2);font-variant-numeric:tabular-nums}
.tj h3{margin:2px 0 0;font-size:17px;font-weight:750;letter-spacing:-.02em}
.tj-asset{margin:0;display:flex;align-items:center;gap:6px;font-size:13px;color:var(--foreground-2)}
.tj-asset .code{margin-left:auto}
.tj-note{margin:2px 0 0;font-size:13px;color:var(--muted);background:var(--surface-2);border-radius:9px;padding:8px 10px}
.tj-links{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
.tj-links a{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 12px;border-radius:9px;background:var(--surface-2);font-size:13px;font-weight:650;color:var(--foreground)}
.tj-links a:active{transform:scale(.97)}
.tj-go{margin-top:6px;height:48px;border:0;border-radius:12px;background:var(--primary);color:#F5F2EC;font:inherit;font-size:15px;font-weight:750;transition:transform .15s var(--ease-out),opacity .2s}
.tj-go.done{background:var(--success)}
.tj-go:active{transform:scale(.98)}
.tj-go:disabled{opacity:.6}
.tj-err{margin:0;font-size:12.5px;color:var(--danger)}
.tp-install{display:flex;justify-content:center;margin-top:8px}
`;
